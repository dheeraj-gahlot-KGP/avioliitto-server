import express from "express";
import { signUp, signIn,getAllUsers , getUser , deleteUser, updateUser} from "./controller.js";
import { adminOnly } from "../middlewares/auth.js";
 
const app = express.Router();


app.post("/signup", signUp);
app.post("/login", signIn);
app.get("/all" ,adminOnly, getAllUsers);
app.route("/:id").get(getUser).delete(adminOnly,deleteUser).patch(adminOnly,updateUser);


export default app;