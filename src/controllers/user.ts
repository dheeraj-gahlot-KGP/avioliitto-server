
import { NextFunction, Request, Response } from "express"
import { User } from "../model/user.js";
import { NewUserRequestBody } from "../types/types.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "../middlewares/error.js";




export const newUser = TryCatch(async (req: Request<{}, {}, NewUserRequestBody>, res: Response, next: NextFunction) => {

    const { name, email, _id, photo, gender, dob } = req.body;
    let user = await User.findById(_id);
    if (user) {
        return res.status(200).json({
            success: true,
            message: `Welcome , ${user.name}`,
        })
    }

    if (!_id || !name || !email || !photo || !gender || !dob) {
        return next(new ErrorHandler("Please  all fields", 400));
    }
      user = await User.create({ name, email, _id, photo, gender, dob: new Date(dob) });
    res.status(200).json({
        success: true,
        message: `Welcome, ${user.name}`,
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