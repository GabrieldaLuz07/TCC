import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/pedidos', async (req, res) => {
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
          )
        ) AS items
      FROM Pedidos p
      LEFT JOIN ItensPedido ip ON p.idpedido = ip.idpedido
      LEFT JOIN Produtos prod ON ip.idproduto = prod.idproduto
      GROUP BY p.idpedido
      ORDER BY p.datapedido DESC;
    `;
    const result = await db.query(query);
    res.status(200).json(result.rows || []);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    res.status(500).json({ message: 'Erro interno ao buscar pedidos.' });
  }
});

router.put('/pedidos/:idpedido', async (req, res) => {
  const { idpedido } = req.params;
  const { status } = req.body;

  const allowedStatus = ['Pendente', 'Em Preparo', 'Pronto para Retirada', 'Finalizado', 'Cancelado'];
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

    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error(`Erro ao atualizar o pedido #${idpedido}:`, error);
    res.status(500).json({ message: 'Erro interno ao atualizar o pedido.' });
  }
});

router.delete('/pedidos/:idpedido', async (req, res) => {
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
});

export default router;