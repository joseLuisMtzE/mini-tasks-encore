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
    console.log("withAuth middleware - Iniciando validación");
    console.log("withAuth middleware - Request completo:", req);
    console.log("withAuth middleware - Authorization header:", req.authorization);
    console.log("withAuth middleware - Tipo de req.authorization:", typeof req.authorization);
    console.log("withAuth middleware - req.authorization es string:", typeof req.authorization === 'string');
    
    const authHeader = req.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("withAuth middleware - ERROR: Header de autorización inválido");
      console.log("withAuth middleware - authHeader:", authHeader);
      console.log("withAuth middleware - authHeader.startsWith('Bearer '):", authHeader?.startsWith("Bearer "));
      throw new Error("Token de autorización requerido");
    }

    const token = authHeader.substring(7); // Remover "Bearer "
    console.log("withAuth middleware - Token extraído (primeros 20 chars):", token.substring(0, 20) + "...");
    
    try {
      console.log("withAuth middleware - Verificando token...");
      const payload = AuthService.verifyToken(token);
      console.log("withAuth middleware - Token verificado exitosamente, payload:", payload);
      
      // Crear contexto de autenticación
      const authContext: AuthContext = {
        user_id: payload.user_id,
        email: payload.email,
      };
      console.log("withAuth middleware - Contexto de autenticación creado:", authContext);

      // Llamar al handler con el contexto de autenticación
      console.log("withAuth middleware - Llamando al handler...");
      const result = await handler(req, authContext);
      console.log("withAuth middleware - Handler completado exitosamente");
      return result;
    } catch (error) {
      console.error("withAuth middleware - ERROR verificando token:", error);
      throw new Error("Token inválido o expirado");
    }
  };
}

// Nota: No usamos protectedEndpoint helper ya que Encore.ts requiere
// que los endpoints estén exportados directamente 