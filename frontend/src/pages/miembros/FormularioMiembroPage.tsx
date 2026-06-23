import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText, X } from "lucide-react";
import { miembrosService } from "../../services/miembros";
import { documentosService } from "../../services/documentos";
import { getUploadUrl } from "../../services/api";
import type { MiembroFormData } from "../../types";

const schema = z.object({
  nombre: z.string().min(2, "Requerido"),
  apellido: z.string().min(2, "Requerido"),
  dni: z.string().length(8, "El DNI debe tener 8 dígitos"),
  fechaNacimiento: z.string().min(1, "Requerido"),
  genero: z.enum(["MASCULINO", "FEMENINO", "OTRO"]),
  telefono: z.string().min(9, "Mínimo 9 dígitos"),
  direccion: z.string().min(5, "Requerido"),
  cargo: z.string().min(2, "Requerido"),
  area: z.string().min(2, "Requerido"),
  fechaIngreso: z.string().min(1, "Requerido"),
  tipoContrato: z.enum(["PLANILLA", "HONORARIOS", "PRACTICANTE"]),
  sueldo: z.coerce.number().min(0, "Debe ser mayor a 0"),
});

type FormData = z.infer<typeof schema>;

const AREAS = ["Administración", "Recursos Humanos", "Tecnología", "Finanzas", "Pastoral", "Educación", "Logística", "Comunicaciones"];

export default function FormularioMiembroPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (isEdit && id) {
      miembrosService.getById(id).then((m) => {
        reset({
          nombre: m.nombre,
          apellido: m.apellido,
          dni: m.dni,
          fechaNacimiento: m.fechaNacimiento.slice(0, 10),
          genero: m.genero,
          telefono: m.telefono,
          direccion: m.direccion,
          cargo: m.cargo,
          area: m.area,
          fechaIngreso: m.fechaIngreso.slice(0, 10),
          tipoContrato: m.tipoContrato,
          sueldo: m.sueldo,
        });
        if (m.fotoUrl) setFotoPreview(getUploadUrl(m.fotoUrl));
      });
    }
  }, [id, isEdit, reset]);

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      if (isEdit && id) {
        await miembrosService.update(id, data as MiembroFormData, fotoFile);
      } else {
        const nuevo = await miembrosService.create(data as MiembroFormData, fotoFile);
        if (cvFile) {
          await documentosService.upload(nuevo.id, cvFile, cvFile.name, "CV");
        }
      }
      navigate("/miembros");
    } catch {
      setError("Ocurrió un error al guardar. Intenta de nuevo.");
    }
  };

  const campo = (label: string, name: keyof FormData, type = "text", placeholder = "") => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        {...register(name)}
        type={type}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]?.message as string}</p>}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{isEdit ? "Editar Miembro" : "Nuevo Miembro"}</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Datos Personales */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Datos Personales</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {campo("Nombre", "nombre", "text", "Juan")}
            {campo("Apellido", "apellido", "text", "Pérez")}
            {campo("DNI", "dni", "text", "12345678")}
            {campo("Fecha de Nacimiento", "fechaNacimiento", "date")}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
              <select {...register("genero")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="MASCULINO">Masculino</option>
                <option value="FEMENINO">Femenino</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            {campo("Teléfono", "telefono", "tel", "987654321")}
          </div>
          <div className="mt-4">
            {campo("Dirección", "direccion", "text", "Av. Principal 123, Lima")}
          </div>
        </div>

        {/* Datos Laborales */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Datos Laborales</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {campo("Cargo", "cargo", "text", "Asistente Administrativo")}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
              <select {...register("area")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Seleccionar área</option>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              {errors.area && <p className="text-red-500 text-xs mt-1">{errors.area.message}</p>}
            </div>
            {campo("Fecha de Ingreso", "fechaIngreso", "date")}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Contrato</label>
              <select {...register("tipoContrato")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="PLANILLA">Planilla</option>
                <option value="HONORARIOS">Honorarios</option>
                <option value="PRACTICANTE">Practicante</option>
              </select>
            </div>
            {campo("Sueldo (S/.)", "sueldo", "number", "1500")}
          </div>
        </div>

        {/* Foto de Perfil */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Foto de Perfil</h3>
          <div className="flex items-center gap-4">
            {fotoPreview ? (
              <img src={fotoPreview} alt="preview" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 text-xs text-center">
                Sin foto
              </div>
            )}
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setFotoFile(file);
                  if (file) setFotoPreview(URL.createObjectURL(file));
                }}
                className="text-sm text-gray-600"
              />
              {fotoFile && (
                <p className="text-xs text-gray-400 mt-1">{fotoFile.name}</p>
              )}
            </div>
          </div>
        </div>

        {/* CV — solo al crear */}
        {!isEdit && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-700 mb-1">Currículum Vitae (CV)</h3>
            <p className="text-xs text-gray-400 mb-4">Opcional. También puedes subirlo después desde el perfil del miembro.</p>

            {cvFile ? (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                <FileText size={18} className="text-blue-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{cvFile.name}</p>
                  <p className="text-xs text-gray-400">{(cvFile.size / 1024).toFixed(0)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCvFile(null)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <FileText size={22} className="text-gray-400 mb-1" />
                <span className="text-sm text-gray-500">Seleccionar PDF o Word</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate("/miembros")}
            className="px-5 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-sm bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-60"
          >
            {isSubmitting ? "Guardando..." : isEdit ? "Actualizar" : "Registrar Miembro"}
          </button>
        </div>
      </form>
    </div>
  );
}
