CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agregar índice para búsquedas por email
CREATE INDEX idx_users_email ON users(email);

-- Agregar columna user_id a la tabla tasks existente
ALTER TABLE tasks ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Crear índice para búsquedas por usuario
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- Hacer user_id NOT NULL después de agregar la columna
-- (esto se hará en una migración separada para evitar problemas con datos existentes) 