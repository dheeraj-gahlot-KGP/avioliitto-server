import { User } from "../User/model.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "./error.js";

export const adminOnly = TryCatch(async(req,res,next) =>{
    const {id} = req.query;
    if(!id) return next( new ErrorHandler("Please Login First",401));

    const user = await User.findById(id);

    if(!user) return next( new ErrorHandler("Provided Id is Wroung", 401));
    if(user.role !== "admin") return next( new ErrorHandler("Admin Access Not Allowed", 401));

    next();



})