import db from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const loginUser = async (req, res) => {
  const { documento, senha } = req.body;

  if (!documento || !senha) {
    return res.status(400).json({ message: 'Documento e senha são obrigatórios.' });
  }

  try {
    const result = await db.query('SELECT * FROM Login WHERE cpfcnpj = $1', [documento]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const senhaValida = await bcrypt.compare(senha, user.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
      { userId: user.idlogin },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(200).json({ token });

  } catch (error) {
    console.error('Erro no servidor durante o login:', error);
    res.status(500).json({ message: 'Ocorreu um erro interno.' });
  }
};

export {
  loginUser
};