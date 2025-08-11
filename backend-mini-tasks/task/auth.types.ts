// Tipos para autenticación
export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

export interface UserResponse {
  id: string;
  email: string;
  created_at: Date;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
}

export interface JWTPayload {
  user_id: string;
  email: string;
  iat: number;
  exp?: number; // Opcional ya que se maneja automáticamente por JWT_OPTIONS
  iss?: string; // Opcional ya que se maneja automáticamente por JWT_OPTIONS
  aud?: string; // Opcional ya que se maneja automáticamente por JWT_OPTIONS
}

// Tipos para tareas con usuario
export interface TaskWithUser {
  id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
}

export interface UpdateTaskRequest {
  id: string;
  completed: boolean;
} 