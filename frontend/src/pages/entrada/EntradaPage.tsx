import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  BadgeCheck,
  Barcode,
  CheckCircle2,
  Clock3,
  Loader2,
  Search,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { asistenciasService } from "../../services/asistencias";
import type { EntradaRegistro } from "../../services/asistencias";
import { getUploadUrl } from "../../services/api";
import { miembrosService } from "../../services/miembros";
import type { Miembro } from "../../types";

interface MarcaLocal {
  miembro: Miembro;
  hora: string;
  metodo: "manual" | "barcode";
}

const todayIso = () => new Date().toISOString().slice(0, 10);

const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const formatHora = (value: string) =>
  new Date(value).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });

export default function EntradaPage() {
  const { user } = useAuth();
  const isAdmin = user?.rol === "ADMIN";
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [historial, setHistorial] = useState<EntradaRegistro[]>([]);
  const [search, setSearch] = useState("");
  const [barcode, setBarcode] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [marcas, setMarcas] = useState<MarcaLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [markingSelf, setMarkingSelf] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);

    const requests = [
      asistenciasService.getEntradas(isAdmin ? todayIso() : undefined).then(setHistorial),
      isAdmin
        ? miembrosService.getAll(1, 100, "").then((res) => {
            const activos = res.data.filter((miembro) => miembro.estado === "ACTIVO");
            setMiembros(activos);
            setSelectedId(activos[0]?.id ?? "");
          })
        : Promise.resolve(),
    ];

    Promise.all(requests).finally(() => setLoading(false));
  }, [isAdmin]);

  const filteredMiembros = useMemo(() => {
    const term = normalize(search);
    if (!term) return miembros.slice(0, 8);

    return miembros
      .filter((miembro) => {
        const target = normalize(
          `${miembro.nombre} ${miembro.apellido} ${miembro.dni} ${miembro.cargo} ${miembro.area}`,
        );
        return target.includes(term);
      })
      .slice(0, 8);
  }, [miembros, search]);

  const selectedMiembro = useMemo(
    () => miembros.find((miembro) => miembro.id === selectedId) ?? filteredMiembros[0] ?? null,
    [filteredMiembros, miembros, selectedId],
  );

  const marcados = useMemo(
    () => new Set([...marcas.map((marca) => marca.miembro.id), ...historial.map((marca) => marca.miembroId)]),
    [historial, marcas],
  );

  const registrarEntradaAdmin = async (miembro: Miembro, metodo: MarcaLocal["metodo"]) => {
    if (savingId) return;

    if (marcados.has(miembro.id)) {
      setMessage({ type: "error", text: `${miembro.nombre} ${miembro.apellido} ya tiene entrada registrada hoy.` });
      return;
    }

    setSavingId(miembro.id);
    setMessage(null);

    try {
      await asistenciasService.bulk({
        fecha: todayIso(),
        descripcion: "Marcacion de entrada",
        registros: [
          {
            miembroId: miembro.id,
            tipo: "PRESENTE",
            observacion: metodo === "barcode" ? "Entrada marcada con lector" : "Entrada marcada por administrador",
          },
        ],
      });

      const hora = new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
      setMarcas((prev) => [{ miembro, hora, metodo }, ...prev]);
      setMessage({ type: "ok", text: `Entrada marcada para ${miembro.nombre} ${miembro.apellido}.` });
      setBarcode("");
      barcodeRef.current?.focus();
    } catch {
      setMessage({ type: "error", text: "No se pudo registrar la entrada. Revisa la conexion con el servidor." });
    } finally {
      setSavingId(null);
    }
  };

  const registrarMiEntrada = async () => {
    setMarkingSelf(true);
    setMessage(null);

    try {
      const entrada = await asistenciasService.marcarEntrada();
      setHistorial((prev) => [entrada, ...prev]);
      setMessage({ type: "ok", text: "Tu entrada fue marcada correctamente." });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message ?? "No se pudo marcar tu entrada.",
      });
    } finally {
      setMarkingSelf(false);
    }
  };

  const handleBarcodeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = barcode.trim();
    if (!code) return;

    const miembro = miembros.find((item) => item.dni === code || item.id === code);
    if (!miembro) {
      setMessage({ type: "error", text: `No encontramos ningun miembro activo con el codigo ${code}.` });
      return;
    }

    void registrarEntradaAdmin(miembro, "barcode");
  };

  const handleManualSubmit = () => {
    if (!selectedMiembro) {
      setMessage({ type: "error", text: "Selecciona un miembro para marcar su entrada." });
      return;
    }

    void registrarEntradaAdmin(selectedMiembro, "manual");
  };

  const fechaActual = new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const alreadyMarkedSelf = !isAdmin && historial.some((item) => item.fecha.slice(0, 10) === todayIso());

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Marcar entrada</h2>
          <p className="text-sm text-gray-400 capitalize">{fechaActual}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
          <Clock3 size={16} />
          {isAdmin ? `${historial.length + marcas.length} entradas hoy` : `${historial.length} ultimas marcas`}
        </div>
      </div>

      {message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.type === "ok"
              ? "border-green-100 bg-green-50 text-green-700"
              : "border-red-100 bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      {!isAdmin ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-8 flex items-start gap-3">
              <div className="rounded-lg bg-green-100 p-2.5 text-green-700">
                <UserCheck size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Mi entrada</h3>
                <p className="text-sm text-gray-400">Marca tu asistencia de ingreso con tu cuenta personal.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={registrarMiEntrada}
              disabled={markingSelf || alreadyMarkedSelf}
              className="flex min-h-24 w-full items-center justify-center gap-3 rounded-xl bg-green-600 px-6 text-lg font-bold uppercase text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {markingSelf ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 size={26} />}
              {alreadyMarkedSelf ? "Entrada marcada hoy" : "Marcar entrada"}
            </button>
          </section>

          <HistorialEntrada historial={historial} loading={loading} title="Mis ultimas marcas" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start gap-3">
                <div className="rounded-lg bg-blue-100 p-2.5 text-blue-700">
                  <Barcode size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Lector de codigo de barra</h3>
                  <p className="text-sm text-gray-400">El lector puede escanear el DNI o codigo y confirmar con Enter.</p>
                </div>
              </div>

              <form onSubmit={handleBarcodeSubmit} className="flex flex-col gap-3 sm:flex-row">
                <input
                  ref={barcodeRef}
                  value={barcode}
                  onChange={(event) => setBarcode(event.target.value)}
                  placeholder="Escanea o escribe el DNI..."
                  className="min-h-11 flex-1 rounded-lg border border-gray-200 px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={savingId !== null || !barcode.trim()}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-900 px-5 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingId ? <Loader2 className="animate-spin" size={16} /> : <BadgeCheck size={16} />}
                  Marcar con codigo
                </button>
              </form>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start gap-3">
                <div className="rounded-lg bg-amber-100 p-2.5 text-amber-700">
                  <UserCheck size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Marcacion manual</h3>
                  <p className="text-sm text-gray-400">Busca al personal y presiona el boton de entrada.</p>
                </div>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nombre, DNI, cargo o area..."
                  className="min-h-11 w-full rounded-lg border border-gray-200 pl-9 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-100">
                {loading ? (
                  <div className="flex items-center justify-center gap-2 p-8 text-sm text-gray-400">
                    <Loader2 className="animate-spin" size={16} />
                    Cargando personal...
                  </div>
                ) : filteredMiembros.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-400">No se encontraron miembros activos.</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredMiembros.map((miembro) => {
                      const isSelected = selectedMiembro?.id === miembro.id;
                      const alreadyMarked = marcados.has(miembro.id);

                      return (
                        <button
                          key={miembro.id}
                          type="button"
                          onClick={() => setSelectedId(miembro.id)}
                          className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                            isSelected ? "bg-blue-50" : "bg-white hover:bg-gray-50"
                          }`}
                        >
                          {miembro.fotoUrl ? (
                            <img
                              src={getUploadUrl(miembro.fotoUrl)}
                              alt={miembro.nombre}
                              className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                              {miembro.nombre[0]}
                              {miembro.apellido[0]}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-800">
                              {miembro.nombre} {miembro.apellido}
                            </p>
                            <p className="truncate text-xs text-gray-400">
                              DNI {miembro.dni} - {miembro.cargo}
                            </p>
                          </div>
                          {alreadyMarked && (
                            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                              Marcado
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-col gap-3 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Seleccionado</p>
                  <p className="truncate text-sm font-semibold text-gray-800">
                    {selectedMiembro ? `${selectedMiembro.nombre} ${selectedMiembro.apellido}` : "Ningun miembro"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleManualSubmit}
                  disabled={!selectedMiembro || savingId !== null || (selectedMiembro ? marcados.has(selectedMiembro.id) : false)}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-green-600 px-6 text-sm font-bold uppercase text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingId ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={18} />}
                  Marcar entrada
                </button>
              </div>
            </div>
          </div>

          <HistorialEntrada historial={historial} loading={loading} marcas={marcas} title="Marcas de hoy" />
        </div>
      )}
    </div>
  );
}

function HistorialEntrada({
  historial,
  loading,
  marcas = [],
  title,
}: {
  historial: EntradaRegistro[];
  loading: boolean;
  marcas?: MarcaLocal[];
  title: string;
}) {
  return (
    <aside className="rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-400">Registros de entrada disponibles.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 p-8 text-sm text-gray-400">
          <Loader2 className="animate-spin" size={16} />
          Cargando marcas...
        </div>
      ) : historial.length === 0 && marcas.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-400">Todavia no hay marcas de entrada.</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {marcas.map((marca) => (
            <div key={`${marca.miembro.id}-${marca.hora}`} className="flex items-center gap-3 px-5 py-4">
              <div className="rounded-lg bg-green-100 p-2 text-green-700">
                <CheckCircle2 size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800">
                  {marca.miembro.nombre} {marca.miembro.apellido}
                </p>
                <p className="text-xs text-gray-400">
                  {marca.hora} - {marca.metodo === "barcode" ? "lector" : "manual"}
                </p>
              </div>
            </div>
          ))}

          {historial.map((entrada) => (
            <div key={entrada.id} className="flex items-center gap-3 px-5 py-4">
              <div className="rounded-lg bg-green-100 p-2 text-green-700">
                <CheckCircle2 size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800">
                  {entrada.miembro ? `${entrada.miembro.nombre} ${entrada.miembro.apellido}` : "Entrada registrada"}
                </p>
                <p className="text-xs text-gray-400">
                  {formatHora(entrada.createdAt)} - {entrada.observacion ?? "Entrada"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
