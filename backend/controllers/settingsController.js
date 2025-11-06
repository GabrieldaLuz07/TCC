import db from '../db.js';

const getSettings = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM configuracoes WHERE idconfiguracao = 1');
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Configurações não encontradas.' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({ message: 'Erro ao buscar configurações.' });
  }
};

const updateSettings = async (req, res) => {
  const { nomeloja, logourl, corprincipal, chavepix } = req.body;

  if (!nomeloja || !corprincipal) {
    return res.status(400).json({ message: 'Nome da loja e cor principal são obrigatórios.' });
  }

  try {
    const query = `
      UPDATE configuracoes
      SET nomeloja = $1, logourl = $2, corprincipal = $3, chavepix = $4
      WHERE idconfiguracao = 1
      RETURNING *;
    `;
    const values = [nomeloja, logourl, corprincipal, chavepix];
    const result = await db.query(query, values);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(500).json({ message: 'Erro ao atualizar configurações.' });
  }
};

export {
  getSettings,
  updateSettings
};