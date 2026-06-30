import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, Clock, AlarmClock, Save } from "lucide-react";
import { horariosService } from "../../services/horarios";
import { getUploadUrl } from "../../services/api";
import type { Horario, TipoAsistencia } from "../../types";

const TIPOS: { value: TipoAsistencia; label: string; color: string; icon: React.ReactNode }[] = [
  { value: "PRESENTE", label: "Presente", color: "bg-green-500 text-white border-green-500", icon: <CheckCircle size={14} /> },
  { value: "TARDANZA", label: "Tardanza", color: "bg-amber-500 text-white border-amber-500", icon: <Clock size={14} /> },
  { value: "PERMISO", label: "Permiso", color: "bg-blue-500 text-white border-blue-500", icon: <AlarmClock size={14} /> },
  { value: "AUSENTE", label: "Ausente", color: "bg-red-500 text-white border-red-500", icon: <XCircle size={14} /> },
];

const TIPO_INACTIVE = "bg-white text-gray-500 border-gray-300 hover:border-gray-400";

interface Registro { miembroId: string; tipo: TipoAsistencia; observacion: string; }

export default function PasarAsistenciaPage() {
  const { id } = useParams<{ id: string }>();
  const [horario, setHorario] = useState<Horario | null>(null);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [descripcion, setDescripcion] = useState("");
  const [registros, setRegistros] = useState<Record<string, Registro>>({});
  const [saving, setSaving] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    if (!id) return;
    horariosService.getById(id).then((h) => {
      setHorario(h);
      const init: Record<string, Registro> = {};
      h.miembros?.forEach(({ miembro: m }) => {
        init[m.id] = { miembroId: m.id, tipo: "PRESENTE", observacion: "" };
      });
      setRegistros(init);
    });
  }, [id]);

  const setTipo = (miembroId: string, tipo: TipoAsistencia) =>
    setRegistros((r) => ({ ...r, [miembroId]: { ...r[miembroId], tipo } }));

  const setObs = (miembroId: string, observacion: string) =>
    setRegistros((r) => ({ ...r, [miembroId]: { ...r[miembroId], observacion } }));

  const marcarTodos = (tipo: TipoAsistencia) =>
    setRegistros((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, { ...v, tipo }])));

  const handleGuardar = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await horariosService.pasarSesion(id, {
        fecha,
        descripcion: descripcion || undefined,
        registros: Object.values(registros),
      });
      setGuardado(true);
    } finally {
      setSaving(false);
    }
  };

  if (!horario) return <div className="text-center py-12 text-gray-400">Cargando...</div>;

  const miembros = horario.miembros ?? [];
  const presentes = Object.values(registros).filter((r) => r.tipo === "PRESENTE").length;
  const ausentes = Object.values(registros).filter((r) => r.tipo === "AUSENTE").length;

  if (guardado) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">¡Asistencia registrada!</h3>
        <p className="text-gray-500 text-sm mb-6">{presentes} presentes · {ausentes} ausentes · {new Date(fecha + "T12:00:00").toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setGuardado(false); setFecha(new Date().toISOString().slice(0, 10)); }} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Nueva sesión</button>
          <Link to="/horarios" className="px-4 py-2 text-sm bg-blue-900 text-white rounded-lg hover:bg-blue-800">Volver a horarios</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/horarios/${id}`} className="p-2 text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-800">Pasar Asistencia</h2>
          <p className="text-sm text-gray-400">{horario.nombre}</p>
        </div>
      </div>

      {/* Fecha y descripción */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de la sesión</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
            <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej: Reunión mensual" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      {miembros.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-500">Marcar todos como:</span>
          {TIPOS.map((t) => (
            <button key={t.value} onClick={() => marcarTodos(t.value)} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${t.color} transition-colors`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Lista de miembros */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">{miembros.length} miembros</span>
          <span className="text-xs text-gray-400">
            {presentes} presentes · {ausentes} ausentes · {Object.values(registros).filter((r) => r.tipo === "TARDANZA").length} tardanzas · {Object.values(registros).filter((r) => r.tipo === "PERMISO").length} permisos
          </span>
        </div>

        {miembros.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No hay miembros asignados a este horario.{" "}
            <Link to={`/horarios/${id}`} className="text-blue-600 hover:underline">Agregar miembros</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {miembros.map(({ miembro: m }) => {
              const reg = registros[m.id];
              const tipoActual = reg?.tipo ?? "PRESENTE";
              return (
                <div key={m.id} className="px-4 py-3">
                  <div className="flex items-center gap-3 mb-2">
                    {m.fotoUrl ? (
                      <img src={getUploadUrl(m.fotoUrl)} className="w-9 h-9 rounded-full object-cover flex-shrink-0" alt="" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {m.nombre[0]}{m.apellido[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{m.nombre} {m.apellido}</p>
                      <p className="text-xs text-gray-400">{m.cargo}</p>
                    </div>
                    <div className="flex gap-1.5">
                      {TIPOS.map((t) => (
                        <button key={t.value} onClick={() => setTipo(m.id, t.value)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-all ${tipoActual === t.value ? t.color : TIPO_INACTIVE}`}>
                          {t.icon}
                          <span className="hidden sm:inline">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {(tipoActual === "TARDANZA" || tipoActual === "PERMISO" || tipoActual === "AUSENTE") && (
                    <input
                      value={reg?.observacion ?? ""}
                      onChange={(e) => setObs(m.id, e.target.value)}
                      placeholder="Observación (opcional)..."
                      className="w-full ml-12 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Botón guardar */}
      {miembros.length > 0 && (
        <div className="flex justify-end">
          <button onClick={handleGuardar} disabled={saving}
            className="flex items-center gap-2 bg-blue-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60 transition-colors">
            <Save size={16} />
            {saving ? "Guardando..." : "Guardar asistencia"}
          </button>
        </div>
      )}
    </div>
  );
}
