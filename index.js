import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import cors from 'cors';
import authRoutes from "./routes/auth.js";
// import limiter from './routes/RateLimiterMiddleware.js';
import { rateLimit } from 'express-rate-limit'

const app = express();
dotenv.config(); 
const corsOptions = {
  origin: ['https://al-arqam-academy.vercel.app', 
  'https://alarqam-academy-dashboard.vercel.app',
  'https://admin.alarqamacademy.org',
  'localhost:3000',
  'https://alarqamacademy.org','https://www.alarqamacademy.org'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: '*',
};
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
// app.use(express.json());
app.use((req, res, next) => {
  if (req.path === '/api/webhook') {
    next(); 
  } else {
    express.json()(req, res, next);
  }
});
app.use(cors(corsOptions));
app.use(limiter)
app.use('/api', authRoutes);

const PORT = process.env.PORT || 5555;
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
