import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import type { User, CustomRequest, UserPayload } from "../libs/types.ts";

// import database
import { users, reset_users } from "../db/db.ts";
import { authenticateToken } from "../middlewares/authenMiddleware.ts";
import { checkRoleAdmin } from "../middlewares/checkRoleAdminMiddleware.ts";

const router = Router();

// GET /api/v2/users (ADMIN only)
router.get("/", authenticateToken, checkRoleAdmin, (req: CustomRequest, res: Response) => {
    try {
        // return all users
        return res.json({
            success: true,
            data: users,
        });
    } catch (err) {
        return res.status(200).json({
            success: false,
            message: "Something is wrong, please try again",
            error: err,
        });
    }
});

// POST /api/v2/users/login
router.post("/login", (req: Request, res: Response) => {
    try {
        // 1. get username and password from body
        const { username, password } = req.body;

        // 2. check if user exists (search with username & password in DB)
        const user = users.find((u) => u.username === username && u.password === password);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            })
        }

        // 3. create JWT token (with user info object as payload) using JWT_SECRET_KEY

        const jwt_secret = process.env.JWT_SECRET || "secretyumyum";

        const payload = {
            username: user.username,
            studentId: user.studentId,
            role: user.role
        }

        const token = jwt.sign(payload, jwt_secret, { expiresIn: "30m" });

        //    (optional: save the token as part of User data)

        user.tokens = user.tokens ? [...user.tokens, token] : [token];

        // 4. send HTTP response with JWT token
        return res.status(200).json({
            success: true,
            message: "Login successful",
            token
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "POST /api/v2/users/login has not been implemented yet",
        });
    }


});

// POST /api/v2/users/logout
router.post("/logout", authenticateToken, (req: CustomRequest, res: Response) => {
    try {
        // 1. check Request if "authorization" header exists
        //    and container "Bearer ...JWT-Token..."

        // 2. extract the "...JWT-Token..." if available

        // 3. verify token using JWT_SECRET_KEY and get payload (username, studentId and role)

        // 4. check if user exists (search with username)
        const payload_user = req.user;
        const payload_token = req.token;
        const user = users.find((u) => u.username === payload_user?.username);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        // 5. proceed with logout process and return HTTP response
        //    (optional: remove the token from User data)

        user.tokens = user.tokens?.filter((t) => t !== payload_token);

        return res.status(200).json({
            success: true,
            message: "Logout successful"
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "POST /api/v2/users/logout has not been implemented yet",
        });
    }


});

// POST /api/v2/users/reset
router.post("/reset", (req: Request, res: Response) => {
    try {
        reset_users();
        return res.status(200).json({
            success: true,
            message: "User database has been reset",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Something is wrong, please try again",
            error: err,
        });
    }
});

export default router;