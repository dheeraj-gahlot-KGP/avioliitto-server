
import { NextFunction, Request, Response } from "express"
import { User } from "./model.js";
import { NewUserRequestBody, UserLoginRequestBody } from "../types/types.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "../middlewares/error.js";
import { error } from "console";
import  bcrypt from 'bcryptjs';
import { invalidatesCache } from "../utils/features.js";





export const signUp = TryCatch(async (req: Request<{}, {}, NewUserRequestBody>, res: Response, next: NextFunction) => {

    const {name,email,password,_id, gender, dob } = req.body;
    let user = await User.findById(_id);
    if (user) {
        return res.status(400).json({
            success: false,
            message: `User Already Registered1`,
        })
    }
    user = await User.findOne({email});
    if (user) {
        return res.status(400).json({
            success: false,
            message: `User Already Registered2`,
        })
    }

    if (!_id || !name || !password || !email || !gender || !dob) {
        return next(new ErrorHandler("Please  all fields", 400));
    }
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    console.log(hashedPassword);
       
    user = await User.create({ name, email,password:hashedPassword, _id, gender,role:"user", dob: new Date(dob) });
    res.status(200).json({
        success: true,
        message: `Signup successful! Please check your email for verification.`,
    })
})


export const signIn = TryCatch(async (req: Request<{}, {}, UserLoginRequestBody>, res: Response, next: NextFunction) => {

    const { email,password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    res.status(200).json({
        success: true,
        user,
    })
})

export const getAllUsers =TryCatch(async (req: Request<{}, {}, NewUserRequestBody>, res: Response, next: NextFunction) => {
    const users = await User.find({});
    return res.status(201).json({
        success: true,
        users,
    })
})
export const getUser =TryCatch(async (req,res, next) => {
    const ID = req.params.id;
    const user = await User.findById(ID);
    if(!user) 
    {
        return res.status(201).json({
            success: false,
            message:"User Not exists",
        })
    }
    return res.status(201).json({
        success: true,
        user,
    })
})

export const deleteUser =TryCatch(async (req,res, next) => {
    const ID = req.params.id;
    const user = await User.findById(ID);
    if(!user) return next(new ErrorHandler("Invalid Id",400));

    await user.deleteOne()
    return res.status(201).json({
        success: true,
        message: "User deleted successfully",
    })
})

export const updateUser = TryCatch(async (req,res, next) => {
    const ID = req.params.id;
    const user = await User.findById(ID);
    if(!user) return next(new ErrorHandler("Invalid User Id",400));
    if(user.role === 'admin') user.role = 'user';
    else user.role = 'admin';
 
   await user.save();
    return res.status(200).json({
        success: true,
        message: "User Updated successfully",
    })
})