import mongoose from "mongoose";
import { myCache } from "../app.js";
import { Product } from "../model/product.js";
export const connectDB = (uri) => {
    mongoose.connect(uri, { dbName: "Ecommerce-Website", })
        .then((c) => console.log(`DB Connected to ${c.connection.host}`))
        .catch((e) => console.log(e));
};
export const invalidatesCache = async ({ product, order, admin, user, orderID, productID }) => {
    if (product) {
        const productKeys = [
            "latest-product",
            "categories",
            "all-products",
            `product-${productID}`
        ];
        if (typeof productID === "string")
            productKeys.push(`product-${productID}`);
        if (typeof productID === "object")
            productKeys.forEach(i => productKeys.push(`product-${i}`));
        myCache.del(productKeys);
    }
    if (order) {
        const orderKeys = ["all-orders", `my-order-${user}`, `order-${orderID}`];
        myCache.del(orderKeys);
    }
    if (admin) {
        myCache.del(["admin-line-charts", "admin-bar-charts", "admin-pie-charts", "admin-stats"]);
    }
};
export const reduceStock = async (orderItems) => {
    for (let i = 0; i < orderItems.length; i++) {
        const order = orderItems[i];
        const product = await Product.findById(order.productId);
        if (!product)
            throw new Error("Product not Found");
        product.stock -= order.quantity;
        await product.save();
    }
};
export const calculatePercentage = (thisMonth, lastMonth) => {
    if (lastMonth === 0)
        return thisMonth * 100;
    const percentage = ((thisMonth) / lastMonth) * 100;
    return Number(percentage.toFixed(0));
};
export const getInventories = async ({ categories, productsCount }) => {
    const categoriesCountPromise = categories.map(category => Product.countDocuments({ category }));
    const categoriesCount = await Promise.all(categoriesCountPromise);
    const categoryCount = [];
    categories.forEach((category, i) => {
        categoryCount.push({
            [category]: Math.round((categoriesCount[i] / productsCount) * 100),
        });
    });
    return categoryCount;
};
;
export const getChartData = ({ length, docArr, today, property }) => {
    const data = new Array(length).fill(0);
    docArr.forEach((i) => {
        const creationDate = i.createdAt;
        const monthdiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
        if (monthdiff < length) {
            data[length - monthdiff - 1] += property ? i[property] : 1;
        }
    });
    return data;
};
