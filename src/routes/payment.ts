import express from "express";
 
import { adminOnly } from "../middlewares/auth.js";
import { allCoupon, applyDiscount, createPaymentIntent, deleteCoupon, newCoupon } from "../controllers/payment.js";
 
const app = express.Router();


app.post("/create",createPaymentIntent)

app.get("/discount", applyDiscount);
app.post("/coupon/new", adminOnly,newCoupon);
app.get("/coupon/all", adminOnly,allCoupon);
app.get("/coupon/:id", adminOnly,deleteCoupon);
 
 


export default app;