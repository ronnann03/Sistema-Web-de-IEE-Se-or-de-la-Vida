import swaggerJSDoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Sistema de Asistencia IEE Senor de la Vida",
      version: "1.0.0",
      description: "Documentacion inicial de endpoints para control de personal, horarios y asistencias.",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor local",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", example: "admin@iee.com" },
            password: { type: "string", example: "admin123" },
          },
        },
        MiembroInput: {
          type: "object",
          properties: {
            nombre: { type: "string", example: "Lucia" },
            apellido: { type: "string", example: "Quispe Ramos" },
            dni: { type: "string", example: "70000001" },
            fechaNacimiento: { type: "string", format: "date", example: "2003-04-12" },
            genero: { type: "string", enum: ["MASCULINO", "FEMENINO", "OTRO"] },
            telefono: { type: "string", example: "987654321" },
            direccion: { type: "string", example: "Av. Los Educadores 123" },
            cargo: { type: "string", example: "Practicante de Sistemas" },
            area: { type: "string", example: "Administracion" },
            fechaIngreso: { type: "string", format: "date", example: "2026-06-01" },
            tipoContrato: { type: "string", enum: ["PLANILLA", "HONORARIOS", "PRACTICANTE"] },
            sueldo: { type: "number", example: 0 },
            estado: { type: "string", enum: ["ACTIVO", "INACTIVO"] },
          },
        },
        RegistroAsistencia: {
          type: "object",
          required: ["miembroId", "tipo"],
          properties: {
            miembroId: { type: "string" },
            tipo: { type: "string", enum: ["PRESENTE", "AUSENTE", "TARDANZA", "PERMISO"] },
            observacion: { type: "string", example: "Entrada marcada manualmente" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          security: [],
          summary: "Iniciar sesion",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } },
          },
          responses: {
            "200": { description: "Token y datos del usuario" },
            "401": { description: "Credenciales incorrectas" },
          },
        },
      },
      "/api/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Obtener usuario autenticado",
          responses: { "200": { description: "Usuario actual" } },
        },
      },
      "/api/miembros": {
        get: {
          tags: ["Miembros"],
          summary: "Listar miembros paginados",
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", example: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", example: 10 } },
            { name: "search", in: "query", schema: { type: "string" } },
          ],
          responses: { "200": { description: "Listado paginado" } },
        },
        post: {
          tags: ["Miembros"],
          summary: "Crear miembro",
          requestBody: {
            required: true,
            content: { "multipart/form-data": { schema: { $ref: "#/components/schemas/MiembroInput" } } },
          },
          responses: { "201": { description: "Miembro creado" } },
        },
      },
      "/api/miembros/{id}": {
        get: {
          tags: ["Miembros"],
          summary: "Obtener miembro por ID",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Miembro" }, "404": { description: "No encontrado" } },
        },
        put: {
          tags: ["Miembros"],
          summary: "Actualizar miembro",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            content: { "multipart/form-data": { schema: { $ref: "#/components/schemas/MiembroInput" } } },
          },
          responses: { "200": { description: "Miembro actualizado" } },
        },
        delete: {
          tags: ["Miembros"],
          summary: "Eliminar miembro",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Miembro eliminado" } },
        },
      },
      "/api/asistencias/entrada": {
        get: {
          tags: ["Asistencias"],
          summary: "Listar marcas de entrada segun rol",
          parameters: [{ name: "fecha", in: "query", schema: { type: "string", format: "date" } }],
          responses: { "200": { description: "Admin ve todas; usuario estandar ve las suyas" } },
        },
        post: {
          tags: ["Asistencias"],
          summary: "Marcar entrada del usuario autenticado",
          responses: {
            "201": { description: "Entrada marcada" },
            "400": { description: "Cuenta no vinculada a miembro" },
            "409": { description: "Entrada ya marcada hoy" },
          },
        },
      },
      "/api/asistencias/bulk": {
        post: {
          tags: ["Asistencias"],
          summary: "Registrar asistencias de varios miembros",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["fecha", "registros"],
                  properties: {
                    fecha: { type: "string", format: "date", example: "2026-06-26" },
                    descripcion: { type: "string", example: "Marcacion de entrada" },
                    registros: {
                      type: "array",
                      items: { $ref: "#/components/schemas/RegistroAsistencia" },
                    },
                  },
                },
              },
            },
          },
          responses: { "201": { description: "Sesion creada con asistencias" } },
        },
      },
      "/api/horarios": {
        get: { tags: ["Horarios"], summary: "Listar horarios", responses: { "200": { description: "Horarios" } } },
        post: { tags: ["Horarios"], summary: "Crear horario", responses: { "201": { description: "Horario creado" } } },
      },
      "/api/stats": {
        get: { tags: ["Reportes"], summary: "Obtener estadisticas del dashboard", responses: { "200": { description: "Estadisticas" } } },
      },
    },
  },
  apis: [],
});
