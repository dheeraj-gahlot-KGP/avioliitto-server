
import express, { Request,Response, NextFunction } from 'express';

import userRoutes from './routes/user.js'
import productRoutes from './routes/product.js'
import orderRoutes from './routes/order.js'
import paymentRoutes from './routes/payment.js'
import dashboardRoutes from './routes/stats.js'
import { connectDB } from './utils/features.js';
import { errorMiddleware } from './middlewares/error.js';
import NodeCache from 'node-cache';
import { config } from 'dotenv';
import morgan from 'morgan';
import Stripe from 'stripe';
import cors from 'cors';



config({
    path:"./.env",
})
 
const port = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI|| "";
const stripeKey = process.env.STRIPE_KEY|| "";
connectDB(MONGO_URI);
export const stripe = new Stripe(stripeKey);
export const myCache = new NodeCache();
const app = express(); 
app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

app.use("/api/v1/user" , userRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);


app.use("/uploads",express.static("uploads"));
app.use(errorMiddleware); 

app.listen(port,() =>{
    console.log(`Express Server is working on http://localhost:${port}`)
})