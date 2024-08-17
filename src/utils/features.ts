import mongoose from "mongoose";
import { InvalidatesCacheProps, OrderItemType } from "../types/types.js";
import { myCache } from "../app.js";
import { Product } from "../Product/model.js";
import { error } from "console";

export const connectDB = (uri:string) =>{
    mongoose.connect(uri,
        {dbName : "Ecommerce-Website",}
    )
    .then((c) => console.log(`DB Connected to ${c.connection.host}`))
    .catch((e) => console.log(e));
}

export const invalidatesCache = async ({product,order,admin,user,orderID,productID}: InvalidatesCacheProps) =>{
  if(product){
    const productKeys : string[] = [
        "latest-product",
        "categories",
        "all-products",
        `product-${productID}`
    ];
     if(typeof productID === "string") productKeys.push(`product-${productID}`);
     if(typeof productID === "object") productKeys.forEach(i=>productKeys.push(`product-${i}`));
    myCache.del(productKeys);

  }
  if(order){
    const orderKeys : string[] = ["all-orders",`my-order-${user}`,`order-${orderID}`];  
    myCache.del(orderKeys);
  }
  if(admin){
      myCache.del(["admin-line-charts","admin-bar-charts","admin-pie-charts","admin-stats"])
  }

}


export const reduceStock = async ( orderItems: OrderItemType[] ) =>{
    for(let i =0 ;i<orderItems.length;i++)
    {
        const order = orderItems[i];
        const product = await Product.findById(order.productId);
        if(!product) throw new Error("Product not Found");
        product.stock -= order.quantity;

        await product.save();
    }
}


export const calculatePercentage = (thisMonth:number , lastMonth:number)=>{
    if(lastMonth === 0) return thisMonth*100;
    const percentage =(( thisMonth)/lastMonth)*100;
    return Number(percentage.toFixed(0));
};


export const getInventories = async({categories,productsCount}: {categories:string[]; productsCount : number}) =>{
  const categoriesCountPromise = categories.map(category => Product.countDocuments({ category }));

        const categoriesCount = await Promise.all(categoriesCountPromise);
        const categoryCount: Record<string, number>[] = [];

        categories.forEach((category, i) => {
            categoryCount.push({
                [category]: Math.round((categoriesCount[i] / productsCount) * 100),
            })
        })
  
        return categoryCount;
}


 interface MyDocument  {
  createdAt:Date;
  discount?:number;
  total?:number;

 };

type FuncProps = {
  length:number;
  docArr: MyDocument[];
  today:Date;
  property?:"discount"|"total";
};

export const getChartData = ({length,docArr,today , property}:FuncProps) =>{
  
   
  const data = new Array(length).fill(0);

 

  docArr.forEach((i) => {
      const creationDate = i.createdAt;
      const monthdiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

      if (monthdiff < length) {
          data[length - monthdiff - 1] += property?i[property]:1;
           
      }
  })

  return data;
}