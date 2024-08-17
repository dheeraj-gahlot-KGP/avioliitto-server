import { promises } from "dns";
import { NextFunction, Request, Response } from "express";

export interface NewUserRequestBody {
    _id: string;
    name: string;
    email: string;
    password:string;
    gender: string;
    dob: Date;
}

export interface UserLoginRequestBody {
    email: string;
    password:string;
}

export interface LoginUserRequestBody {
    _id: string;
    email: string;
    dob: Date;
}

export interface NewProductRequestBody {
    name: string;
    stock: number;
    category: string;
    price: number;
}
 
export type ControllerType = (req: Request , res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>


export type SearchRequestQuery = {
    search?: string;
    category?: string;
    price?:string;
    sort?:string;
    page?:string;
}

export interface BaseQuery{
    name?: {
      $regex:string;
      $options:string;

    };
    price?: {$lte : number};
    category?:string;

}

export type InvalidatesCacheProps = {
    product?: boolean ;
    order?:boolean;
    admin?:boolean;
    user?:string;
    orderID?:string;
    productID? : string| string[];
}

export type OrderItemType = {
    name : string;
    photo : string;
    price : number;
    quantity : number;
    productId : string;


}
export type ShippingInfoType = {
    address : string;
    city: string;
    state : number;
    country : number;
    pincode : number;

}

export interface NewOrderRequestBody  {
   shippingInfo : ShippingInfoType;
   user : string;
   subtotal : number;
   tax : number;
   shippingCharges : number;
   discount: number;
   total: number;
   orderItems: OrderItemType[];
}