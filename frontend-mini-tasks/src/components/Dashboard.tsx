import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../hooks/useSession';
import { taskService } from '../services/taskService';
import type { Task, CreateTaskRequest } from '../types/auth';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  
  // Hook para manejar la sesión general (incluye verificación de tokens)
  const { checkSession } = useSession({
    checkInterval: 5 * 60 * 1000, // Verificar cada 5 minutos
    autoRefresh: true,
    onSessionExpired: () => {
      logout();
    }
  });
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState<CreateTaskRequest>({
    title: '',
    description: '',
    priority: 'medium',
  });

  useEffect(() => {
    if (user) {
      loadTasks();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const tasksData = await taskService.getTasks();
      setTasks(tasksData);
    } catch (err) {
      console.error('Error cargando tareas:', err);
      
      // Si es un error de autenticación, verificar la sesión
      if (err instanceof Error && err.message.includes('401')) {
        await checkSession();
      }
      
      setError(err instanceof Error ? err.message : 'Error al cargar las tareas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      const createdTask = await taskService.createTask(newTask);
      setTasks([...tasks, createdTask]);
      setNewTask({ title: '', description: '', priority: 'medium' });
      setShowCreateForm(false);
    } catch (err) {
      console.error('Error creando tarea:', err);
      
      // Si es un error de autenticación, verificar la sesión
      if (err instanceof Error && err.message.includes('401')) {
        await checkSession();
      }
      
      setError(err instanceof Error ? err.message : 'Error al crear la tarea');
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    try {
      setError('');
      const updatedTask = await taskService.updateTask(taskId, completed);
      setTasks(tasks.map(task => 
        task.id === taskId ? updatedTask : task
      ));
    } catch (err) {
      console.error('Error actualizando tarea:', err);
      
      // Si es un error de autenticación, verificar la sesión
      if (err instanceof Error && err.message.includes('401')) {
        await checkSession();
      }
      
      setError(err instanceof Error ? err.message : 'Error al actualizar la tarea');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la tarea');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Error: Usuario no autenticado</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Mis Tareas</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Hola, {user?.email}</span>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Create Task Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            {showCreateForm ? 'Cancelar' : 'Nueva Tarea'}
          </button>
        </div>

        {/* Create Task Form */}
        {showCreateForm && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40"
              onClick={() => setShowCreateForm(false)}
            />
            
            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 text-start">
                <div className="p-6">
                  <h3 className="text-lg font-bold text-indigo-700 mb-4">Crear Nueva Tarea</h3>
                  <form onSubmit={handleCreateTask} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-indigo-700">Título</label>
                      <input 
                        type="text"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        className="h-8 mt-1 pl-2 block w-full border border-gray-200 rounded-md sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-indigo-700">Descripción</label>
                      <textarea
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        className="mt-1 p-2 block w-full border border-gray-200 rounded-md sm:text-sm"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-indigo-700">Prioridad</label>
                      <select
                        value={newTask.priority}
                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                        className="h-8 mt-1 block w-full border border-gray-200 rounded-md shadow-sm sm:text-sm"
                      >
                        <option value="low">Baja</option>
                        <option value="medium">Media</option>
                        <option value="high">Alta</option>
                      </select>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Crear Tarea
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Tasks List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {tasks.length === 0 ? (
              <li className="px-6 py-4 text-center text-gray-500">
                No tienes tareas. ¡Crea una nueva!
              </li>
            ) : (
              tasks.map((task) => (
                <li key={task.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={(e) => handleToggleTask(task.id, e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <h3 className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className={`text-sm ${task.completed ? 'text-gray-400' : 'text-gray-500'}`}>
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                      </span>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}; 