import express from "express";
 
import { adminOnly } from "../middlewares/auth.js";
import { singleUpload } from "../middlewares/multer.js";
import { newProduct , getLatestProduct,getAllCategories, getAdminProducts, getSingleProduct, updateProduct, deleteProduct,getAllProducts } from "../controllers/product.js";
 
const app = express.Router();


app.post("/new", singleUpload , newProduct );
app.get("/latest",getLatestProduct );
app.get("/categories",getAllCategories );
app.get("/allProducts",getAllProducts );
app.get("/admin-products",getAdminProducts );
app.route("/:id").get(getSingleProduct).patch(adminOnly,singleUpload,updateProduct).delete(adminOnly,deleteProduct);
 

export default app;