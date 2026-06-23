import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, UserPlus, Eye, Pencil, Trash2 } from "lucide-react";
import { miembrosService } from "../../services/miembros";
import { getUploadUrl } from "../../services/api";
import type { Miembro } from "../../types";

export default function ListaMiembrosPage() {
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 10;

  useEffect(() => {
    setLoading(true);
    miembrosService.getAll(page, limit, search).then((res) => {
      setMiembros(res.data);
      setTotal(res.total);
    }).finally(() => setLoading(false));
  }, [page, search]);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este miembro?")) return;
    await miembrosService.delete(id);
    setMiembros((prev) => prev.filter((m) => m.id !== id));
    setTotal((t) => t - 1);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Miembros</h2>
        <Link
          to="/miembros/nuevo"
          className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800 transition-colors"
        >
          <UserPlus size={16} />
          Nuevo Miembro
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por nombre, DNI o cargo..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-left">
                <th className="px-4 py-3 font-medium">Foto</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">DNI</th>
                <th className="px-4 py-3 font-medium">Cargo</th>
                <th className="px-4 py-3 font-medium">Área</th>
                <th className="px-4 py-3 font-medium">F. Ingreso</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
              ) : miembros.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No se encontraron miembros</td></tr>
              ) : (
                miembros.map((m) => (
                  <tr key={m.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {m.fotoUrl ? (
                        <img src={getUploadUrl(m.fotoUrl!)} alt={m.nombre} className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                          {m.nombre[0]}{m.apellido[0]}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{m.nombre} {m.apellido}</td>
                    <td className="px-4 py-3 text-gray-600">{m.dni}</td>
                    <td className="px-4 py-3 text-gray-600">{m.cargo}</td>
                    <td className="px-4 py-3 text-gray-600">{m.area}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(m.fechaIngreso).toLocaleDateString("es-PE")}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${m.estado === "ACTIVO" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {m.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/miembros/${m.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"><Eye size={15} /></Link>
                        <Link to={`/miembros/${m.id}/editar`} className="p-1.5 text-gray-400 hover:text-amber-600 transition-colors"><Pencil size={15} /></Link>
                        <button onClick={() => handleDelete(m.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">Mostrando {miembros.length} de {total} miembros</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Anterior</button>
              <span className="px-3 py-1.5 text-sm">{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
