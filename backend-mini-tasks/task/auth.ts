import { api } from "encore.dev/api";
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
  async (req: { authorization: string }): Promise<UserResponse> => {
    const { authorization } = req;
    
    if (!authorization || !authorization.startsWith("Bearer ")) {
      throw APIError.unauthenticated("Token de autorización requerido");
    }

    const token = authorization.substring(7);
    
    try {
      const payload = AuthService.verifyToken(token);
      const user = await AuthService.findById(payload.user_id);
      
      if (!user) {
        throw APIError.notFound("Usuario no encontrado");
      }

      return AuthService.toUserResponse(user);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw APIError.unauthenticated("Token inválido o expirado");
    }
  }
); 