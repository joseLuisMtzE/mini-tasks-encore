import { api } from "encore.dev/api";

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

const tasks: Task[] = [
    {
      id: "1",
      title: "Example Task",
      description: "Comprar frutas y verduras",
      priority: "medium",
      completed: false
    },
    {
      id: "2", 
      title: "Example Task completed",
      description: "Repasar hooks y componentes",
      priority: "high",
      completed: true
    },
 
  ]

export const get = api(
    { expose: true, method: "GET", path: "/helloo/:name" },
    async ({ name }: { name: string }): Promise<{message: string}> => {
      const msg = `Hello ${name}!`;
      return { message: msg };
    }
  );
  
  /**
   * Obtiene la lista de tareas ordenadas por prioridad
   * @returns ListTasksResponse - Lista de tareas con metadatos
   */
  export const list = api({expose:true, method:"GET", path:"/tasks"},
    async (): Promise<ListTasksResponse> => {
      try {
        const sortedTasks = tasks.sort((a, b) => {
          const order = { high: 3, medium: 2, low: 1 }
          return order[b.priority] - order[a.priority]
        })

        const completed = sortedTasks.filter(task => task.completed).length
        const pending = sortedTasks.length - completed

        return {
          tasks: sortedTasks,
          total: sortedTasks.length,
          completed,
          pending
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
  type CreateTaskRequest = Omit<Task, "id" | "completed">;

  /**
   * Crea una nueva tarea
   * @param req - Datos de la tarea a crear
   * @returns La tarea creada
   */
  export const create = api({expose:true, method:"POST", path:"/tasks"},
    async (req: CreateTaskRequest): Promise<Task> => {
      console.log(req)
      const task: Task = {
        id: Math.random().toString(36).substring(2),
        title: req.title,
        description: req.description,
        priority: req.priority,
        completed: false, 
      };
      console.log(task)
      tasks.push(task)
      return task
    }
  )

  /**
   * Actualiza el estado de una tarea
   * @param id - ID de la tarea a actualizar
   * @param completed - Nuevo estado de la tarea
   * @returns La tarea actualizada
   */
  export const update = api({expose:true, method:"PUT", path:"/tasks/:id"},
    async ({ id,completed }: { id: string,completed: boolean }): Promise<Task> => {
      console.log(id)
      const task = tasks.find((t) => t.id === id)
      if (task) {
        task.completed = completed
        return task
      }
      throw {
        error: "Task not found",
        code: "TASK_NOT_FOUND"
      } as ErrorResponse
    }
  )

  /**
   * Elimina una tarea
   * @param id - ID de la tarea a eliminar
   */
  export const deleteTask = api({expose:true, method:"DELETE", path:"/tasks/:id"},
    async ({ id }: { id: string }): Promise<void> => {
      const index = tasks.findIndex((t) => t.id === id)
      if (index !== -1) {
        tasks.splice(index, 1)
      }
    }
  )