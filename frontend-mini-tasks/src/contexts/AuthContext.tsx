import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types/auth';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Verificación inicial al cargar la aplicación
    const initializeAuth = async () => {
      try {
        // Primero intentar obtener del almacenamiento
        const storedUser = authService.getUser();
        const storedToken = authService.getToken();
        
        if (storedUser && storedToken) {
          // Verificar que el token sea válido
          const currentUser = await authService.verifyToken();
          
          if (currentUser) {
            setUser(currentUser);
          } else {
            // Token inválido, limpiar
            authService.logout();
          }
        }
      } catch (error) {
        console.error('Error inicializando autenticación:', error);
        // En caso de error, limpiar datos corruptos
        authService.logout();
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      setUser(response.user);
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const response = await authService.register({ email, password });
      setUser(response.user);
    } catch (error) {
      console.error('Error en register:', error);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    loading,
  };

  // No renderizar nada hasta que estemos completamente inicializados
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Inicializando...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 