import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import ordersRoutes from './routes/ordersRoutes.js';
import productsRoutes from './routes/productsRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', publicRoutes);
app.use('/api/admin', authRoutes);
app.use('/api/admin', ordersRoutes);
app.use('/api/admin', productsRoutes);
app.use('/api/admin', uploadRoutes);
app.use('/api/admin', settingsRoutes);

app.listen(PORT, () => {
  console.log(`Servidor a rodar na porta ${PORT}`);
});