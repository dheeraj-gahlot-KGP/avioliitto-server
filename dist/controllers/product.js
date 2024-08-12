import { Product } from "../model/product.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "../middlewares/error.js";
import { rm } from "fs";
import { myCache } from "../app.js";
import { invalidatesCache } from "../utils/features.js";
export const newProduct = TryCatch(async (req, res, next) => {
    const { name, price, stock, category } = req.body;
    const photo = req.file;
    if (!photo)
        return next(new ErrorHandler("Please Add Photo", 400));
    if (!name || !price || !stock || !category) {
        rm(photo.path, () => {
            console.log("Deleted");
        });
        return next(new ErrorHandler("Please enter All Fields", 400));
    }
    const product = await Product.create({ name, price, stock, category: category.toLowerCase(), photo: photo?.path, });
    await invalidatesCache({ product: true, admin: true, productID: String(product._id) });
    return res.status(201).json({
        success: true,
        message: `Product ${product.name} created succefully`,
    });
});
export const getLatestProduct = TryCatch(async (req, res, next) => {
    let products;
    if (myCache.has("latest-product")) {
        products = JSON.parse(myCache.get("latest-product"));
    }
    else {
        products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
        myCache.set("latest-product", JSON.stringify(products));
    }
    return res.status(200).json({
        success: true,
        products,
    });
});
export const getAllCategories = TryCatch(async (req, res, next) => {
    let categories;
    if (myCache.has("categories")) {
        categories = JSON.parse(myCache.get("categories"));
    }
    else {
        categories = await Product.distinct("category");
        ;
        myCache.set("categories", JSON.stringify(categories));
    }
    return res.status(200).json({
        success: true,
        categories,
    });
});
export const getAdminProducts = TryCatch(async (req, res, next) => {
    let products;
    if (myCache.has("all-products")) {
        products = JSON.parse(myCache.get("all-products"));
    }
    else {
        products = await Product.find({});
        myCache.set("all-products", JSON.stringify(products));
    }
    return res.status(200).json({
        success: true,
        products,
    });
});
export const getSingleProduct = TryCatch(async (req, res, next) => {
    let product;
    const ID = req.params.id;
    if (myCache.has(`product-${ID}`)) {
        product = JSON.parse(myCache.get(`product-${ID}`));
    }
    else {
        product = await Product.findById(ID);
        if (!product)
            return next(new ErrorHandler("Invalid  Product Id", 400));
        myCache.set(`product-${ID}`, JSON.stringify(product));
    }
    return res.status(201).json({
        success: true,
        product,
    });
});
export const deleteProduct = TryCatch(async (req, res, next) => {
    const ID = req.params.id;
    const product = await Product.findById(ID);
    if (!product)
        return next(new ErrorHandler("Invalid  Product Id", 400));
    rm(product.photo, () => {
        console.log("Product Photo Deleted");
    });
    await product.deleteOne();
    await invalidatesCache({ product: true, admin: true, productID: String(product._id) });
    return res.status(201).json({
        success: true,
        message: "Product deleted successfully",
    });
});
export const updateProduct = TryCatch(async (req, res, next) => {
    const ID = req.params.id;
    const { name, price, stock, category } = req.body;
    const photo = req.file;
    const product = await Product.findById(ID);
    if (!product)
        return next(new ErrorHandler("Invalid Product Id", 400));
    if (photo) {
        rm(product.photo, () => {
            console.log("Old Photo Deleted");
        });
        product.photo = photo.path;
    }
    if (name)
        product.name = name;
    if (price)
        product.price = price;
    if (stock)
        product.stock = stock;
    if (category)
        product.category = category;
    await product.save();
    await invalidatesCache({ product: true, admin: true, productID: String(product._id) });
    return res.status(200).json({
        success: true,
        message: "Product Updated successfully",
    });
});
export const getAllProducts = TryCatch(async (req, res, next) => {
    const { search, sort, category, price } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
    const skip = (page - 1) * limit;
    const baseQuery = {};
    if (search)
        baseQuery.name = { $regex: search, $options: "i" };
    if (price)
        baseQuery.price = { $lte: Number(price) };
    if (category)
        baseQuery.category = category;
    const [products, filterproducts] = await Promise.all([
        Product.find(baseQuery).sort(sort && { price: sort === "asc" ? 1 : -1 }).limit(limit).skip(skip),
        Product.find(baseQuery)
    ]);
    const totalPage = Math.ceil(filterproducts.length / limit);
    return res.status(200).json({
        success: true,
        products,
        totalPage
    });
});
