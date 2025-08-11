import { Header, api } from "encore.dev/api";
import { AuthService } from "./auth.service";
import { JWTPayload } from "./auth.types";

// Interfaz para endpoints que requieren autenticación
export interface AuthenticatedRequest {
  authorization: Header<"Authorization">;
}

// Interfaz para el contexto de autenticación
export interface AuthContext {
  user_id: string;
  email: string;
}

/**
 * Middleware para validar JWT y extraer información del usuario
 */
export function withAuth<T extends AuthenticatedRequest>(
  handler: (req: T, auth: AuthContext) => Promise<any>
) {
  return async (req: T) => {
    const authHeader = req.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Token de autorización requerido");
    }

    const token = authHeader.substring(7); // Remover "Bearer "
    
    try {
      const payload = AuthService.verifyToken(token);
      
      // Crear contexto de autenticación
      const authContext: AuthContext = {
        user_id: payload.user_id,
        email: payload.email,
      };

      // Llamar al handler con el contexto de autenticación
      return await handler(req, authContext);
    } catch (error) {
      throw new Error("Token inválido o expirado");
    }
  };
}

// Nota: No usamos protectedEndpoint helper ya que Encore.ts requiere
// que los endpoints estén exportados directamente 