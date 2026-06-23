import { useEffect, useState } from "react";
import { FileDown, RefreshCw, CheckCircle, XCircle, Clock, AlarmClock } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { horariosService } from "../../services/horarios";
import type { Horario, ReporteMiembro } from "../../types";

const hoy = new Date();
const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
const hoyStr = hoy.toISOString().slice(0, 10);

export default function ReportePage() {
  const [desde, setDesde] = useState(primerDiaMes);
  const [hasta, setHasta] = useState(hoyStr);
  const [horarioId, setHorarioId] = useState("");
  const [area, setArea] = useState("");
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [miembros, setMiembros] = useState<ReporteMiembro[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { horariosService.getAll().then(setHorarios); }, []);

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await horariosService.getReporte({ desde, hasta, horarioId: horarioId || undefined, area: area || undefined });
      setMiembros(res.miembros);
      setAreas(res.areas);
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const generarPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const fechaDesde = new Date(desde + "T12:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });
    const fechaHasta = new Date(hasta + "T12:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });

    // ── Encabezado ──
    doc.setFillColor(30, 58, 138); // blue-900
    doc.rect(0, 0, pageW, 38, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("IEE Señor de la Vida", 14, 14);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Sistema de Gestión de Personal", 14, 21);

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Reporte de Asistencias", 14, 31);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Período: ${fechaDesde} — ${fechaHasta}`, pageW - 14, 18, { align: "right" });
    doc.text(`Generado: ${new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })}`, pageW - 14, 24, { align: "right" });
    if (area) doc.text(`Área: ${area}`, pageW - 14, 30, { align: "right" });

    // ── Resumen global ──
    let y = 48;
    const totalAsist = miembros.reduce((s, m) => s + m.resumen.total, 0);
    const totalPresente = miembros.reduce((s, m) => s + m.resumen.PRESENTE, 0);
    const totalAusente = miembros.reduce((s, m) => s + m.resumen.AUSENTE, 0);
    const totalTardanza = miembros.reduce((s, m) => s + m.resumen.TARDANZA, 0);
    const totalPermiso = miembros.reduce((s, m) => s + m.resumen.PERMISO, 0);
    const pctGlobal = totalAsist > 0 ? Math.round((totalPresente / totalAsist) * 100) : 0;

    const cardW = (pageW - 28 - 12) / 4;
    const cards = [
      { label: "Presentes", val: totalPresente, bg: [220, 252, 231] as [number, number, number], text: [21, 128, 61] as [number, number, number] },
      { label: "Ausentes", val: totalAusente, bg: [254, 226, 226] as [number, number, number], text: [185, 28, 28] as [number, number, number] },
      { label: "Tardanzas", val: totalTardanza, bg: [254, 243, 199] as [number, number, number], text: [146, 64, 14] as [number, number, number] },
      { label: "Permisos", val: totalPermiso, bg: [219, 234, 254] as [number, number, number], text: [29, 78, 216] as [number, number, number] },
    ];

    cards.forEach((c, i) => {
      const x = 14 + i * (cardW + 4);
      doc.setFillColor(...c.bg);
      doc.roundedRect(x, y, cardW, 22, 2, 2, "F");
      doc.setTextColor(...c.text);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(String(c.val), x + cardW / 2, y + 11, { align: "center" });
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(c.label, x + cardW / 2, y + 17, { align: "center" });
    });

    // Asistencia global
    y += 28;
    doc.setTextColor(75, 85, 99);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Total de registros: ${totalAsist}  ·  ${miembros.length} miembros  ·  Asistencia promedio: ${pctGlobal}%`, 14, y);

    // ── Tabla ──
    y += 8;
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Detalle por Miembro", 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["#", "Apellidos y Nombres", "DNI", "Cargo", "Área", "Pres.", "Aus.", "Tard.", "Perm.", "Total", "% Asist."]],
      body: miembros.map((m, i) => [
        i + 1,
        `${m.apellido}, ${m.nombre}`,
        m.dni,
        m.cargo,
        m.area,
        m.resumen.PRESENTE,
        m.resumen.AUSENTE,
        m.resumen.TARDANZA,
        m.resumen.PERMISO,
        m.resumen.total,
        m.pctAsistencia !== null ? `${m.pctAsistencia}%` : "—",
      ]),
      styles: { fontSize: 8, cellPadding: 2.5, textColor: [55, 65, 81] },
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { halign: "center", cellWidth: 8 },
        1: { cellWidth: 42 },
        2: { halign: "center", cellWidth: 18 },
        3: { cellWidth: 30 },
        4: { cellWidth: 24 },
        5: { halign: "center", cellWidth: 12, textColor: [21, 128, 61] },
        6: { halign: "center", cellWidth: 12, textColor: [185, 28, 28] },
        7: { halign: "center", cellWidth: 12, textColor: [146, 64, 14] },
        8: { halign: "center", cellWidth: 12, textColor: [29, 78, 216] },
        9: { halign: "center", cellWidth: 12 },
        10: { halign: "center", cellWidth: 16, fontStyle: "bold" },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 10) {
          const val = parseInt(String(data.cell.raw));
          if (!isNaN(val)) {
            data.cell.styles.textColor = val >= 80 ? [21, 128, 61] : val >= 60 ? [146, 64, 14] : [185, 28, 28];
          }
        }
      },
      margin: { left: 14, right: 14 },
    });

    // ── Pie de página ──
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFillColor(248, 250, 252);
      doc.rect(0, pageH - 12, pageW, 12, "F");
      doc.setTextColor(156, 163, 175);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text("IEE Señor de la Vida — Sistema de Gestión de Personal", 14, pageH - 4);
      doc.text(`Página ${i} de ${pageCount}`, pageW - 14, pageH - 4, { align: "right" });
    }

    const nombre = `reporte-asistencias-${desde}-${hasta}.pdf`;
    doc.save(nombre);
  };

  const pctColor = (pct: number | null) => {
    if (pct === null) return "text-gray-400";
    if (pct >= 80) return "text-green-600 font-bold";
    if (pct >= 60) return "text-amber-600 font-bold";
    return "text-red-600 font-bold";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reportes</h2>
          <p className="text-sm text-gray-400 mt-0.5">Genera reportes de asistencia y expórtalos en PDF</p>
        </div>
        {loaded && miembros.length > 0 && (
          <button onClick={generarPDF} className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800 transition-colors">
            <FileDown size={16} /> Exportar PDF
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
        <h3 className="font-semibold text-gray-700 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Desde</label>
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Horario</label>
            <select value={horarioId} onChange={(e) => setHorarioId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todos los horarios</option>
              {horarios.map((h) => <option key={h.id} value={h.id}>{h.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Área</label>
            <select value={area} onChange={(e) => setArea(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todas las áreas</option>
              {areas.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={cargar} disabled={loading} className="flex items-center gap-2 bg-blue-900 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-800 disabled:opacity-60 transition-colors">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            {loading ? "Generando..." : "Generar reporte"}
          </button>
        </div>
      </div>

      {/* Resultados */}
      {loaded && (
        <>
          {miembros.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
              Sin registros para el período seleccionado
            </div>
          ) : (
            <>
              {/* Resumen */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Presentes", val: miembros.reduce((s, m) => s + m.resumen.PRESENTE, 0), color: "bg-green-50 text-green-700", icon: <CheckCircle size={16} /> },
                  { label: "Ausentes", val: miembros.reduce((s, m) => s + m.resumen.AUSENTE, 0), color: "bg-red-50 text-red-600", icon: <XCircle size={16} /> },
                  { label: "Tardanzas", val: miembros.reduce((s, m) => s + m.resumen.TARDANZA, 0), color: "bg-amber-50 text-amber-700", icon: <Clock size={16} /> },
                  { label: "Permisos", val: miembros.reduce((s, m) => s + m.resumen.PERMISO, 0), color: "bg-blue-50 text-blue-700", icon: <AlarmClock size={16} /> },
                ].map((c) => (
                  <div key={c.label} className={`${c.color} rounded-xl p-4 flex items-center gap-3`}>
                    {c.icon}
                    <div>
                      <p className="text-2xl font-bold">{c.val}</p>
                      <p className="text-xs opacity-75">{c.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabla */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700">{miembros.length} miembros</span>
                  <button onClick={generarPDF} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium">
                    <FileDown size={13} /> Exportar PDF
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-left text-xs">
                        <th className="px-4 py-3 font-medium">Miembro</th>
                        <th className="px-4 py-3 font-medium">Área</th>
                        <th className="px-4 py-3 font-medium text-center text-green-700">Pres.</th>
                        <th className="px-4 py-3 font-medium text-center text-red-600">Aus.</th>
                        <th className="px-4 py-3 font-medium text-center text-amber-600">Tard.</th>
                        <th className="px-4 py-3 font-medium text-center text-blue-600">Perm.</th>
                        <th className="px-4 py-3 font-medium text-center">Total</th>
                        <th className="px-4 py-3 font-medium text-center">% Asist.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {miembros.map((m) => (
                        <tr key={m.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800">{m.apellido}, {m.nombre}</p>
                            <p className="text-xs text-gray-400">{m.cargo}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{m.area}</td>
                          <td className="px-4 py-3 text-center font-medium text-green-700">{m.resumen.PRESENTE}</td>
                          <td className="px-4 py-3 text-center font-medium text-red-600">{m.resumen.AUSENTE}</td>
                          <td className="px-4 py-3 text-center font-medium text-amber-600">{m.resumen.TARDANZA}</td>
                          <td className="px-4 py-3 text-center font-medium text-blue-600">{m.resumen.PERMISO}</td>
                          <td className="px-4 py-3 text-center text-gray-600">{m.resumen.total}</td>
                          <td className={`px-4 py-3 text-center ${pctColor(m.pctAsistencia)}`}>
                            {m.pctAsistencia !== null ? `${m.pctAsistencia}%` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
