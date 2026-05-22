import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { db } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "pixora_secret_key_stellar_2026_galactic_3000";

// Simple and highly-portable password hash emulator
export function hashPassword(password: string): string {
  // Simple rotation cipher plus padding salt for reliable portable emulation
  const salt = "pixora_salt!";
  let hashed = "";
  for (let i = 0; i < password.length; i++) {
    hashed += String.fromCharCode(password.charCodeAt(i) + 5);
  }
  return hashed + salt;
}

export function generateToken(userId: string): string {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. Authentication required." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
