import { api } from "encore.dev/api";
import { APIError, ErrCode } from "encore.dev/api";
import { db } from "./task.db";
import { withAuth, AuthenticatedRequest, AuthContext } from "./auth.middleware";
import { TaskWithUser, CreateTaskRequest } from "./auth.types";
import { AuthService } from "./auth.service";

type Priority = "low" | "medium" | "high";

type Task = {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  completed: boolean;
  user_id: string;
  created_at: Date;
  updated_at: Date;
};

interface ListTasksResponse {
  tasks: Task[];
  total: number;
  completed: number;
  pending: number;
}

// Tipos para los endpoints
interface CreateTaskRequestWithAuth extends AuthenticatedRequest, CreateTaskRequest {}
interface UpdateTaskRequestWithAuth extends AuthenticatedRequest {
  id: string;
  completed: boolean;
}
interface DeleteTaskRequestWithAuth extends AuthenticatedRequest {
  id: string;
}

/**
 * Obtiene la lista de tareas del usuario autenticado ordenadas por prioridad
 */
export const list = api.raw(
  { expose: true, method: "GET", path: "/tasks" },
  async (req, resp) => {
    try {
      // Extraer token del header Authorization
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        resp.writeHead(401, { "Content-Type": "application/json" });
        resp.end(JSON.stringify({ 
          code: "unauthenticated", 
          message: "Token de autorización requerido" 
        }));
        return;
      }

      const token = authHeader.substring(7); // Remover "Bearer "
      
      // Verificar token
      const payload = AuthService.verifyToken(token);
      
      // Obtener tareas del usuario
      const tasks = await db.query<Task>`
        SELECT id, title, description, priority, completed, user_id, created_at, updated_at
        FROM tasks
        WHERE user_id = ${payload.user_id}
        ORDER BY CASE priority
                   WHEN 'high'   THEN 3
                   WHEN 'medium' THEN 2
                   WHEN 'low'    THEN 1
                 END DESC
      `;

      const tasksArray = [];
      for await (const task of tasks) {
        tasksArray.push(task);
      }

      const completed = tasksArray.filter(task => task.completed).length;

      const response = {
        tasks: tasksArray,
        total: tasksArray.length,
        completed,
        pending: tasksArray.length - completed
      };

      resp.writeHead(200, { "Content-Type": "application/json" });
      resp.end(JSON.stringify(response));
      
    } catch (error) {
      console.error("Error en endpoint list:", error);
      resp.writeHead(500, { "Content-Type": "application/json" });
      resp.end(JSON.stringify({ 
        code: "internal", 
        message: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido"
      }));
    }
  }
);

/**
 * Crea una nueva tarea para el usuario autenticado
 */
export const create = api(
  { expose: true, method: "POST", path: "/tasks" },
  withAuth(async (req: CreateTaskRequestWithAuth, auth: AuthContext): Promise<Task> => {
    try {
      const task = await db.queryRow<Task>`
        INSERT INTO tasks (title, description, priority, user_id)
        VALUES (${req.title}, ${req.description ?? null}, ${req.priority}, ${auth.user_id})
        RETURNING id, title, description, priority, completed, user_id, created_at, updated_at
      `;

      if (!task) {
        throw APIError.internal("Error al crear la tarea");
      }
      return task;
    } catch (error) {
      console.error("Error al crear tarea:", error);
      throw APIError.internal("Error al crear la tarea");
    }
  })
);

/**
 * Actualiza el estado de una tarea del usuario autenticado
 */
export const update = api.raw(
  { expose: true, method: "PUT", path: "/tasks/:id" },
  async (req, resp) => {
    try {
      // Extraer token del header Authorization
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        resp.writeHead(401, { "Content-Type": "application/json" });
        resp.end(JSON.stringify({ 
          code: "unauthenticated", 
          message: "Token de autorización requerido" 
        }));
        return;
      }

      const token = authHeader.substring(7); // Remover "Bearer "
      
      // Verificar token
      const payload = AuthService.verifyToken(token);
      
      // Extraer ID de la URL
      const urlParts = req.url?.split('/');
      const taskId = urlParts?.[urlParts.length - 1];
      
      if (!taskId) {
        resp.writeHead(400, { "Content-Type": "application/json" });
        resp.end(JSON.stringify({ 
          code: "invalid_argument", 
          message: "ID de tarea requerido" 
        }));
        return;
      }
      
      // Leer el body de la petición
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          const { completed } = JSON.parse(body);
          
          // Verificar que la tarea pertenece al usuario autenticado
          const existingTask = await db.queryRow<Task>`
            SELECT id, user_id FROM tasks WHERE id = ${taskId}
          `;
          
          if (!existingTask) {
            resp.writeHead(404, { "Content-Type": "application/json" });
            resp.end(JSON.stringify({ 
              code: "not_found", 
              message: "Tarea no encontrada" 
            }));
            return;
          }
          
          if (existingTask.user_id !== payload.user_id) {
            resp.writeHead(403, { "Content-Type": "application/json" });
            resp.end(JSON.stringify({ 
              code: "permission_denied", 
              message: "No tienes permisos para modificar esta tarea" 
            }));
            return;
          }
          
          // Actualizar la tarea
          const updatedTask = await db.queryRow<Task>`
            UPDATE tasks
            SET completed = ${completed}, updated_at = NOW()
            WHERE id = ${taskId} AND user_id = ${payload.user_id}
            RETURNING id, title, description, priority, completed, user_id, created_at, updated_at
          `;

          if (!updatedTask) {
            resp.writeHead(404, { "Content-Type": "application/json" });
            resp.end(JSON.stringify({ 
              code: "not_found", 
              message: "Tarea no encontrada" 
            }));
            return;
          }

          resp.writeHead(200, { "Content-Type": "application/json" });
          resp.end(JSON.stringify(updatedTask));
          
        } catch (parseError) {
          console.error("Error parseando body en update:", parseError);
          resp.writeHead(400, { "Content-Type": "application/json" });
          resp.end(JSON.stringify({ 
            code: "invalid_argument", 
            message: "Body de la petición inválido" 
          }));
        }
      });
      
    } catch (error) {
      console.error("Error en endpoint update:", error);
      resp.writeHead(500, { "Content-Type": "application/json" });
      resp.end(JSON.stringify({ 
        code: "internal", 
        message: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido"
      }));
    }
  }
);

/**
 * Elimina una tarea del usuario autenticado
 */
export const deleteTask = api.raw(
  { expose: true, method: "DELETE", path: "/tasks/:id" },
  async (req, resp) => {
    try {
      // Extraer token del header Authorization
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        resp.writeHead(401, { "Content-Type": "application/json" });
        resp.end(JSON.stringify({ 
          code: "unauthenticated", 
          message: "Token de autorización requerido" 
        }));
        return;
      }

      const token = authHeader.substring(7); // Remover "Bearer "
      
      // Verificar token
      const payload = AuthService.verifyToken(token);
      
      // Extraer ID de la URL
      const urlParts = req.url?.split('/');
      const taskId = urlParts?.[urlParts.length - 1];
      
      if (!taskId) {
        resp.writeHead(400, { "Content-Type": "application/json" });
        resp.end(JSON.stringify({ 
          code: "invalid_argument", 
          message: "ID de tarea requerido" 
        }));
        return;
      }
      
      // Verificar que la tarea pertenece al usuario autenticado
      const existingTask = await db.queryRow<Task>`
        SELECT id, user_id FROM tasks WHERE id = ${taskId}
      `;
      
      if (!existingTask) {
        resp.writeHead(404, { "Content-Type": "application/json" });
        resp.end(JSON.stringify({ 
          code: "not_found", 
          message: "Tarea no encontrada" 
        }));
        return;
      }
      
      if (existingTask.user_id !== payload.user_id) {
        resp.writeHead(403, { "Content-Type": "application/json" });
        resp.end(JSON.stringify({ 
          code: "permission_denied", 
          message: "No tienes permisos para eliminar esta tarea" 
        }));
        return;
      }
      
      // Eliminar la tarea
      await db.exec`
        DELETE FROM tasks 
        WHERE id = ${taskId} AND user_id = ${payload.user_id}
      `;

      resp.writeHead(200, { "Content-Type": "application/json" });
      resp.end(JSON.stringify({ 
        code: "ok", 
        message: "Tarea eliminada exitosamente" 
      }));
      
    } catch (error) {
      console.error("Error en endpoint deleteTask:", error);
      resp.writeHead(500, { "Content-Type": "application/json" });
      resp.end(JSON.stringify({ 
        code: "internal", 
        message: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido"
      }));
    }
  }
);