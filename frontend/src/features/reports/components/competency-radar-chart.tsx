import type { CompetencyComparison } from "@/features/reports/types";

const width = 440;
const height = 360;
const centerX = 220;
const centerY = 169;
const radius = 105;

function wrapLabel(value: string, maxLength = 17) {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxLength && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function CompetencyRadarChart({ rows }: { rows: CompetencyComparison[] }) {
  if (rows.length === 0) {
    return <p className="py-12 text-center text-sm text-slate-500">No hay competencias para graficar.</p>;
  }

  const maxValue = Math.max(5, Math.ceil(Math.max(...rows.flatMap((row) => [row.valorRequerido, row.valorObtenido])) / 5) * 5);

  if (rows.length < 3) {
    return <div className="mx-auto w-full max-w-[460px] space-y-5 py-4" role="img" aria-label="Gráfico comparativo de barras entre el nivel requerido y obtenido por competencia">
      {rows.map((row) => {
        const reqPct = Math.max(0, Math.min((row.valorRequerido / maxValue) * 100, 100));
        const obtPct = Math.max(0, Math.min((row.valorObtenido / maxValue) * 100, 100));
        return <div key={row.idCompetencia} className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-700">{row.nombreCompetencia}</p>
          <div className="space-y-1.5 text-xs">
            <div>
              <div className="mb-1 flex justify-between text-slate-600"><span>Requerido</span><strong className="tabular-nums">{row.valorRequerido.toFixed(2).replace(".", ",")}</strong></div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-900" style={{ width: `${reqPct}%` }} /></div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-slate-700"><span>Obtenido</span><strong className="tabular-nums">{row.valorObtenido.toFixed(2).replace(".", ",")}</strong></div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${obtPct}%` }} /></div>
            </div>
          </div>
        </div>;
      })}
      <div className="mt-2 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span className="inline-flex items-center gap-2"><i className="size-3 rounded bg-blue-900" />Requerido</span>
        <span className="inline-flex items-center gap-2"><i className="size-3 rounded bg-indigo-600" />Obtenido</span>
      </div>
    </div>;
  }
  const angleFor = (index: number) => (Math.PI * 2 * index) / rows.length - Math.PI / 2;
  const point = (index: number, value: number, scale = radius) => {
    const angle = angleFor(index);
    const distance = scale * Math.max(0, Math.min(value / maxValue, 1));
    return { x: centerX + Math.cos(angle) * distance, y: centerY + Math.sin(angle) * distance };
  };
  const polygonPoints = (values: number[]) => rows.map((_, index) => {
    const current = point(index, values[index]);
    return `${current.x.toFixed(1)},${current.y.toFixed(1)}`;
  }).join(" ");
  const gridPoints = (level: number) => rows.map((_, index) => {
    const current = point(index, maxValue, radius * level / 5);
    return `${current.x.toFixed(1)},${current.y.toFixed(1)}`;
  }).join(" ");

  return <div className="mx-auto w-full max-w-[460px]">
    <svg viewBox={`0 0 ${width} ${height}`} className="block w-full" role="img" aria-label="Gráfico de radar que compara el nivel requerido y obtenido por competencia">
      {[1, 2, 3, 4, 5].map((level) => <polygon key={`grid-${level}`} points={gridPoints(level)} fill="none" stroke="#dbe3ef" strokeWidth="1" />)}
      {rows.map((row, index) => {
        const end = point(index, maxValue);
        return <line key={`axis-${row.idCompetencia}`} x1={centerX} y1={centerY} x2={end.x} y2={end.y} stroke="#e2e8f0" strokeWidth="1" />;
      })}
      <polygon points={polygonPoints(rows.map((row) => row.valorRequerido))} fill="#1e3a8a" fillOpacity="0.14" stroke="#1e3a8a" strokeWidth="2.4" strokeLinejoin="round" />
      <polygon points={polygonPoints(rows.map((row) => row.valorObtenido))} fill="#635bdb" fillOpacity="0.20" stroke="#635bdb" strokeWidth="2.8" strokeLinejoin="round" />
      {rows.map((row, index) => {
        const labelPoint = point(index, maxValue, radius + 31);
        const lines = wrapLabel(row.nombreCompetencia);
        const anchor = labelPoint.x < centerX - 14 ? "end" : labelPoint.x > centerX + 14 ? "start" : "middle";
        const startY = labelPoint.y - ((lines.length - 1) * 5);
        return <text key={`label-${row.idCompetencia}`} x={labelPoint.x} y={startY} textAnchor={anchor} dominantBaseline="middle" fill="#53627a" fontSize="9" fontWeight="700" letterSpacing="0.15">
          <title>{row.nombreCompetencia}</title>
          {lines.map((line, lineIndex) => <tspan key={`${row.idCompetencia}-${lineIndex}`} x={labelPoint.x} dy={lineIndex === 0 ? 0 : 11}>{line.toLocaleUpperCase("es-AR")}</tspan>)}
        </text>;
      })}
    </svg>
    <div className="mt-1 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
      <span className="inline-flex items-center gap-2"><i className="size-3 rounded bg-blue-900" />Requerido</span>
      <span className="inline-flex items-center gap-2"><i className="size-3 rounded bg-indigo-600" />Obtenido</span>
    </div>
  </div>;
}
