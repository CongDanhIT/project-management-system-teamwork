import { Router } from "express";
import { getCurrentUser } from "../controllers/user.controller";

const userRoutes = Router();

// Endpoint: /api/v1/user/current
userRoutes.get("/current", getCurrentUser);


export default userRoutes;