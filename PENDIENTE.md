# Pendientes — Sistema Web IEE Señor de la Vida

## Backend (`/backend`)

### Archivos por crear
- [ ] `src/routes/miembros.ts` — CRUD completo (GET, POST, PUT, DELETE)
- [ ] `src/index.ts` — servidor Express principal con CORS, rutas y uploads
- [ ] `prisma/seed.ts` — usuario admin inicial para poder hacer login

### Instalación
- [ ] Correr `npm install` dentro de `/backend`
- [ ] Correr `npx prisma generate` para generar el cliente
- [ ] Correr `npx prisma migrate dev --name init` para crear las tablas

### Configuración
- [ ] Actualizar `.env` con los datos reales de PostgreSQL:
  ```
  DATABASE_URL="postgresql://USUARIO:PASSWORD@localhost:5432/iee_personal"
  JWT_SECRET="cambiar_por_secreto_seguro"
  ```
- [ ] Crear carpeta `uploads/` para guardar las fotos de perfil

---

## Frontend (`/frontend`)

### Instalación
- [ ] Correr `npm install` dentro de `/frontend` (se interrumpió)
- [ ] Verificar que las dependencias nuevas se instalaron:
  - react-router-dom, axios, react-hook-form, zod, lucide-react, clsx

### Configuración
- [ ] Verificar `.env` apunta al backend correcto:
  ```
  VITE_API_URL=http://localhost:3000
  ```

---

## Base de Datos

- [ ] Tener PostgreSQL instalado y corriendo localmente
  - Opción gratuita en la nube: [Neon](https://neon.tech) o [Supabase](https://supabase.com)
- [ ] Crear la base de datos `iee_personal`

---

## Para levantar el proyecto completo

```bash
# Terminal 1 — Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts   # crea el usuario admin
npm run dev                  # corre en puerto 3000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev                  # corre en puerto 5173
```

Luego abrir: http://localhost:5173

---

## Credenciales iniciales (después del seed)
- **Email:** admin@iee.com
- **Password:** admin123
