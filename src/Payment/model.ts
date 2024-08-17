import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
    code:{
        type: String,
        required: [true , "Please Enter the coupon Code"],
        unique: true,
    },
    amount:{
        type: Number,
        required: [true , "Please Enter the discount amount"],
         
    },
})

export const Coupon = mongoose.model("Coupon",couponSchema);