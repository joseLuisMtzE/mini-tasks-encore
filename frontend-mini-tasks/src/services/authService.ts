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

  // Guardar token y usuario en localStorage
  setAuth(token: string, user: User): void {
    try {
      // Guardar token
      localStorage.setItem('authToken', token);
      
      // Verificar que se guardó correctamente
      const storedToken = localStorage.getItem('authToken');
      
      if (!storedToken || storedToken !== token) {
        throw new Error('Error al guardar el token en localStorage');
      }
      
      // Guardar usuario
      localStorage.setItem('user', JSON.stringify(user));
      
      // Verificar que se guardó correctamente
      const storedUser = localStorage.getItem('user');
      
      if (!storedUser) {
        throw new Error('Error al guardar el usuario en localStorage');
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
  }

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return !!this.getToken();
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
    this.setAuth(data.token, data.user);
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
    this.setAuth(data.token, data.user);
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
      // Actualizar usuario en localStorage usando la clave correcta
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      this.logout();
      return null;
    }
  }
}

export const authService = new AuthService(); 