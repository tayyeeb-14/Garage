import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { authErrorHandler } from './middleware/authErrorHandler.js';
import healthRoutes from './routes/healthRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import authRoutes from './routes/authRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5000;
const isDevelopment = (process.env.NODE_ENV ?? 'development') === 'development';
const rateLimitConfig = isDevelopment
  ? {
      windowMs: 15 * 60 * 1000,
      max: 2000,
      standardHeaders: true,
      legacyHeaders: false,
    }
  : {
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
    };

app.use(helmet());
app.use(cors({ origin: '*', credentials: false }));
app.use(express.json());
app.use(morgan('dev'));
app.use(rateLimit(rateLimitConfig));

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/banners', bannerRoutes);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'M Enterprises API' });
});

app.get('/', (_req, res) => {
  res.status(200).json({ message: 'Welcome to M Enterprises API' });
});

app.use(notFound);
app.use(authErrorHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.warn('MONGO_URI is not set. Server will run without database connection.');
    } else {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('MongoDB connected successfully');
    }

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
