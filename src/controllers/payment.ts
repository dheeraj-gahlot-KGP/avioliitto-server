import { stripe } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Coupon } from "../model/coupon.js";
import ErrorHandler from "../utils/utility-class.js";



export const createPaymentIntent = TryCatch(async(req,res,next) =>{
     
    const { amount} = req.body;
    
    if(!amount) return next(new ErrorHandler("Please Enter amount",400));
    const paymentIntent = await stripe.paymentIntents.create({amount:Number(amount)*100 , currency:"INR"});

   
    return res.status(201).json({
        success: true,
        client_secret : paymentIntent.client_secret,
    })


})


export const newCoupon = TryCatch(async(req,res,next) =>{
     
    const {coupon , amount} = req.body;

    if(!coupon ||!amount) return next(new ErrorHandler("Please enter Coupon and amount both",400));
    await Coupon.create({code :coupon,amount});
   
    return res.status(201).json({
        success: true,
        message:"Coupon creating successful",
    })


})

export const applyDiscount = TryCatch(async(req,res,next) =>{
     
    const {coupon} = req.query;
    

    const discount = await Coupon.findOne({code:coupon});
    
    if(!discount) return next(new ErrorHandler("Invalid Coupon Code",400));
  
   
    return res.status(201).json({
        success: true,
        discount : discount.amount,
    })


})
export const allCoupon = TryCatch(async(req,res,next) =>{
     
     
    const coupons = await Coupon.find();
    
    if(!coupons) return next(new ErrorHandler("No Coupon Code Avialable",400));
  
   
    return res.status(201).json({
        success: true,
        coupons:coupons,
    })


})
export const deleteCoupon = TryCatch(async(req,res,next) =>{
     
     const id = req.params.id;
     
     const coupon = await Coupon.findById(id);
     if(!coupon) return next(new ErrorHandler("Coupon Code Not Avialable",400));
   
      await coupon.deleteOne();
   
    return res.status(201).json({
        success: true,
        message:"Coupon deleted successfully",
    })


})