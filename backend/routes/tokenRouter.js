import express from "express";
import { refreshToken, logout } from "../controllers/tokenController.js";

const tokenRouter = express.Router();

tokenRouter.post("/refresh", refreshToken);
tokenRouter.post("/logout", logout);

export default tokenRouter;
