import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, AlarmClock, Save, Search } from "lucide-react";
import api from "../../services/api";
import { getUploadUrl } from "../../services/api";
import { miembrosService } from "../../services/miembros";
import type { Miembro, TipoAsistencia } from "../../types";

const TIPOS: { value: TipoAsistencia; label: string; active: string; icon: React.ReactNode }[] = [
  { value: "PRESENTE",  label: "Presente",  active: "bg-green-500 text-white border-green-500",  icon: <CheckCircle size={13} /> },
  { value: "TARDANZA",  label: "Tardanza",  active: "bg-amber-500 text-white border-amber-500",  icon: <Clock size={13} /> },
  { value: "PERMISO",   label: "Permiso",   active: "bg-blue-500 text-white border-blue-500",    icon: <AlarmClock size={13} /> },
  { value: "AUSENTE",   label: "Ausente",   active: "bg-red-500 text-white border-red-500",      icon: <XCircle size={13} /> },
];

const INACTIVE = "bg-white text-gray-400 border-gray-200 hover:border-gray-400";

const AREAS = ["Administración", "Recursos Humanos", "Tecnología", "Finanzas", "Pastoral", "Educación", "Logística", "Comunicaciones"];

interface Registro { miembroId: string; tipo: TipoAsistencia; observacion: string; }

export default function AsistenciaSeleccionPage() {
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [descripcion, setDescripcion] = useState("");
  const [filtroContrato, setFiltroContrato] = useState("");
  const [filtroArea, setFiltroArea] = useState("");
  const [search, setSearch] = useState("");
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [registros, setRegistros] = useState<Record<string, Registro>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    miembrosService.getAll(1, 500).then((r) => {
      const activos = r.data.filter((m) => m.estado === "ACTIVO");
      setMiembros(activos);
      const init: Record<string, Registro> = {};
      activos.forEach((m) => { init[m.id] = { miembroId: m.id, tipo: "PRESENTE", observacion: "" }; });
      setRegistros(init);
    }).finally(() => setLoading(false));
  }, []);

  const miembrosFiltrados = miembros.filter((m) => {
    if (filtroContrato && m.tipoContrato !== filtroContrato) return false;
    if (filtroArea && m.area !== filtroArea) return false;
    if (search && !`${m.nombre} ${m.apellido} ${m.cargo} ${m.dni}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const setTipo = (id: string, tipo: TipoAsistencia) =>
    setRegistros((r) => ({ ...r, [id]: { ...r[id], tipo } }));

  const setObs = (id: string, obs: string) =>
    setRegistros((r) => ({ ...r, [id]: { ...r[id], observacion: obs } }));

  const marcarTodos = (tipo: TipoAsistencia) =>
    setRegistros((r) => {
      const next = { ...r };
      miembrosFiltrados.forEach((m) => { next[m.id] = { ...next[m.id], tipo }; });
      return next;
    });

  const handleGuardar = async () => {
    const seleccionados = miembrosFiltrados.map((m) => registros[m.id]).filter(Boolean);
    if (!seleccionados.length) return;
    setSaving(true);
    try {
      await api.post("/api/asistencias/bulk", { fecha, descripcion: descripcion || undefined, registros: seleccionados });
      setGuardado(true);
    } finally {
      setSaving(false);
    }
  };

  const presentes = miembrosFiltrados.filter((m) => registros[m.id]?.tipo === "PRESENTE").length;
  const ausentes  = miembrosFiltrados.filter((m) => registros[m.id]?.tipo === "AUSENTE").length;

  if (guardado) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">¡Asistencia registrada!</h3>
        <p className="text-gray-500 text-sm mb-6">
          {presentes} presentes · {ausentes} ausentes ·{" "}
          {new Date(fecha + "T12:00:00").toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <button
          onClick={() => { setGuardado(false); setFecha(new Date().toISOString().slice(0, 10)); setDescripcion(""); }}
          className="bg-blue-900 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-800"
        >
          Pasar otra asistencia
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Pasar Asistencia</h2>
        <p className="text-sm text-gray-400 mt-0.5">Selecciona la fecha y marca a cada miembro</p>
      </div>

      {/* Fecha y descripción */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
            <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Reunión semanal, Capacitación..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar miembro..."
              className="w-full pl-8 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filtroContrato} onChange={(e) => setFiltroContrato(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos los tipos</option>
            <option value="PRACTICANTE">Practicantes</option>
            <option value="PLANILLA">Planilla</option>
            <option value="HONORARIOS">Honorarios</option>
          </select>
          <select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todas las áreas</option>
            {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* Marcar todos */}
      {miembrosFiltrados.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-500">Marcar todos como:</span>
          {TIPOS.map((t) => (
            <button key={t.value} onClick={() => marcarTodos(t.value)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${t.active} transition-colors`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Lista */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span className="font-medium text-gray-700">{miembrosFiltrados.length} miembros</span>
          <span>
            {presentes} presentes ·{" "}
            {miembrosFiltrados.filter((m) => registros[m.id]?.tipo === "TARDANZA").length} tardanzas ·{" "}
            {miembrosFiltrados.filter((m) => registros[m.id]?.tipo === "PERMISO").length} permisos ·{" "}
            {ausentes} ausentes
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
        ) : miembrosFiltrados.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No hay miembros con ese filtro</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {miembrosFiltrados.map((m) => {
              const reg = registros[m.id];
              const tipo = reg?.tipo ?? "PRESENTE";
              return (
                <div key={m.id} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {m.fotoUrl ? (
                      <img src={getUploadUrl(m.fotoUrl)} className="w-9 h-9 rounded-full object-cover flex-shrink-0" alt="" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {m.nombre[0]}{m.apellido[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{m.nombre} {m.apellido}</p>
                      <p className="text-xs text-gray-400 truncate">{m.cargo} · {m.area}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {TIPOS.map((t) => (
                        <button key={t.value} onClick={() => setTipo(m.id, t.value)}
                          title={t.label}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-all ${tipo === t.value ? t.active : INACTIVE}`}>
                          {t.icon}
                          <span className="hidden md:inline">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {(tipo === "TARDANZA" || tipo === "PERMISO" || tipo === "AUSENTE") && (
                    <input value={reg?.observacion ?? ""} onChange={(e) => setObs(m.id, e.target.value)}
                      placeholder="Observación (opcional)..."
                      className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {miembrosFiltrados.length > 0 && (
        <div className="flex justify-end">
          <button onClick={handleGuardar} disabled={saving}
            className="flex items-center gap-2 bg-blue-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60 transition-colors">
            <Save size={16} />
            {saving ? "Guardando..." : `Guardar asistencia (${miembrosFiltrados.length} miembros)`}
          </button>
        </div>
      )}
    </div>
  );
}
