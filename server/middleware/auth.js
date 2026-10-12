import jwt from "jsonwebtoken";
import { sql } from "../db.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_super_secret_key_gsfcu_transit";

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const rows = await sql`
        SELECT id, full_name, email, role, roll_number, phone, created_at
        FROM public.app_accounts
        WHERE id = ${decoded.id}
        LIMIT 1;
      `;

      if (rows.length === 0) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = rows[0];
      return next();
    } catch (error) {
      console.error("[Auth Middleware Error]", error.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};
