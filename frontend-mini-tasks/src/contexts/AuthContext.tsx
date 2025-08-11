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
    // Verificar token al cargar la aplicación
    const checkAuth = async () => {
      try {
        const currentUser = await authService.verifyToken();
        setUser(currentUser);
      } catch (error) {
        console.error('Error verificando autenticación:', error);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    checkAuth();
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
      
      // Verificar que el token se guardó correctamente
      const storedToken = authService.getToken();
      
      if (!storedToken) {
        throw new Error('Error al guardar el token de autenticación');
      }
      
      // Pequeño delay para asegurar que localStorage esté sincronizado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verificar nuevamente después del delay
      const finalToken = authService.getToken();
      
      if (!finalToken) {
        throw new Error('Error al guardar el token de autenticación');
      }
      
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