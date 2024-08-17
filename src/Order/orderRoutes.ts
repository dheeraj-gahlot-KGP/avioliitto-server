import express from "express";
 
import { adminOnly } from "../middlewares/auth.js";
 
import { newOrder ,myOrders , allOrders, getSingleOrder, processOrder, deleteOrder} from "./controller.js";
 
const app = express.Router();


app.post("/new", newOrder );
 
app.get("/my",myOrders);

app.get("/all",adminOnly,allOrders);

app.route("/:id").get(getSingleOrder).put(adminOnly,processOrder).delete(adminOnly,deleteOrder);
 
 

export default app;