import db from '../db.js';

const getAllProducts = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM Produtos ORDER BY nome');
    res.status(200).json(result.rows || []);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar produtos.' });
  }
};

const createProduct = async (req, res) => {
  const { nome, descricao, categoria, preco, unidademedida, tempopreparo, disponivel, destaque, precopromocional, imagemurl } = req.body;

  if (!nome || !categoria || !preco || !unidademedida || tempopreparo === undefined) {
    return res.status(400).json({ message: 'Campos obrigatórios estão faltando.' });
  }

  try {
    const query = `
      INSERT INTO Produtos (nome, descricao, categoria, preco, unidademedida, tempopreparo, disponivel, destaque, precopromocional, imagemurl)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const values = [nome, descricao, categoria, preco, unidademedida, tempopreparo, disponivel, destaque, precopromocional, imagemurl];
    const result = await db.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao cadastrar produto:', error);
    res.status(500).json({ message: 'Erro ao cadastrar produto.' });
  }
};

const updateProduct = async (req, res) => {
  const { idproduto } = req.params;
  const { nome, descricao, categoria, preco, unidademedida, tempopreparo, disponivel, destaque, precopromocional, imagemurl } = req.body;

  if (!nome || !categoria || !preco || !unidademedida || tempopreparo === undefined) {
    return res.status(400).json({ message: 'Campos obrigatórios estão faltando.' });
  }

  try {
    const query = `
      UPDATE Produtos
      SET nome = $1, descricao = $2, categoria = $3, preco = $4, unidademedida = $5, tempopreparo = $6, disponivel = $7, destaque = $8, precopromocional = $9, imagemurl = $10
      WHERE idproduto = $11
      RETURNING *;
    `;
    const values = [nome, descricao, categoria, preco, unidademedida, tempopreparo, disponivel, destaque, precopromocional, imagemurl, idproduto];
    const result = await db.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar produto.' });
  }
};

const deleteProduct = async (req, res) => {
  const { idproduto } = req.params;

  try {
    const result = await db.query('DELETE FROM Produtos WHERE idproduto = $1', [idproduto]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    res.status(500).json({ message: 'Erro ao excluir produto. Verifique se ele não está em um pedido existente.' });
  }
};

export {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct
};