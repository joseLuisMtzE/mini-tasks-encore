import { secret } from "encore.dev/config";

// Configuración de JWT
export const JWT_SECRET = secret("JWT_SECRET");
export const JWT_EXPIRES_IN = "24h"; // 24 horas

// Opciones de JWT
export const JWT_OPTIONS = {
  expiresIn: JWT_EXPIRES_IN,
  issuer: "mini-tasks-app",
  audience: "mini-tasks-users",
}; 