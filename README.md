# Mini Tasks - Sistema de Autenticación con JWT

Este proyecto implementa un sistema completo de gestión de tareas con autenticación de usuarios usando JWT, construido con Encore.ts para el backend y React + TypeScript para el frontend.

## 🚀 Características

- **Backend (Encore.ts)**
  - Autenticación JWT con bcrypt para hash de contraseñas
  - Endpoints protegidos para gestión de tareas
  - Base de datos PostgreSQL con migraciones
  - Cada usuario solo ve sus propias tareas
  - Validación de tipos TypeScript

- **Frontend (React + TypeScript)**
  - Sistema de login y registro
  - Dashboard protegido para gestión de tareas
  - Almacenamiento seguro de tokens JWT
  - Interfaz moderna con Tailwind CSS
  - Manejo de estado con React Context

## 🛠️ Tecnologías Utilizadas

### Backend
- Encore.ts (framework TypeScript)
- PostgreSQL (base de datos)
- JWT (JSON Web Tokens)
- bcryptjs (hash de contraseñas)

### Frontend
- React 18 + TypeScript
- Tailwind CSS (estilos)
- Context API (manejo de estado)
- Fetch API (comunicación HTTP)

## 📋 Requisitos Previos

- Node.js 18+ 
- Encore CLI instalado (`npm install -g encore`)
- PostgreSQL (para desarrollo local)

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd mini-tasks
```

### 2. Configurar el Backend

```bash
cd backend-mini-tasks

# Instalar dependencias
npm install

# Configurar secretos locales (desarrollo)
echo 'JWT_SECRET: "dev-secret-key-change-in-production"' > .secrets.local.cue

# Ejecutar la aplicación
encore run
```

El backend estará disponible en `http://localhost:4000`

### 3. Configurar el Frontend

```bash
cd frontend-mini-tasks

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

## 🔐 Configuración de Secretos

### Desarrollo Local
Los secretos se configuran automáticamente desde `.secrets.local.cue`

### Producción
```bash
encore secret set --type prod JWT_SECRET
```

## 📊 Estructura de la Base de Datos

### Tabla `users`
- `id` (UUID, primary key)
- `email` (string único)
- `password_hash` (string)
- `created_at` (timestamp)

### Tabla `tasks`
- `id` (UUID, primary key)
- `title` (string)
- `description` (string opcional)
- `priority` (enum: low, medium, high)
- `completed` (boolean)
- `user_id` (UUID, foreign key a users)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## 🔌 Endpoints de la API

### Autenticación
- `POST /auth/register` - Registrar nuevo usuario
- `POST /auth/login` - Iniciar sesión
- `GET /auth/me` - Obtener información del usuario actual

### Tareas (Protegidos)
- `GET /tasks` - Listar tareas del usuario
- `POST /tasks` - Crear nueva tarea
- `PUT /tasks/:id` - Actualizar tarea
- `DELETE /tasks/:id` - Eliminar tarea

## 🔒 Seguridad

- **Contraseñas**: Hasheadas con bcrypt (12 salt rounds)
- **JWT**: Firmados con secreto configurable
- **CORS**: Configurado para desarrollo local
- **Validación**: Tipos TypeScript y validación de entrada
- **Aislamiento**: Cada usuario solo accede a sus tareas

## 🧪 Pruebas

### Backend
```bash
cd backend-mini-tasks
npm test
```

### Frontend
```bash
cd frontend-mini-tasks
npm test
```

## 🚀 Despliegue

### Backend (Encore Cloud)
```bash
cd backend-mini-tasks
encore app deploy
```

### Frontend
```bash
cd frontend-mini-tasks
npm run build
# Desplegar la carpeta dist/ en tu hosting preferido
```

## 📁 Estructura del Proyecto

```
mini-tasks/
├── backend-mini-tasks/
│   ├── task/
│   │   ├── migrations/          # Migraciones de base de datos
│   │   ├── auth.types.ts        # Tipos de autenticación
│   │   ├── auth.service.ts      # Servicio de autenticación
│   │   ├── auth.middleware.ts   # Middleware JWT
│   │   ├── auth.ts              # Endpoints de autenticación
│   │   ├── task.ts              # Endpoints de tareas
│   │   ├── task.db.ts           # Configuración de base de datos
│   │   └── jwt.config.ts        # Configuración JWT
│   ├── encore.app               # Configuración de Encore
│   └── package.json
├── frontend-mini-tasks/
│   ├── src/
│   │   ├── components/          # Componentes React
│   │   ├── contexts/            # Contextos de React
│   │   ├── services/            # Servicios de API
│   │   ├── types/               # Tipos TypeScript
│   │   └── App.tsx              # Componente principal
│   └── package.json
└── README.md
```

## 🔧 Configuración de Desarrollo

### Variables de Entorno
- `JWT_SECRET`: Secreto para firmar JWT
- `DATABASE_URL`: URL de conexión a PostgreSQL (automática con Encore)

### Puertos
- Backend: 4000
- Frontend: 5173
- Base de datos: 5432 (proxy local)

## 🐛 Solución de Problemas

### Error de CORS
Verificar que la configuración en `encore.app` incluya los orígenes correctos.

### Error de Base de Datos
```bash
cd backend-mini-tasks
encore db reset
```

### Error de Dependencias
```bash
# Backend
cd backend-mini-tasks && npm install

# Frontend  
cd frontend-mini-tasks && npm install
```

## 📝 Notas de Desarrollo

- El sistema usa UUIDs para IDs únicos
- Las contraseñas se validan con mínimo 6 caracteres
- Los tokens JWT expiran en 24 horas
- El middleware de autenticación se aplica automáticamente
- Las tareas se filtran por `user_id` en todas las consultas

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MPL-2.0 - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:
1. Revisa la documentación de [Encore.ts](https://encore.dev/docs)
2. Abre un issue en el repositorio
3. Consulta la documentación de [React](https://react.dev/) y [TypeScript](https://www.typescriptlang.org/)

