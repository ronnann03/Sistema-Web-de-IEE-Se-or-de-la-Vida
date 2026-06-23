import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, UserPlus, X, Clock, Users } from "lucide-react";
import { horariosService } from "../../services/horarios";
import { miembrosService } from "../../services/miembros";
import { getUploadUrl } from "../../services/api";
import type { Horario, Miembro } from "../../types";

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function HorarioDetallePage() {
  const { id } = useParams<{ id: string }>();
  const [horario, setHorario] = useState<Horario | null>(null);
  const [todosLosMiembros, setTodosLosMiembros] = useState<Miembro[]>([]);
  const [search, setSearch] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    horariosService.getById(id).then(setHorario);
    miembrosService.getAll(1, 1000).then((r) => setTodosLosMiembros(r.data));
  }, [id]);

  const miembrosEnHorario = new Set(horario?.miembros?.map((hm) => hm.miembro.id) ?? []);

  const handleAdd = async (miembroId: string) => {
    if (!id) return;
    setAdding(miembroId);
    try {
      await horariosService.addMiembro(id, miembroId);
      const actualizado = await horariosService.getById(id);
      setHorario(actualizado);
    } finally {
      setAdding(null);
    }
  };

  const handleRemove = async (miembroId: string) => {
    if (!id || !confirm("¿Quitar este miembro del horario?")) return;
    await horariosService.removeMiembro(id, miembroId);
    setHorario((prev) => prev ? {
      ...prev,
      miembros: prev.miembros?.filter((hm) => hm.miembro.id !== miembroId),
      _count: { miembros: (prev._count?.miembros ?? 1) - 1 },
    } : prev);
  };

  const disponibles = todosLosMiembros.filter((m) => !miembrosEnHorario.has(m.id) && (
    !search || `${m.nombre} ${m.apellido} ${m.cargo}`.toLowerCase().includes(search.toLowerCase())
  ));

  if (!horario) return <div className="text-center py-12 text-gray-400">Cargando...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/horarios" className="p-2 text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-800">{horario.nombre}</h2>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Clock size={13} />{horario.hora}</span>
            <span>·</span>
            <span>{horario.diasSemana.map((d) => DIAS[d]).join(", ")}</span>
          </div>
        </div>
        <Link to={`/horarios/${horario.id}/asistencia`} className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800 transition-colors">
          Pasar Asistencia
        </Link>
      </div>

      {/* Miembros asignados */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <Users size={16} /> Miembros asignados ({horario._count?.miembros ?? 0})
          </h3>
          <button onClick={() => setShowPicker((v) => !v)} className="flex items-center gap-2 text-sm bg-blue-900 text-white px-3 py-1.5 rounded-lg hover:bg-blue-800 transition-colors">
            <UserPlus size={14} /> Agregar
          </button>
        </div>

        {showPicker && (
          <div className="p-4 bg-blue-50 border-b border-blue-100">
            <input
              placeholder="Buscar miembro..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {disponibles.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-3">
                  {search ? "Sin resultados" : "Todos los miembros ya están asignados"}
                </p>
              ) : (
                disponibles.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2">
                    {m.fotoUrl ? (
                      <img src={getUploadUrl(m.fotoUrl)} className="w-8 h-8 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                        {m.nombre[0]}{m.apellido[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{m.nombre} {m.apellido}</p>
                      <p className="text-xs text-gray-400 truncate">{m.cargo}</p>
                    </div>
                    <button
                      onClick={() => handleAdd(m.id)}
                      disabled={adding === m.id}
                      className="text-xs bg-blue-900 text-white px-2.5 py-1 rounded-lg hover:bg-blue-800 disabled:opacity-60"
                    >
                      {adding === m.id ? "..." : "Agregar"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="divide-y divide-gray-100">
          {!horario.miembros || horario.miembros.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">Sin miembros asignados</div>
          ) : (
            horario.miembros.map(({ miembro: m }) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                {m.fotoUrl ? (
                  <img src={getUploadUrl(m.fotoUrl)} className="w-9 h-9 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    {m.nombre[0]}{m.apellido[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{m.nombre} {m.apellido}</p>
                  <p className="text-xs text-gray-400 truncate">{m.cargo} · {m.area}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.estado === "ACTIVO" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {m.estado}
                </span>
                <button onClick={() => handleRemove(m.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors">
                  <X size={15} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
