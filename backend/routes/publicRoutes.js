import express from 'express';
import db from '../db.js';
import { QrCodePix } from 'qrcode-pix'; 
import QRCode from 'qrcode';

const router = express.Router();

router.get('/configuracoes', async (req, res) => {
  try {
    const result = await db.query('SELECT nomeloja, logourl, corprincipal FROM configuracoes WHERE idconfiguracao = 1');
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Configurações não encontradas.' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar configurações públicas:', error);
    res.status(500).json({ message: 'Erro ao buscar configurações.' });
  }
});

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
      JOIN Produtos pr ON CAST(ip.idproduto AS BIGINT) = pr.idproduto
      WHERE p.dataentrega >= CURRENT_DATE
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
      let diaDeProducao = new Date(order.dataentrega);

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
      }
    }

    const diasBloqueados = [];
    for (const [dia, carga] of dailyLoad.entries()) {
      if (carga >= capacidadeDiariaMinutos) {
        diasBloqueados.push(dia.replace(/-/g, '/'));
      }
    }

    console.log('Pedidos futuros encontrados:', allFutureOrders.length);
    console.log('Calendário de produção (dailyLoad):', dailyLoad);
    console.log('Dias que serão bloqueados:', diasBloqueados);

    res.status(200).json(diasBloqueados);

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
      ...menuAgrupado
    };
    
    res.status(200).json(respostaFinal);
  } catch (error) {
    console.error('Erro ao buscar o cardápio:', error);
    res.status(500).json({ message: 'Erro ao carregar o cardápio.' });
  }
});

router.post('/pedidos', async (req, res) => {
  const { items, total, deliveryMethod, address, paymentInfo, customer, dataEntrega } = req.body;

  if (!dataEntrega) {
    return res.status(400).json({ message: 'A data de entrega é obrigatória.' });
  }

  if (!customer || !customer.nome || !customer.telefone) {
    return res.status(400).json({ message: 'Nome e telefone do cliente são obrigatórios.' });
  }

  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const pedidoQuery = `
      INSERT INTO Pedidos (nomecliente, contatocliente, valortotal, status, datapedido, metodopagamento, trocopara, metodoentrega, dataentrega,
        enderecorua, endereconumero, enderecobairro, enderecocidade, enderecocomplemento)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING idpedido;
    `;
    const pedidoValues = [
      customer.nome,
      customer.telefone,
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
      address ? address.complemento : null
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