import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

interface UseTokenRefreshOptions {
  refreshInterval?: number; // en milisegundos
  autoRefresh?: boolean;
  onTokenExpired?: () => void;
}

export function useTokenRefresh(options: UseTokenRefreshOptions = {}) {
  const {
    refreshInterval = 4 * 60 * 1000, // 4 minutos por defecto (antes de que expire)
    autoRefresh = true,
    onTokenExpired
  } = options;

  const { isAuthenticated } = useAuth();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshing = useRef(false);
  const lastRefreshTime = useRef<number>(0);

  // Función para verificar si el token necesita renovación
  const checkTokenExpiry = useCallback(async () => {
    // Evitar verificaciones múltiples en un corto período
    const now = Date.now();
    if (isRefreshing.current || !isAuthenticated || (now - lastRefreshTime.current) < 2000) {
      return;
    }
    
    isRefreshing.current = true;
    lastRefreshTime.current = now;
    
    try {
      // Verificar si el token está próximo a expirar
      const token = authService.getToken();
      if (!token) {
        if (onTokenExpired) {
          onTokenExpired();
        }
        return;
      }

      // Intentar verificar el token
      const currentUser = await authService.verifyToken();
      
      if (!currentUser) {
        // Token expirado o inválido
        if (onTokenExpired) {
          onTokenExpired();
        }
      }
    } catch (error) {
      console.error('Error verificando expiración del token:', error);
      if (onTokenExpired) {
        onTokenExpired();
      }
    } finally {
      isRefreshing.current = false;
    }
  }, [isAuthenticated, onTokenExpired]);

  // Función para iniciar la verificación automática
  const startTokenRefresh = useCallback(() => {
    if (refreshIntervalRef.current) return;
    
    refreshIntervalRef.current = setInterval(() => {
      if (isAuthenticated) {
        checkTokenExpiry();
      }
    }, refreshInterval);
  }, [refreshInterval, isAuthenticated, checkTokenExpiry]);

  // Función para detener la verificación automática
  const stopTokenRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  // Efecto para manejar la verificación automática
  useEffect(() => {
    if (autoRefresh && isAuthenticated) {
      startTokenRefresh();
    } else {
      stopTokenRefresh();
    }

    return () => {
      stopTokenRefresh();
    };
  }, [autoRefresh, isAuthenticated, startTokenRefresh, stopTokenRefresh]);

  // Efecto para verificar inmediatamente cuando se autentica
  useEffect(() => {
    if (isAuthenticated) {
      // Verificar con delay para evitar conflictos con useSession
      const timer = setTimeout(() => {
        checkTokenExpiry();
      }, 2000); // Delay de 2 segundos para evitar conflictos
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, checkTokenExpiry]);

  // Efecto para limpiar al desmontar
  useEffect(() => {
    return () => {
      stopTokenRefresh();
    };
  }, [stopTokenRefresh]);

  return {
    checkTokenExpiry,
    startTokenRefresh,
    stopTokenRefresh,
  };
} 