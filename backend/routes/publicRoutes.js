import express from 'express';
import db from '../db.js';
import { QrCodePix } from 'qrcode-pix';
import QRCode from 'qrcode';
import { sendEmail } from '../src/services/emailService.js';

const router = express.Router();

function generateTrackingKey(length = 6) {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

router.post('/pix', async (req, res) => {
  const { valor } = req.body;

  if (!valor || isNaN(valor) || valor <= 0) {
    return res.status(400).json({ message: 'Valor inválido fornecido.' });
  }

  try {
    const qrCodePix = QrCodePix({
      version: '01',
      key: process.env.PIX_KEY,
      name: 'Doces da Lelê',
      city: 'PINHALZINHO',
      transactionId: `PEDIDO${Date.now()}`,
      message: 'Pedido da Confeitaria',
      value: parseFloat(valor),
    });

    const pixString = qrCodePix.payload();
    
    const qrCodeDataUrl = await QRCode.toDataURL(pixString);

    res.status(200).json({ qrCodeDataUrl });

  } catch (error) {
    console.error('Erro ao gerar QR Code PIX:', error);
    res.status(500).json({ message: 'Erro ao gerar QR Code.' });
  }
});

router.get('/availability', async (req, res) => {
  const capacidadeDiariaMinutos = 600;

  try {
    const ordersQuery = `
      SELECT
        p.idpedido,
        p.dataentrega,
        SUM(pr.tempopreparo * ip.quantidade) AS minutosproducaopedido
      FROM Pedidos p
      JOIN ItensPedido ip ON p.idpedido = ip.idpedido
      JOIN Produtos pr ON ip.idproduto = pr.idproduto
      WHERE p.dataentrega >= CURRENT_DATE AND ip.idproduto IS NOT NULL
      GROUP BY p.idpedido, p.dataentrega
      ORDER BY p.dataentrega ASC;
    `;
    const ordersResult = await db.query(ordersQuery);
    const allFutureOrders = ordersResult.rows;

    const dailyLoad = new Map();

    const getNextWorkday = (currentDate) => {
      const nextDay = new Date(currentDate);
      nextDay.setDate(nextDay.getDate() + 1);
      if (nextDay.getDay() === 6) nextDay.setDate(nextDay.getDate() + 2);
      if (nextDay.getDay() === 0) nextDay.setDate(nextDay.getDate() + 1);
      return nextDay;
    };

    for (const order of allFutureOrders) {
      let minutosRestantesDoPedido = parseInt(order.minutosproducaopedido, 10);
      if (isNaN(minutosRestantesDoPedido)) continue;
      
      let diaDeProducao = new Date(order.dataentrega);

      let safetyBreak = 0;
      while (minutosRestantesDoPedido > 0) {
        const diaFormatado = diaDeProducao.toISOString().split('T')[0];
        const cargaAtualDoDia = dailyLoad.get(diaFormatado) || 0;
        const capacidadeRestanteNoDia = capacidadeDiariaMinutos - cargaAtualDoDia;

        if (capacidadeRestanteNoDia > 0) {
          const minutosParaAlocar = Math.min(minutosRestantesDoPedido, capacidadeRestanteNoDia);
          dailyLoad.set(diaFormatado, cargaAtualDoDia + minutosParaAlocar);
          minutosRestantesDoPedido -= minutosParaAlocar;
        }

        if (minutosRestantesDoPedido > 0) {
          diaDeProducao = getNextWorkday(diaDeProducao);
        }
        safetyBreak++;
        if (safetyBreak > 1000) break;
      }
    }

    const dailyLoadObject = Object.fromEntries(dailyLoad.entries());
    res.status(200).json(dailyLoadObject);

  } catch (error) {
    console.error('Erro ao buscar disponibilidade:', error);
    res.status(500).json({ message: 'Erro ao buscar disponibilidade.' });
  }
});

router.get('/produtos', async (req, res) => {
  try {
    const query = 'SELECT * FROM Produtos WHERE disponivel = TRUE ORDER BY categoria, nome';
    const result = await db.query(query);

    const menuAgrupado = result.rows.reduce((acc, produto) => {
      const categoria = produto.categoria;
      if (!acc[categoria]) {
        acc[categoria] = [];
      }
      acc[categoria].push(produto);
      return acc;
    }, {});

    const destaques = result.rows.filter(produto => produto.destaque === true);

    const respostaFinal = {
      Destaques: destaques,
      ...menuAgrupado,
      Bolo: [],
    };
    
    res.status(200).json(respostaFinal);
  } catch (error) {
    console.error('Erro ao buscar o cardápio:', error);
    res.status(500).json({ message: 'Erro ao carregar o cardápio.' });
  }
});

router.post('/pedidos', async (req, res) => {
  const { items, total, deliveryMethod, address, paymentInfo, customer, dataEntrega } = req.body;
  const capacidadeDiariaMinutos = 600;

  if (!dataEntrega) {
    return res.status(400).json({ message: 'A data de entrega é obrigatória.' });
  }
  if (!customer || !customer.nome || !customer.telefone || !customer.email) {
    return res.status(400).json({ message: 'Nome, telefone e e-mail do cliente são obrigatórios.' });
  }

  const client = await db.getClient();

  try {
    let minutosDoNovoPedido = 0;
    for (const item of items) {
      if (item.tempopreparo) {
        minutosDoNovoPedido += (parseInt(item.tempopreparo, 10) * item.quantity);
      }
    }
    
    const availabilityQuery = `
      SELECT SUM(pr.tempopreparo * ip.quantidade) AS minutos_totais
      FROM Pedidos p
      JOIN ItensPedido ip ON p.idpedido = ip.idpedido
      JOIN Produtos pr ON ip.idproduto = pr.idproduto
      WHERE p.dataentrega = $1 AND ip.idproduto IS NOT NULL
    `;
    const availResult = await client.query(availabilityQuery, [dataEntrega]);
    const cargaAtualDoDia = parseInt(availResult.rows[0].minutos_totais, 10) || 0;

    if ((cargaAtualDoDia + minutosDoNovoPedido) > capacidadeDiariaMinutos) {
      return res.status(400).json({ message: 'Este dia não possui capacidade suficiente para o seu pedido. Por favor, escolha outra data.' });
    }

    const chavePedido = generateTrackingKey();

    await client.query('BEGIN');

    const pedidoQuery = `
      INSERT INTO Pedidos (
        nomecliente, contatocliente, emailcliente, valortotal, status, datapedido, 
        metodopagamento, trocopara, metodoentrega, dataentrega,
        enderecorua, endereconumero, enderecobairro, enderecocidade, enderecocomplemento,
        chaveacompanhamento
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING idpedido;
    `;
    const pedidoValues = [
      customer.nome,
      customer.telefone,
      customer.email,
      total,
      'Pendente',
      new Date(),
      paymentInfo.method,
      paymentInfo.changeFor,
      deliveryMethod,
      dataEntrega,
      address ? address.rua : null,
      address ? address.numero : null,
      address ? address.bairro : null,
      address ? address.cidade : null,
      address ? address.complemento : null,
      chavePedido
    ];
    const newPedido = await client.query(pedidoQuery, pedidoValues);
    const newPedidoId = newPedido.rows[0].idpedido;

    for (const item of items) {
      const itemQuery = `
        INSERT INTO itenspedido (idpedido, idproduto, quantidade, precounitario, descricaopersonalizada)
        VALUES ($1, $2, $3, $4, $5);
      `;
      const itemValues = [newPedidoId, item.idproduto, item.quantity, item.preco, item.descricao];
      await client.query(itemQuery, itemValues);
    }

    await client.query('COMMIT');

    const emailSubject = `Confirmação do seu Pedido #${newPedidoId}`;
    const emailHtml = `
      <h1>Olá, ${customer.nome}!</h1>
      <p>O seu pedido #${newPedidoId} foi recebido com sucesso.</p>
      <p>Valor Total: <strong>R$ ${total.toFixed(2)}</strong></p>
      <p>A sua chave para acompanhar o pedido é: <strong>${chavePedido}</strong></p>
      <p>Entraremos em contacto em breve pelo telefone ${customer.telefone} para confirmar os detalhes.</p>
      <br>
      <p>Obrigado por escolher a Doces da Lelê!</p>
    `;
    
    await sendEmail(customer.email, emailSubject, emailHtml);

    res.status(201).json({ message: 'Pedido criado com sucesso!', pedidoId: newPedidoId });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ message: 'Erro interno ao processar o pedido.' });
  } finally {
    client.release();
  }
});

router.get('/tamanhosbolo', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM tamanhosbolo ORDER BY valor ASC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar tamanhos de bolo:', error);
    res.status(500).json({ message: 'Erro ao buscar tamanhos de bolo.' });
  }
});

router.get('/massasbolo', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM massasbolo ORDER BY nome ASC');
    res.status(200).json(result.rows || []);
  } catch (error) {
    console.error('Erro ao buscar massas de bolo:', error);
    res.status(500).json({ message: 'Erro ao buscar massas de bolo.' });
  }
});

router.get('/recheiosbolo', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM recheiosbolo ORDER BY valoradicional ASC');
    res.status(200).json(result.rows || []);
  } catch (error) {
    console.error('Erro ao buscar recheios de bolo:', error);
    res.status(500).json({ message: 'Erro ao buscar recheios de bolo.' });
  }
});

router.get('/coberturasbolo', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM coberturasbolo ORDER BY nome ASC');
    res.status(200).json(result.rows || []);
  } catch (error) {
    console.error('Erro ao buscar coberturas de bolo:', error);
    res.status(500).json({ message: 'Erro ao buscar coberturas de bolo.' });
  }
});

export default router;