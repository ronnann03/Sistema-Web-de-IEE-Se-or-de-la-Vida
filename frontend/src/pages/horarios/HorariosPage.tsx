import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Clock, Users, Pencil, Trash2, X, Check } from "lucide-react";
import { horariosService } from "../../services/horarios";
import type { Horario } from "../../types";

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DIAS_FULL = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const DIAS_COLOR = ["bg-orange-100 text-orange-700", "bg-blue-100 text-blue-700", "bg-blue-100 text-blue-700", "bg-blue-100 text-blue-700", "bg-blue-100 text-blue-700", "bg-blue-100 text-blue-700", "bg-purple-100 text-purple-700"];

interface HorarioForm { nombre: string; descripcion: string; diasSemana: number[]; hora: string; }
const emptyForm = (): HorarioForm => ({ nombre: "", descripcion: "", diasSemana: [], hora: "08:00" });

export default function HorariosPage() {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<HorarioForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = () => {
    setLoading(true);
    horariosService.getAll().then(setHorarios).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditId(null); setForm(emptyForm()); setFormError(""); setShowModal(true); };
  const openEdit = (h: Horario) => { setEditId(h.id); setForm({ nombre: h.nombre, descripcion: h.descripcion || "", diasSemana: h.diasSemana, hora: h.hora }); setFormError(""); setShowModal(true); };

  const toggleDia = (d: number) => setForm((f) => ({ ...f, diasSemana: f.diasSemana.includes(d) ? f.diasSemana.filter((x) => x !== d) : [...f.diasSemana, d].sort() }));

  const handleSave = async () => {
    if (!form.nombre.trim()) { setFormError("El nombre es requerido"); return; }
    if (form.diasSemana.length === 0) { setFormError("Selecciona al menos un día"); return; }
    if (!form.hora) { setFormError("La hora es requerida"); return; }
    setSaving(true);
    setFormError("");
    try {
      if (editId) {
        const updated = await horariosService.update(editId, form);
        setHorarios((prev) => prev.map((h) => h.id === editId ? { ...h, ...updated } : h));
      } else {
        const nuevo = await horariosService.create(form);
        setHorarios((prev) => [{ ...nuevo, _count: { miembros: 0 } }, ...prev]);
      }
      setShowModal(false);
    } catch {
      setFormError("Error al guardar el horario");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este horario? Se perderán las sesiones asociadas.")) return;
    await horariosService.delete(id);
    setHorarios((prev) => prev.filter((h) => h.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Horarios</h2>
          <p className="text-sm text-gray-400 mt-0.5">Define los horarios y asigna miembros para pasar asistencia</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800 transition-colors">
          <Plus size={16} /> Nuevo Horario
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : horarios.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <Clock size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No hay horarios creados</p>
          <p className="text-gray-400 text-sm mt-1">Crea un horario para comenzar a pasar asistencia</p>
          <button onClick={openCreate} className="mt-4 bg-blue-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800 transition-colors">
            Crear primer horario
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {horarios.map((h) => (
            <div key={h.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">{h.nombre}</h3>
                  {h.descripcion && <p className="text-xs text-gray-400 mt-0.5 truncate">{h.descripcion}</p>}
                </div>
                <div className="flex gap-1 ml-2">
                  <button onClick={() => openEdit(h)} className="p-1.5 text-gray-400 hover:text-amber-600 transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(h.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {h.diasSemana.map((d) => (
                  <span key={d} className={`text-xs font-medium px-2 py-0.5 rounded-full ${DIAS_COLOR[d]}`}>{DIAS[d]}</span>
                ))}
                <span className="text-xs text-gray-500 flex items-center gap-1 ml-auto"><Clock size={12} />{h.hora}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Users size={13} /> {h._count?.miembros ?? 0} miembros
                </span>
                <div className="flex gap-2">
                  <Link to={`/horarios/${h.id}`} className="text-xs text-blue-600 hover:underline font-medium">Gestionar</Link>
                  <Link to={`/horarios/${h.id}/asistencia`} className="text-xs bg-blue-900 text-white px-2.5 py-1 rounded-lg hover:bg-blue-800 transition-colors">
                    Pasar asistencia
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">{editId ? "Editar Horario" : "Nuevo Horario"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Turno Mañana" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} placeholder="Opcional" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Días *</label>
                <div className="flex gap-1.5 flex-wrap">
                  {DIAS_FULL.map((dia, i) => (
                    <button key={i} type="button" onClick={() => toggleDia(i)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${form.diasSemana.includes(i) ? "bg-blue-900 text-white border-blue-900" : "border-gray-300 text-gray-600 hover:border-blue-400"}`}>
                      {form.diasSemana.includes(i) && <Check size={11} />}{dia}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora *</label>
                <input type="time" value={form.hora} onChange={(e) => setForm((f) => ({ ...f, hora: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {formError && <p className="text-red-500 text-xs">{formError}</p>}
            </div>
            <div className="flex gap-3 p-5 pt-0 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-blue-900 text-white rounded-lg hover:bg-blue-800 disabled:opacity-60">
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
