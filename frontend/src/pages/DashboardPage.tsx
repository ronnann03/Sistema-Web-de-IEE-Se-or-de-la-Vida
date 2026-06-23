import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, UserCheck, UserX, UserPlus, FileText, Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react";
import api, { getUploadUrl } from "../services/api";

interface Stats {
  miembros: {
    total: number;
    activos: number;
    inactivos: number;
    nuevosEsteMes: number;
    nuevosMesAnterior: number;
    porArea: { area: string; total: number }[];
    porContrato: { tipo: string; total: number }[];
    porGenero: { genero: string; total: number }[];
    ultimos: { id: string; nombre: string; apellido: string; cargo: string; area: string; fotoUrl?: string; createdAt: string }[];
  };
  asistencias: {
    totalEsteMes: number;
    porTipo: { tipo: string; total: number }[];
  };
  documentos: { total: number };
}

const TIPO_ASIST_COLOR: Record<string, string> = {
  PRESENTE: "bg-green-500",
  AUSENTE: "bg-red-500",
  TARDANZA: "bg-amber-500",
  PERMISO: "bg-blue-500",
};

const TIPO_ASIST_LABEL: Record<string, string> = {
  PRESENTE: "Presente",
  AUSENTE: "Ausente",
  TARDANZA: "Tardanza",
  PERMISO: "Permiso",
};

const CONTRATO_COLOR: Record<string, string> = {
  PLANILLA: "bg-blue-100 text-blue-700",
  HONORARIOS: "bg-purple-100 text-purple-700",
  PRACTICANTE: "bg-orange-100 text-orange-700",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Stats>("/api/stats")
      .then((r) => setStats(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Cargando estadísticas...
      </div>
    );
  }

  if (!stats) return null;

  const { miembros, asistencias, documentos } = stats;

  const tendencia = miembros.nuevosEsteMes - miembros.nuevosMesAnterior;
  const TendIcon = tendencia > 0 ? TrendingUp : tendencia < 0 ? TrendingDown : Minus;
  const tendColor = tendencia > 0 ? "text-green-600" : tendencia < 0 ? "text-red-500" : "text-gray-400";

  const maxArea = Math.max(...miembros.porArea.map((a) => a.total), 1);
  const totalAsist = asistencias.porTipo.reduce((s, t) => s + t.total, 0) || 1;

  const mesActual = new Date().toLocaleDateString("es-PE", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Control del Sistema</h2>
        <span className="text-sm text-gray-400 capitalize">{mesActual}</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Miembros</p>
              <p className="text-3xl font-bold text-gray-800">{miembros.total}</p>
            </div>
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg"><Users size={20} /></div>
          </div>
          <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${tendColor}`}>
            <TendIcon size={13} />
            {tendencia > 0 ? `+${tendencia}` : tendencia} vs mes anterior
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Activos</p>
              <p className="text-3xl font-bold text-gray-800">{miembros.activos}</p>
            </div>
            <div className="p-2.5 bg-green-100 text-green-700 rounded-lg"><UserCheck size={20} /></div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${miembros.total ? (miembros.activos / miembros.total) * 100 : 0}%` }} />
            </div>
            <span className="text-xs text-gray-400">{miembros.total ? ((miembros.activos / miembros.total) * 100).toFixed(0) : 0}%</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Asistencias este mes</p>
              <p className="text-3xl font-bold text-gray-800">{asistencias.totalEsteMes}</p>
            </div>
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-lg"><Calendar size={20} /></div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            {asistencias.porTipo.find((t) => t.tipo === "PRESENTE")?.total ?? 0} presentes ·{" "}
            {asistencias.porTipo.find((t) => t.tipo === "AUSENTE")?.total ?? 0} ausentes
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Documentos</p>
              <p className="text-3xl font-bold text-gray-800">{documentos.total}</p>
            </div>
            <div className="p-2.5 bg-orange-100 text-orange-700 rounded-lg"><FileText size={20} /></div>
          </div>
          <p className="text-xs text-gray-400 mt-3">CVs, contratos y otros archivos</p>
        </div>
      </div>

      {/* Fila 2: Área + Contrato + Género */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Por área */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Miembros por Área</h3>
          {miembros.porArea.length === 0 ? (
            <p className="text-sm text-gray-400">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {miembros.porArea.map(({ area, total }) => (
                <div key={area}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 truncate max-w-[70%]">{area}</span>
                    <span className="font-medium text-gray-800">{total}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${(total / maxArea) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Por contrato y género */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-700 mb-3">Tipo de Contrato</h3>
            <div className="space-y-2">
              {miembros.porContrato.map(({ tipo, total }) => (
                <div key={tipo} className="flex items-center justify-between">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CONTRATO_COLOR[tipo] ?? "bg-gray-100 text-gray-600"}`}>
                    {tipo}
                  </span>
                  <span className="text-sm font-bold text-gray-800">{total}</span>
                </div>
              ))}
              {miembros.porContrato.length === 0 && <p className="text-sm text-gray-400">Sin datos</p>}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-700 mb-3">Género</h3>
            <div className="space-y-2">
              {miembros.porGenero.map(({ genero, total }) => (
                <div key={genero} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{genero === "MASCULINO" ? "Masculino" : genero === "FEMENINO" ? "Femenino" : "Otro"}</span>
                  <span className="text-sm font-bold text-gray-800">{total}</span>
                </div>
              ))}
              {miembros.porGenero.length === 0 && <p className="text-sm text-gray-400">Sin datos</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Fila 3: Asistencias del mes + Últimos miembros */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Asistencias del mes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Asistencias del Mes</h3>
          {asistencias.totalEsteMes === 0 ? (
            <p className="text-sm text-gray-400">No hay registros este mes</p>
          ) : (
            <>
              {/* Barra apilada */}
              <div className="flex h-4 rounded-full overflow-hidden mb-4 gap-0.5">
                {(["PRESENTE", "TARDANZA", "PERMISO", "AUSENTE"] as const).map((tipo) => {
                  const found = asistencias.porTipo.find((t) => t.tipo === tipo);
                  const pct = found ? (found.total / totalAsist) * 100 : 0;
                  return pct > 0 ? (
                    <div key={tipo} className={`${TIPO_ASIST_COLOR[tipo]} transition-all duration-500`} style={{ width: `${pct}%` }} title={`${tipo}: ${found?.total}`} />
                  ) : null;
                })}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {asistencias.porTipo.map(({ tipo, total }) => (
                  <div key={tipo} className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${TIPO_ASIST_COLOR[tipo] ?? "bg-gray-400"}`} />
                    <span className="text-xs text-gray-500">{TIPO_ASIST_LABEL[tipo] ?? tipo}</span>
                    <span className="text-xs font-bold text-gray-800 ml-auto">{total}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Últimos miembros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Últimos Miembros</h3>
            <Link to="/miembros" className="text-xs text-blue-600 hover:underline">Ver todos</Link>
          </div>
          {miembros.ultimos.length === 0 ? (
            <p className="text-sm text-gray-400">Sin miembros registrados</p>
          ) : (
            <div className="space-y-3">
              {miembros.ultimos.map((m) => (
                <Link key={m.id} to={`/miembros/${m.id}`} className="flex items-center gap-3 hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded-lg transition-colors">
                  {m.fotoUrl ? (
                    <img src={getUploadUrl(m.fotoUrl)} alt={m.nombre} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {m.nombre[0]}{m.apellido[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{m.nombre} {m.apellido}</p>
                    <p className="text-xs text-gray-400 truncate">{m.cargo} · {m.area}</p>
                  </div>
                  <span className="text-xs text-gray-300 flex-shrink-0">{new Date(m.createdAt).toLocaleDateString("es-PE")}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resumen de estado */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-4">
          <div className="p-2 bg-green-100 text-green-700 rounded-lg"><UserCheck size={20} /></div>
          <div>
            <p className="text-2xl font-bold text-green-700">{miembros.activos}</p>
            <p className="text-xs text-green-600">Miembros activos</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-4">
          <div className="p-2 bg-red-100 text-red-600 rounded-lg"><UserX size={20} /></div>
          <div>
            <p className="text-2xl font-bold text-red-600">{miembros.inactivos}</p>
            <p className="text-xs text-red-500">Miembros inactivos</p>
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-center gap-4">
          <div className="p-2 bg-purple-100 text-purple-700 rounded-lg"><UserPlus size={20} /></div>
          <div>
            <p className="text-2xl font-bold text-purple-700">{miembros.nuevosEsteMes}</p>
            <p className="text-xs text-purple-500">Nuevos este mes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
