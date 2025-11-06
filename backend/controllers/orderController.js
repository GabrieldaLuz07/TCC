import db from '../db.js';
import { sendEmail } from '../services/emailService.js';

const getAllOrders = async (req, res) => {
  try {
    const query = `
      SELECT
        p.*,
        json_agg(
          json_build_object(
            'iditempedido', ip.iditempedido,
            'produtoid', ip.idproduto,
            'quantidade', ip.quantidade,
            'precounitario', ip.precounitario, 
            'descricaopersonalizada', ip.descricaopersonalizada,
            'nomeproduto', CASE 
                              WHEN ip.idproduto IS NULL THEN 'Bolo Personalizado' 
                              ELSE prod.nome 
                            END,
            'precooriginal', prod.preco, 
            'precopromocional', prod.precopromocional 
          ) ORDER BY ip.iditempedido
        ) FILTER (WHERE ip.iditempedido IS NOT NULL) AS items
      FROM Pedidos p
      LEFT JOIN ItensPedido ip ON p.idpedido = ip.idpedido
      LEFT JOIN Produtos prod ON ip.idproduto = prod.idproduto
      GROUP BY p.idpedido
      ORDER BY p.datapedido DESC;
    `;
    const result = await db.query(query);
    res.status(200).json(result.rows || []);
  } catch (error) {
    console.error('Erro ao buscar pedidos detalhados:', error);
    res.status(500).json({ message: 'Erro interno ao buscar pedidos.' });
  }
};

const updateOrderStatus = async (req, res) => {
  const { idpedido } = req.params;
  const { status } = req.body;

  const allowedStatus = [
    'Pendente',
    'Aprovado',
    'Em Preparo',
    'Pronto para retirada',
    'Saiu para entrega',
    'Finalizado',
    'Cancelado'
  ];

  if (!status || !allowedStatus.includes(status)) {
    return res.status(400).json({ message: 'Status inválido fornecido.' });
  }

  try {
    const query = `
      UPDATE Pedidos
      SET status = $1
      WHERE idpedido = $2
      RETURNING *;
    `;

    const result = await db.query(query, [status, idpedido]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Pedido não encontrado.' });
    }

    const updatedOrder = result.rows[0];

    if (updatedOrder.emailcliente) {
      try {
        const emailSubject = `Atualização do seu Pedido`;
        const emailHtml = `
          <h1>Olá, ${updatedOrder.nomecliente}!</h1>
          <p>Temos uma novidade sobre o seu pedido.</p>
          <p>O status do seu pedido foi atualizado para: <strong>${updatedOrder.status}</strong></p>
          <p>Você pode acompanhar o seu pedido a qualquer momento com o seu e-mail e a sua chave de acompanhamento.</p>
          <br>
          <p>Obrigado por escolher a Doces da Lelê!</p>
        `;
        
        await sendEmail(updatedOrder.emailcliente, emailSubject, emailHtml);
      } catch (emailError) {
        console.error(`Falha ao enviar e-mail de atualização de status para ${updatedOrder.emailcliente}:`, emailError);
      }
    }

    res.status(200).json(updatedOrder);

  } catch (error) {
    console.error(`Erro ao atualizar o pedido #${idpedido}:`, error);
    res.status(500).json({ message: 'Erro interno ao atualizar o pedido.' });
  }
};

const deleteOrder = async (req, res) => {
  const { idpedido } = req.params;

  try {
    const result = await db.query('DELETE FROM Pedidos WHERE idpedido = $1', [idpedido]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Pedido não encontrado.' });
    }

    res.status(204).send();

  } catch (error) {
    console.error(`Erro ao excluir o pedido #${idpedido}:`, error);
    res.status(500).json({ message: 'Erro interno ao excluir o pedido.' });
  }
};

export {
  getAllOrders,
  updateOrderStatus,
  deleteOrder
};