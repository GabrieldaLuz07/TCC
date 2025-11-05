import nodemailer from 'nodemailer';
import 'dotenv/config';

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendEmail = async (customerEmail, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Doces da Lelê" <${process.env.MAIL_USER}>`, 
      to: customerEmail, 
      subject: subject,
      html: html,
    });

    console.log('E-mail enviado com sucesso: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    throw error;
  }
};

export { sendEmail };