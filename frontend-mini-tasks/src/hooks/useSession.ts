import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

interface UseSessionOptions {
  checkInterval?: number; // en milisegundos
  autoRefresh?: boolean;
  onSessionExpired?: () => void;
}

export function useSession(options: UseSessionOptions = {}) {
  const {
    checkInterval = 5 * 60 * 1000, // 5 minutos por defecto
    autoRefresh = true,
    onSessionExpired
  } = options;

  const { user, isAuthenticated, logout } = useAuth();
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const isCheckingSession = useRef(false);
  const lastCheckTime = useRef<number>(0);

  // Función para verificar la sesión
  const checkSession = useCallback(async () => {
    // Evitar verificaciones múltiples en un corto período
    const now = Date.now();
    if (isCheckingSession.current || !isAuthenticated || (now - lastCheckTime.current) < 1000) {
      return;
    }
    
    isCheckingSession.current = true;
    lastCheckTime.current = now;
    
    try {
      const currentUser = await authService.verifyToken();
      
      if (!currentUser) {
        // Sesión expirada
        if (onSessionExpired) {
          onSessionExpired();
        } else {
          logout();
        }
      }
    } catch (error) {
      console.error('Error verificando sesión:', error);
      if (onSessionExpired) {
        onSessionExpired();
      } else {
        logout();
      }
    } finally {
      isCheckingSession.current = false;
    }
  }, [isAuthenticated, logout, onSessionExpired]);

  // Función para iniciar la verificación automática
  const startSessionCheck = useCallback(() => {
    if (sessionCheckInterval.current) return;
    
    sessionCheckInterval.current = setInterval(() => {
      if (isAuthenticated) {
        checkSession();
      }
    }, checkInterval);
  }, [checkInterval, isAuthenticated, checkSession]);

  // Función para detener la verificación automática
  const stopSessionCheck = useCallback(() => {
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current);
      sessionCheckInterval.current = null;
    }
  }, []);

  // Efecto para manejar la verificación automática
  useEffect(() => {
    if (autoRefresh && isAuthenticated) {
      startSessionCheck();
    } else {
      stopSessionCheck();
    }

    return () => {
      stopSessionCheck();
    };
  }, [autoRefresh, isAuthenticated, startSessionCheck, stopSessionCheck]);

  // Efecto para verificar la sesión cuando cambia el estado de autenticación
  useEffect(() => {
    if (isAuthenticated) {
      // Verificar inmediatamente al autenticarse, pero con un pequeño delay
      const timer = setTimeout(() => {
        checkSession();
      }, 1000); // Delay de 1 segundo para evitar conflictos
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, checkSession]);

  // Efecto para limpiar al desmontar
  useEffect(() => {
    return () => {
      stopSessionCheck();
    };
  }, [stopSessionCheck]);

  return {
    isAuthenticated,
    user,
    checkSession,
    startSessionCheck,
    stopSessionCheck,
  };
} 