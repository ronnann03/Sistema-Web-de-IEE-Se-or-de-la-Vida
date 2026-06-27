import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock3, Loader2, UserCheck } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { asistenciasService } from "../services/asistencias";
import type { EntradaRegistro } from "../services/asistencias";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });

export default function UsuarioDashboardPage() {
  const { user } = useAuth();
  const [entradas, setEntradas] = useState<EntradaRegistro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    asistenciasService
      .getEntradas()
      .then(setEntradas)
      .finally(() => setLoading(false));
  }, []);

  const ultimaEntrada = entradas[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Mi Panel</h2>
        <p className="text-sm text-gray-400">Hola, {user?.nombre}. Aqui puedes revisar tu asistencia personal.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Ultima entrada</p>
              <p className="mt-2 text-xl font-bold text-gray-800">
                {ultimaEntrada ? formatTime(ultimaEntrada.createdAt) : "Sin marcas"}
              </p>
            </div>
            <div className="rounded-lg bg-green-100 p-2.5 text-green-700">
              <Clock3 size={20} />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            {ultimaEntrada ? formatDate(ultimaEntrada.createdAt) : "Aun no registras entradas."}
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Mis registros</p>
              <p className="mt-2 text-3xl font-bold text-gray-800">{entradas.length}</p>
            </div>
            <div className="rounded-lg bg-blue-100 p-2.5 text-blue-700">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-400">Ultimas marcas disponibles para tu usuario.</p>
        </div>

        <Link
          to="/entrada"
          className="flex min-h-32 items-center justify-center gap-3 rounded-xl bg-green-600 px-5 text-sm font-bold uppercase text-white shadow-sm transition hover:bg-green-500"
        >
          <UserCheck size={22} />
          Marcar entrada
        </Link>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="font-semibold text-gray-800">Mis ultimas entradas</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-8 text-sm text-gray-400">
            <Loader2 className="animate-spin" size={16} />
            Cargando marcas...
          </div>
        ) : entradas.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">Todavia no tienes entradas registradas.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {entradas.slice(0, 8).map((entrada) => (
              <div key={entrada.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-gray-800">{formatDate(entrada.createdAt)}</p>
                  <p className="text-xs text-gray-400">{entrada.observacion ?? "Entrada registrada"}</p>
                </div>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                  {formatTime(entrada.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
