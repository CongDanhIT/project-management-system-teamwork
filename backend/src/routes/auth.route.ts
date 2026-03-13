import { Router } from "express"
import passport from "passport"
import { env } from "../config/env"
import { googleLoginCallback, loginController, registerController, logoutController } from "../controllers/auth.controller"

const faileUrl = `${env.FRONTEND_GOOGLE_CALLBACK_URL}?status=failure`
const authRoutes = Router()

authRoutes.post("/register", registerController);
authRoutes.post("/login", loginController)
authRoutes.post("/logout", logoutController)

authRoutes.get("/google", passport.authenticate(
    "google", {
    scope: ["profile", "email"],
    prompt: "select_account",
})
);

authRoutes.get("/google/callback",
    passport.authenticate("google", { failureRedirect: faileUrl }),
    googleLoginCallback
);

export default authRoutes;
