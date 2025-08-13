import { api, Header } from "encore.dev/api";
import { APIError, ErrCode } from "encore.dev/api";
import { AuthService } from "./auth.service";
import { 
  RegisterRequest, 
  LoginRequest, 
  AuthResponse,
  UserResponse 
} from "./auth.types";

/**
 * Endpoint de prueba para verificar que el routing funciona
 */
export const test = api(
  { 
    expose: true, 
    method: "GET", 
    path: "/auth/test" 
  },
  async (): Promise<{ message: string }> => {
    return { message: "Auth service is working!" };
  }
);

/**
 * Endpoint para registrar un nuevo usuario
 */
export const register = api(
  { 
    expose: true, 
    method: "POST", 
    path: "/auth/register" 
  },
  async (req: RegisterRequest): Promise<AuthResponse> => {
    console.log("Iniciando registro para:", req.email);
    
    const { email, password } = req;

    // Validaciones básicas
    if (!email || !password) {
      throw APIError.invalidArgument("Email y contraseña son requeridos");
    }

    if (password.length < 6) {
      throw APIError.invalidArgument("La contraseña debe tener al menos 6 caracteres");
    }

    try {
      // Verificar si el usuario ya existe
      const existingUser = await AuthService.findByEmail(email);
      if (existingUser) {
        throw APIError.alreadyExists("El email ya está registrado");
      }

      // Hashear la contraseña
      const passwordHash = await AuthService.hashPassword(password);

      // Crear el usuario
      const user = await AuthService.createUser(email, passwordHash);

      // Generar token JWT
      const token = AuthService.generateToken(user);

      // Convertir a respuesta sin password_hash
      const userResponse = AuthService.toUserResponse(user);

      console.log("Registro exitoso para:", email);

      return {
        token,
        user: userResponse,
      };
    } catch (error) {
      console.error("Error en registro:", error);
      if (error instanceof APIError) {
        throw error;
      }
      throw APIError.internal("Error interno al crear el usuario");
    }
  }
);

/**
 * Endpoint para iniciar sesión
 */
export const login = api(
  { 
    expose: true, 
    method: "POST", 
    path: "/auth/login" 
  },
  async (req: LoginRequest): Promise<AuthResponse> => {
    console.log("Iniciando proceso de login para:", req.email);
    
    const { email, password } = req;

    // Validaciones básicas
    if (!email || !password) {
      throw APIError.invalidArgument("Email y contraseña son requeridos");
    }

    try {
      // Buscar el usuario por email
      const user = await AuthService.findByEmail(email);
      if (!user) {
        throw APIError.unauthenticated("Credenciales inválidas");
      }

      // Verificar la contraseña
      const isValidPassword = await AuthService.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        throw APIError.unauthenticated("Credenciales inválidas");
      }

      // Generar token JWT
      const token = AuthService.generateToken(user);

      // Convertir a respuesta sin password_hash
      const userResponse = AuthService.toUserResponse(user);

      console.log("Login exitoso para usuario:", email);

      return {
        token,
        user: userResponse,
      };
    } catch (error) {
      console.error("Error en login:", error);
      if (error instanceof APIError) {
        throw error;
      }
      throw APIError.internal("Error interno al iniciar sesión");
    }
  }
);

/**
 * Endpoint para obtener información del usuario actual
 */
export const me = api(
  { 
    expose: true, 
    method: "GET", 
    path: "/auth/me" 
  },
  async (req: { authorization: Header<"Authorization"> }): Promise<UserResponse> => {
    const { authorization } = req;
    
    console.log("🔍 Endpoint /me llamado con authorization:", authorization ? "Presente" : "Ausente");
    
    if (!authorization || !authorization.startsWith("Bearer ")) {
      console.log("❌ Error: Token de autorización requerido o formato incorrecto");
      throw APIError.unauthenticated("Token de autorización requerido");
    }

    const token = authorization.substring(7);
    console.log("🔑 Token extraído, longitud:", token.length);
    
    try {
      console.log("🔍 Verificando token...");
      const payload = AuthService.verifyToken(token);
      console.log("✅ Token verificado, payload:", payload);
      
      console.log("🔍 Buscando usuario con ID:", payload.user_id);
      const user = await AuthService.findById(payload.user_id);
      
      if (!user) {
        console.log("❌ Usuario no encontrado con ID:", payload.user_id);
        throw APIError.notFound("Usuario no encontrado");
      }

      console.log("✅ Usuario encontrado:", user.email);
      return AuthService.toUserResponse(user);
    } catch (error) {
      console.error("❌ Error en endpoint /me:", error);
      
      if (error instanceof APIError) {
        throw error;
      }
      
      // Proporcionar más información sobre el error
      if (error instanceof Error) {
        console.error("❌ Error detallado:", error.message);
        console.error("❌ Stack trace:", error.stack);
      }
      
      throw APIError.unauthenticated("Token inválido o expirado");
    }
  }
); 