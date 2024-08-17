
import { NextFunction, Request, Response } from "express"
import { BaseQuery, NewOrderRequestBody, NewProductRequestBody, SearchRequestQuery } from "../types/types.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "../middlewares/error.js";
import { rm } from "fs";
import {faker} from '@faker-js/faker'
import { count } from "console";
import { myCache } from "../app.js";
import { invalidatesCache, reduceStock } from "../utils/features.js";
import { Order } from "./model.js";


export const newOrder = TryCatch(async (req:Request<{},{},NewOrderRequestBody>, res, next) => {
   const {shippingInfo, orderItems, user, subtotal, tax,discount,shippingCharges,total,} = req.body;
   if(!shippingInfo || !orderItems || !user||!subtotal|| !tax ||!total)
   {
       return next(new ErrorHandler("Please Enter All Fields",400));
   }
  const order=  await Order.create({shippingInfo, orderItems, user, subtotal, tax,discount,shippingCharges,total});

   await reduceStock(orderItems);
   await  invalidatesCache({product:true , order:true, admin : true, user : user,productID:order.orderItems.map(i=>String(i.productId))});

   return res.status(201).json({
    success: true,
    message: "Order Placed Successfully",
   })
   
});
export const myOrders = TryCatch(async (req , res, next) => {
    const {id: user} = req.query;
    const key = `my-order-${user}`;
    let orders =[];
    if(myCache.has(key)) orders = JSON.parse(myCache.get(key)as string);
    else {
        orders = await Order.find({user});
        myCache.set(key,JSON.stringify(orders));
    }
   
    return res.status(201).json({
     success: true,
     orders,
    })
    
 });

 export const allOrders = TryCatch(async (req , res, next) => {
    const key = `all-orders`;
    let orders =[];
    if(myCache.has(key)) orders = JSON.parse(myCache.get(key)as string);
    else {
        orders = await Order.find().populate("user","name");
        myCache.set(key,JSON.stringify(orders));
    }
   
    return res.status(201).json({
     success: true,
     orders,
    })
    
 });

 export const getSingleOrder = TryCatch(async (req , res, next) => {
    const id = req.params.id;
    const key = `order-${id}`;
    let order ;
    if(myCache.has(key)) order = JSON.parse(myCache.get(key)as string);
    else {
        order = await Order.findById(id).populate("user","name");
        if(!order) return next(new ErrorHandler("Order Not Found", 400));
        myCache.set(key,JSON.stringify(order));
    }
   
    return res.status(201).json({
     success: true,
     order,
    })
    
 });

 export const processOrder = TryCatch(async (req , res, next) => {
    const  id = req.params.id;
    
    const order = await Order.findById(id);
    if(!order) return next(new ErrorHandler("order Not Found", 400));

    switch(order.status){
        case "Processing":
            order.status = "Shipped";
            break;
        case "Shipped":
            order.status = "Delivered";
            break;
        default:
            order.status = "Delivered";
            break;       
    }

     await order.save();
   
    await  invalidatesCache({product:false , order:true, admin : true,user : order.user , orderID: String(order._id)});
    console.log(order.status);
    return res.status(201).json({
     success: true,
     message: "Order  Processed Successfully",
     order,
    })
    
 });
 

 export const deleteOrder = TryCatch(async (req , res, next) => {
    const  id = req.params.id;
    
    const order = await Order.findById(id);
    if(!order) return next(new ErrorHandler("order Not Found", 400));

     
   await order.deleteOne();
     
   
    await  invalidatesCache({product:false , order:true, admin : true, user:order.user , orderID : String(order._id)});
 
    return res.status(201).json({
     success: true,
     message: "Order  deleted Successfully",
    })
    
 });