import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Pencil, ArrowLeft, Trash2, Calendar, FileText, User, Plus, Download, X, CheckCircle, XCircle, Clock, AlarmClock } from "lucide-react";
import { miembrosService } from "../../services/miembros";
import { asistenciasService } from "../../services/asistencias";
import { documentosService } from "../../services/documentos";
import { getUploadUrl } from "../../services/api";
import type { Miembro, Asistencia, Documento, TipoAsistencia } from "../../types";

type Tab = "info" | "asistencias" | "documentos";

const TIPO_COLORS: Record<TipoAsistencia, string> = {
  PRESENTE: "bg-green-100 text-green-700",
  AUSENTE: "bg-red-100 text-red-700",
  TARDANZA: "bg-amber-100 text-amber-700",
  PERMISO: "bg-blue-100 text-blue-700",
};

const TIPO_ICONS: Record<TipoAsistencia, React.ReactNode> = {
  PRESENTE: <CheckCircle size={13} />,
  AUSENTE: <XCircle size={13} />,
  TARDANZA: <Clock size={13} />,
  PERMISO: <AlarmClock size={13} />,
};

export default function DetalleMiembroPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [miembro, setMiembro] = useState<Miembro | null>(null);
  const [tab, setTab] = useState<Tab>("info");

  // Asistencias
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [loadingAsist, setLoadingAsist] = useState(false);
  const [showAsistForm, setShowAsistForm] = useState(false);
  const [asistFecha, setAsistFecha] = useState(new Date().toISOString().slice(0, 10));
  const [asistTipo, setAsistTipo] = useState<TipoAsistencia>("PRESENTE");
  const [asistObs, setAsistObs] = useState("");
  const [savingAsist, setSavingAsist] = useState(false);

  // Documentos
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [showDocForm, setShowDocForm] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docNombre, setDocNombre] = useState("");
  const [docTipo, setDocTipo] = useState("CV");
  const [savingDoc, setSavingDoc] = useState(false);

  useEffect(() => {
    if (id) miembrosService.getById(id).then(setMiembro);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    if (tab === "asistencias" && asistencias.length === 0) {
      setLoadingAsist(true);
      asistenciasService.getByMiembro(id).then(setAsistencias).finally(() => setLoadingAsist(false));
    }
    if (tab === "documentos" && documentos.length === 0) {
      setLoadingDocs(true);
      documentosService.getByMiembro(id).then(setDocumentos).finally(() => setLoadingDocs(false));
    }
  }, [tab, id]);

  const handleDelete = async () => {
    if (!miembro || !confirm("¿Eliminar este miembro permanentemente?")) return;
    await miembrosService.delete(miembro.id);
    navigate("/miembros");
  };

  const handleAddAsistencia = async () => {
    if (!id) return;
    setSavingAsist(true);
    try {
      const nueva = await asistenciasService.create(id, { fecha: asistFecha, tipo: asistTipo, observacion: asistObs });
      setAsistencias((prev) => [nueva, ...prev]);
      setShowAsistForm(false);
      setAsistObs("");
    } finally {
      setSavingAsist(false);
    }
  };

  const handleDeleteAsistencia = async (asistenciaId: string) => {
    if (!id || !confirm("¿Eliminar este registro?")) return;
    await asistenciasService.delete(id, asistenciaId);
    setAsistencias((prev) => prev.filter((a) => a.id !== asistenciaId));
  };

  const handleUploadDoc = async () => {
    if (!id || !docFile) return;
    setSavingDoc(true);
    try {
      const nuevo = await documentosService.upload(id, docFile, docNombre || docFile.name, docTipo);
      setDocumentos((prev) => [nuevo, ...prev]);
      setShowDocForm(false);
      setDocFile(null);
      setDocNombre("");
      setDocTipo("CV");
    } finally {
      setSavingDoc(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!id || !confirm("¿Eliminar este documento?")) return;
    await documentosService.delete(id, docId);
    setDocumentos((prev) => prev.filter((d) => d.id !== docId));
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!miembro) return <div className="text-center py-12 text-gray-400">Cargando...</div>;

  const dato = (label: string, value: string | number) => (
    <div>
      <dt className="text-xs text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="text-sm font-medium text-gray-800 mt-0.5">{value}</dd>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Cabecera */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/miembros" className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-2xl font-bold text-gray-800 flex-1">Perfil del Miembro</h2>
        <Link to={`/miembros/${miembro.id}/editar`} className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <Pencil size={14} /> Editar
        </Link>
        <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
          <Trash2 size={14} /> Eliminar
        </button>
      </div>

      {/* Card de perfil */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
        <div className="flex items-center gap-5">
          {miembro.fotoUrl ? (
            <img src={getUploadUrl(miembro.fotoUrl)} alt={miembro.nombre} className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold">
              {miembro.nombre[0]}{miembro.apellido[0]}
            </div>
          )}
          <div>
            <h3 className="text-xl font-bold text-gray-800">{miembro.nombre} {miembro.apellido}</h3>
            <p className="text-gray-500 text-sm">{miembro.cargo} — {miembro.area}</p>
            <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${miembro.estado === "ACTIVO" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
              {miembro.estado}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {[
          { key: "info", label: "Información", icon: <User size={15} /> },
          { key: "asistencias", label: "Asistencias", icon: <Calendar size={15} /> },
          { key: "documentos", label: "Documentos", icon: <FileText size={15} /> },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as Tab)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === key ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── TAB: INFORMACIÓN ── */}
      {tab === "info" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h4 className="font-semibold text-gray-700 mb-4">Datos Personales</h4>
            <dl className="space-y-3">
              {dato("DNI", miembro.dni)}
              {dato("Fecha de Nacimiento", new Date(miembro.fechaNacimiento).toLocaleDateString("es-PE"))}
              {dato("Género", miembro.genero)}
              {dato("Teléfono", miembro.telefono)}
              {dato("Dirección", miembro.direccion)}
            </dl>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h4 className="font-semibold text-gray-700 mb-4">Datos Laborales</h4>
            <dl className="space-y-3">
              {dato("Cargo", miembro.cargo)}
              {dato("Área", miembro.area)}
              {dato("Fecha de Ingreso", new Date(miembro.fechaIngreso).toLocaleDateString("es-PE"))}
              {dato("Tipo de Contrato", miembro.tipoContrato)}
              {dato("Sueldo", `S/. ${miembro.sueldo.toLocaleString("es-PE")}`)}
            </dl>
          </div>
        </div>
      )}

      {/* ── TAB: ASISTENCIAS ── */}
      {tab === "asistencias" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h4 className="font-semibold text-gray-700">Registro de Asistencias</h4>
            <button
              onClick={() => setShowAsistForm((v) => !v)}
              className="flex items-center gap-2 bg-blue-900 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-800 transition-colors"
            >
              <Plus size={15} /> Registrar
            </button>
          </div>

          {showAsistForm && (
            <div className="p-4 bg-blue-50 border-b border-blue-100">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={asistFecha}
                    onChange={(e) => setAsistFecha(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                  <select
                    value={asistTipo}
                    onChange={(e) => setAsistTipo(e.target.value as TipoAsistencia)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PRESENTE">Presente</option>
                    <option value="AUSENTE">Ausente</option>
                    <option value="TARDANZA">Tardanza</option>
                    <option value="PERMISO">Permiso</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Observación (opcional)</label>
                  <input
                    type="text"
                    value={asistObs}
                    onChange={(e) => setAsistObs(e.target.value)}
                    placeholder="Notas adicionales..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAsistForm(false)} className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button onClick={handleAddAsistencia} disabled={savingAsist} className="px-4 py-1.5 text-sm bg-blue-900 text-white rounded-lg hover:bg-blue-800 disabled:opacity-60">
                  {savingAsist ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-left">
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Observación</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {loadingAsist ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
                ) : asistencias.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Sin registros de asistencia</td></tr>
                ) : (
                  asistencias.map((a) => (
                    <tr key={a.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">{new Date(a.fecha).toLocaleDateString("es-PE")}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${TIPO_COLORS[a.tipo]}`}>
                          {TIPO_ICONS[a.tipo]} {a.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{a.observacion || "—"}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDeleteAsistencia(a.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {asistencias.length > 0 && (
            <div className="p-4 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
              {(["PRESENTE", "AUSENTE", "TARDANZA", "PERMISO"] as TipoAsistencia[]).map((t) => (
                <span key={t} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${TIPO_COLORS[t]}`}>
                  {TIPO_ICONS[t]} {asistencias.filter((a) => a.tipo === t).length} {t.toLowerCase()}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: DOCUMENTOS ── */}
      {tab === "documentos" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h4 className="font-semibold text-gray-700">Documentos del Miembro</h4>
            <button
              onClick={() => setShowDocForm((v) => !v)}
              className="flex items-center gap-2 bg-blue-900 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-800 transition-colors"
            >
              <Plus size={15} /> Subir archivo
            </button>
          </div>

          {showDocForm && (
            <div className="p-4 bg-blue-50 border-b border-blue-100">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de documento</label>
                  <select
                    value={docTipo}
                    onChange={(e) => setDocTipo(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CV">Currículum Vitae (CV)</option>
                    <option value="DNI">DNI</option>
                    <option value="Contrato">Contrato</option>
                    <option value="Certificado">Certificado</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre (opcional)</label>
                  <input
                    type="text"
                    value={docNombre}
                    onChange={(e) => setDocNombre(e.target.value)}
                    placeholder="Ej: CV actualizado 2026"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Archivo (PDF o Word)</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                    className="w-full text-sm text-gray-600"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setShowDocForm(false); setDocFile(null); }} className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button onClick={handleUploadDoc} disabled={savingDoc || !docFile} className="px-4 py-1.5 text-sm bg-blue-900 text-white rounded-lg hover:bg-blue-800 disabled:opacity-60">
                  {savingDoc ? "Subiendo..." : "Subir"}
                </button>
              </div>
            </div>
          )}

          <div className="divide-y divide-gray-100">
            {loadingDocs ? (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">Cargando...</div>
            ) : documentos.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">Sin documentos cargados</div>
            ) : (
              documentos.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                  <div className="w-9 h-9 rounded-lg bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{doc.nombre}</p>
                    <p className="text-xs text-gray-400">
                      {doc.tipoDoc} · {formatBytes(doc.tamano)} · {new Date(doc.createdAt).toLocaleDateString("es-PE")}
                    </p>
                  </div>
                  <a
                    href={getUploadUrl(doc.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Descargar"
                  >
                    <Download size={16} />
                  </a>
                  <button onClick={() => handleDeleteDoc(doc.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors" title="Eliminar">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
