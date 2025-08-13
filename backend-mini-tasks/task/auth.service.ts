import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "./task.db";
import { JWT_SECRET, JWT_OPTIONS } from "./jwt.config";
import { User, UserResponse, JWTPayload } from "./auth.types";

export class AuthService {
  private static readonly SALT_ROUNDS = 12;

  /**
   * Hashea una contraseña usando bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    console.log("Hasheando contraseña con bcrypt");
    try {
      const hash = await bcrypt.hash(password, this.SALT_ROUNDS);
      console.log("Contraseña hasheada exitosamente");
      return hash;
    } catch (error) {
      console.error("Error hasheando contraseña:", error);
      throw error;
    }
  }

  /**
   * Verifica si una contraseña coincide con su hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    console.log("Verificando contraseña con bcrypt");
    try {
      const isValid = await bcrypt.compare(password, hash);
      console.log("Verificación de contraseña completada:", isValid);
      return isValid;
    } catch (error) {
      console.error("Error verificando contraseña:", error);
      throw error;
    }
  }

  /**
   * Genera un token JWT para un usuario
   */
  static generateToken(user: User): string {
    console.log("Generando token JWT para usuario:", user.id);
    try {
      // Solo pasamos los campos que NO están en JWT_OPTIONS
      const payload = {
        user_id: user.id,
        email: user.email,
        iat: Math.floor(Date.now() / 1000), // Timestamp de creación
      };

      const secret = JWT_SECRET();
      console.log("JWT_SECRET obtenido, longitud:", secret.length);
      
      // JWT_OPTIONS se encarga automáticamente de:
      // - exp (expiration) desde expiresIn: "24h"
      // - iss (issuer) desde issuer: "mini-tasks-app"  
      // - aud (audience) desde audience: "mini-tasks-users"
      const token = jwt.sign(payload, secret, JWT_OPTIONS);
      console.log("Token JWT generado exitosamente");
      return token;
    } catch (error) {
      console.error("Error generando token JWT:", error);
      throw error;
    }
  }

  /**
   * Verifica y decodifica un token JWT
   */
  static verifyToken(token: string): JWTPayload {
    console.log("🔍 AuthService: Verificando token JWT...");
    console.log("🔑 Token recibido:", token.substring(0, 20) + "...");
    
    try {
      console.log("🔍 JWT_SECRET disponible:", !!JWT_SECRET());
      console.log("🔍 JWT_OPTIONS:", JWT_OPTIONS);
      
      const payload = jwt.verify(token, JWT_SECRET(), JWT_OPTIONS) as JWTPayload;
      console.log("✅ Token verificado exitosamente, payload:", payload);
      return payload;
    } catch (error) {
      console.error('❌ Error verificando token:', error);
      
      // Proporcionar información específica sobre el tipo de error
      if (error instanceof jwt.JsonWebTokenError) {
        console.error('❌ Error JWT específico:', error.message);
        if (error.message === 'jwt audience invalid') {
          console.error('❌ Error de audience - el token no tiene el audience correcto');
        }
        if (error.message === 'jwt issuer invalid') {
          console.error('❌ Error de issuer - el token no tiene el issuer correcto');
        }
      }
      
      throw error;
    }
  }

  /**
   * Busca un usuario por email
   */
  static async findByEmail(email: string): Promise<User | null> {
    console.log("Buscando usuario por email en la base de datos:", email);
    try {
      const user = await db.queryRow<User>`
        SELECT id, email, password_hash, created_at
        FROM users
        WHERE email = ${email}
      `;
      console.log("Resultado de búsqueda por email:", user ? "Usuario encontrado" : "Usuario no encontrado");
      return user;
    } catch (error) {
      console.error("Error buscando usuario por email:", error);
      throw error;
    }
  }

  /**
   * Busca un usuario por ID
   */
  static async findById(id: string): Promise<User | null> {
    try {
      const user = await db.queryRow<User>`
        SELECT id, email, password_hash, created_at
        FROM users
        WHERE id = ${id}
      `;
      return user;
    } catch (error) {
      console.error("Error buscando usuario por ID:", error);
      throw error;
    }
  }

  /**
   * Crea un nuevo usuario
   */
  static async createUser(email: string, passwordHash: string): Promise<User> {
    console.log("Creando nuevo usuario en la base de datos:", email);
    try {
      const user = await db.queryRow<User>`
        INSERT INTO users (email, password_hash)
        VALUES (${email}, ${passwordHash})
        RETURNING id, email, password_hash, created_at
      `;

      if (!user) {
        throw new Error("Error al crear el usuario");
      }

      console.log("Usuario creado exitosamente:", user.id);
      return user;
    } catch (error) {
      console.error("Error creando usuario:", error);
      throw error;
    }
  }

  /**
   * Convierte un User a UserResponse (sin password_hash)
   */
  static toUserResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    };
  }
} 