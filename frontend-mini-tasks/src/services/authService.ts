import type { AuthResponse, LoginRequest, RegisterRequest, User } from '../types/auth';

class AuthService {
  private API_BASE_URL = 'http://localhost:4000';

  // Obtener token del localStorage
  getToken(): string | null {
    const token = localStorage.getItem('authToken');
    return token;
  }

  // Obtener usuario del localStorage
  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    
    if (!userStr) {
      return null;
    }
    
    try {
      const user = JSON.parse(userStr) as User;
      return user;
    } catch (error) {
      console.error('Error parseando usuario:', error);
      return null;
    }
  }

  // Verificar si el token está próximo a expirar (dentro de 5 minutos)
  private isTokenExpiringSoon(): boolean {
    const expiry = localStorage.getItem('tokenExpiry');
    if (!expiry) return false;
    
    const expiryDate = new Date(expiry);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    return expiryDate <= fiveMinutesFromNow;
  }

  // Guardar token y usuario en localStorage
  setAuth(token: string, user: User, expiresIn?: number): void {
    try {
      // Guardar token
      localStorage.setItem('authToken', token);
      
      // Guardar usuario
      localStorage.setItem('user', JSON.stringify(user));
      
      // Guardar expiración si se proporciona (en segundos)
      if (expiresIn) {
        const expiryDate = new Date();
        expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn);
        localStorage.setItem('tokenExpiry', expiryDate.toISOString());
      }
      
    } catch (error) {
      console.error('Error durante el guardado:', error);
      throw error;
    }
  }

  // Limpiar autenticación
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiry');
  }

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // Si el token está próximo a expirar, marcar como no autenticado
    if (this.isTokenExpiringSoon()) {
      return false;
    }
    
    return true;
  }

  // Obtener headers de autorización
  getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    
    if (token) {
      return { 'Authorization': `Bearer ${token}` };
    } else {
      return {};
    }
  }

  // Registro de usuario
  async register(credentials: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error en el registro');
    }

    const data: AuthResponse = await response.json();
    
    // Asumir que el token expira en 24 horas si no se especifica
    const expiresIn = 24 * 60 * 60; // 24 horas en segundos
    this.setAuth(data.token, data.user, expiresIn);
    
    return data;
  }

  // Login de usuario
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error en el login');
    }

    const data: AuthResponse = await response.json();
    
    // Asumir que el token expira en 24 horas si no se especifica
    const expiresIn = 24 * 60 * 60; // 24 horas en segundos
    this.setAuth(data.token, data.user, expiresIn);
    
    return data;
  }

  // Verificar token actual
  async verifyToken(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        this.logout();
        return null;
      }

      const user: User = await response.json();
      // Actualizar usuario en localStorage
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Error verificando token:', error);
      this.logout();
      return null;
    }
  }
}

export const authService = new AuthService(); 