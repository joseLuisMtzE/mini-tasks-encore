import type { Task, CreateTaskRequest, UpdateTaskRequest } from '../types/auth';
import { authService } from './authService';

const API_BASE_URL = 'http://localhost:4000';

class TaskService {
  // Obtener headers con autenticación
  private getHeaders(): HeadersInit {
    const authHeaders = authService.getAuthHeaders();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...authHeaders,
    };
    
    return headers;
  }

  // Listar tareas del usuario autenticado
  async getTasks(): Promise<Task[]> {
    const headers = this.getHeaders();
    
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error al obtener las tareas');
    }

    const data = await response.json();
    return data.tasks;
  }

  // Crear nueva tarea
  async createTask(task: CreateTaskRequest): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(task),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error al crear la tarea');
    }

    return await response.json();
  }

  // Actualizar tarea
  async updateTask(taskId: string, completed: boolean): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ completed }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error al actualizar la tarea');
    }

    return await response.json();
  }

  // Eliminar tarea
  async deleteTask(taskId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error al eliminar la tarea');
    }
  }
}

export const taskService = new TaskService(); 