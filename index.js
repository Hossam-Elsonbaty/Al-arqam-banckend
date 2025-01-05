import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import cors from 'cors';
import authRoutes from "./routes/auth.js";
const app = express();
dotenv.config();

app.use(express.json());

const corsOptions = {
  origin: '*',
  // origin: ['http://localhost:3000', 'https://al-arqam-academy.vercel.app', 'https://alarqam-academy-dashboard.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: '*',
};

app.use(cors(corsOptions));
const PORT = process.env.PORT || 5555;

app.use('/api', authRoutes);
const startServer = async () => {
  try {
    await connectDB(); 
    console.log('Database connected successfully.');
    app.listen(PORT, () => {
      console.log(`App is listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    process.exit(1); 
  }
};
startServer();

