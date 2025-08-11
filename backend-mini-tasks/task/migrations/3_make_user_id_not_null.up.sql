-- Hacer user_id NOT NULL en la tabla tasks
-- Primero actualizamos las tareas existentes con un usuario por defecto si es necesario
-- (en un entorno de producción, esto requeriría más consideración)

-- Hacer user_id NOT NULL
ALTER TABLE tasks ALTER COLUMN user_id SET NOT NULL; 