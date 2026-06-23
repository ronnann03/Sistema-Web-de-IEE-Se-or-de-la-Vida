export interface Miembro {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string;
  genero: "MASCULINO" | "FEMENINO" | "OTRO";
  telefono: string;
  direccion: string;
  cargo: string;
  area: string;
  fechaIngreso: string;
  tipoContrato: "PLANILLA" | "HONORARIOS" | "PRACTICANTE";
  sueldo: number;
  estado: "ACTIVO" | "INACTIVO";
  fotoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MiembroFormData {
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string;
  genero: "MASCULINO" | "FEMENINO" | "OTRO";
  telefono: string;
  direccion: string;
  cargo: string;
  area: string;
  fechaIngreso: string;
  tipoContrato: "PLANILLA" | "HONORARIOS" | "PRACTICANTE";
  sueldo: number;
  foto?: FileList;
}

export type TipoAsistencia = "PRESENTE" | "AUSENTE" | "TARDANZA" | "PERMISO";

export interface Asistencia {
  id: string;
  miembroId: string;
  fecha: string;
  tipo: TipoAsistencia;
  observacion?: string;
  createdAt: string;
}

export interface Documento {
  id: string;
  miembroId: string;
  nombre: string;
  tipoDoc: string;
  url: string;
  tamano?: number;
  createdAt: string;
}

export interface Horario {
  id: string;
  nombre: string;
  descripcion?: string;
  diasSemana: number[];
  hora: string;
  createdAt: string;
  _count?: { miembros: number; sesiones?: number };
  miembros?: { miembro: Pick<Miembro, "id" | "nombre" | "apellido" | "cargo" | "area" | "fotoUrl" | "estado"> }[];
}

export interface ReporteMiembro {
  id: string;
  nombre: string;
  apellido: string;
  cargo: string;
  area: string;
  dni: string;
  fotoUrl?: string;
  resumen: { PRESENTE: number; AUSENTE: number; TARDANZA: number; PERMISO: number; total: number };
  pctAsistencia: number | null;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  nombre: string;
  email: string;
}
