import { api } from "encore.dev/api";
import { db } from "./task.db";

type Priority = "low" | "medium" | "high"

type Task = {
  id: string
  title: string
  description?: string
  priority: Priority
  completed: boolean | false
}

interface ListTasksResponse {
  tasks: Task[]
  total: number
  completed: number
  pending: number
}

interface ErrorResponse {
  error: string
  code: string
}

type CreateTaskRequest = Omit<Task, "id" | "completed">;

  /**
   * Obtiene la lista de tareas ordenadas por prioridad
   * @returns ListTasksResponse - Lista de tareas con metadatos
   */
  export const list = api({expose:true, method:"GET", path:"/tasks"},
    async (): Promise<ListTasksResponse> => {
      const tasks = await db.rawQueryAll<Task>(`
        SELECT id, title, description, priority, completed
        FROM tasks
        ORDER BY CASE priority
                   WHEN 'high'   THEN 3
                   WHEN 'medium' THEN 2
                   WHEN 'low'    THEN 1
                 END DESC
      `);
      
      try {
        const completed = tasks.filter(task => task.completed).length

        return {
          tasks,
          total: tasks.length,
          completed,
          pending: tasks.length - completed
        }
      } catch (error) {
        throw {
          error: "Error al obtener las tareas",
          code: "TASKS_FETCH_ERROR"
        } as ErrorResponse
      }
    }
  )

  /**
   * Define el tipo de datos para crear una nueva tarea
   * @typedef {Object} CreateTaskRequest
   * @property {string} title - Título de la tarea
   * @property {string} [description] - Descripción opcional de la tarea
   * @property {"low" | "medium" | "high"} priority - Prioridad de la tarea
   */

  /**
   * Crea una nueva tarea
   * @param req - Datos de la tarea a crear
   * @returns La tarea creada
   */
  export const create = api({expose:true, method:"POST", path:"/tasks"},
    async (req: CreateTaskRequest): Promise<Task> => {
      const task = await db.rawQueryRow<Task>(`
        INSERT INTO tasks (title, description, priority)
        VALUES ($1, $2, $3)
        RETURNING id, title, description, priority, completed

      `,req.title, req.description ?? null, req.priority);
     
      if (!task) {
        throw <ErrorResponse>{
          error: "Error al crear la tarea",
          code: "TASK_CREATION_ERROR",
        };
      }
      return task;
    }
  )

  /**
   * Actualiza el estado de una tarea
   * @param id - ID de la tarea a actualizar
   * @param completed - Nuevo estado de la tarea
   * @returns La tarea actualizada
   */
  export const update = api({expose:true, method:"PUT", path:"/tasks/:id"},
    async ({ id, completed }: { id: string,completed: boolean }): Promise<Task> => {
      const task = await db.rawQueryRow<Task>(`
        UPDATE tasks
        SET completed = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, title, description, priority, completed
      `, completed, id)
      if (!task) {
        throw <ErrorResponse>{
          error: "Task not found",
          code: "TASK_NOT_FOUND",
        };
      }
      return task;
    }
  )

  /**
   * Elimina una tarea
   * @param id - ID de la tarea a eliminar
   */
  export const deleteTask = api({expose:true, method:"DELETE", path:"/tasks/:id"},
    async ({ id }: { id: string }): Promise<void> => {
      await db.rawExec("DELETE FROM tasks WHERE id = $1", id);
    }
  )