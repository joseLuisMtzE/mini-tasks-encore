// Tipos de autenticación
export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

// Tipos de tareas
export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
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

// Exportación por defecto para asegurar compatibilidad
export default {
  User,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Task,
  CreateTaskRequest,
  UpdateTaskRequest
}; 