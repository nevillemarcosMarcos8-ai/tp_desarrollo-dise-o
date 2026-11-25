"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useComparativeReport } from "@/features/reports/hooks";
import type { ComparativeReport } from "@/features/reports/types";
import { CompetencyRadarChart } from "@/features/reports/components/competency-radar-chart";
import { Button, ErrorMessage, Notice, PageHeader, Panel } from "@/shared/ui";

function formatScore(value: number) {
  return value.toFixed(2).replace(".", ",");
}

export default function ComparativeReportResultPage() {
  const params = useParams<{ idPuesto: string; idCuestionario: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const idPuesto = Number(params.idPuesto);
  const idCuestionario = Number(params.idCuestionario);
  const reportQuery = useComparativeReport();
  const [report, setReport] = useState<ComparativeReport | null>(null);
  const query = searchParams.toString();
  const querySuffix = query ? `?${query}` : "";

  useEffect(() => {
    let mounted = true;
    if (!Number.isInteger(idPuesto) || idPuesto <= 0 || !Number.isInteger(idCuestionario) || idCuestionario <= 0) return;
    setReport(null);
    reportQuery.execute({ positionId: idPuesto, questionnaireId: idCuestionario })
      .then((result) => { if (mounted && result) setReport(result); });
    return () => { mounted = false; };
  }, [idPuesto, idCuestionario, reportQuery.execute]);

  const totalRequerido = report?.competencias.reduce((total, row) => total + row.valorRequerido, 0) ?? 0;
  const totalObtenido = report?.competencias.reduce((total, row) => total + row.valorObtenido, 0) ?? 0;
  const diferenciaTotal = totalObtenido - totalRequerido;

  function returnToCandidates() {
    router.push(`/reportes/comparativo/puestos/${idPuesto}/candidatos${querySuffix}`);
  }

  if (reportQuery.isPending || (!report && !reportQuery.error)) {
    return <>
      <PageHeader eyebrow="CU027 · Reporte comparativo" title="Cargando reporte" />
      <Notice>{reportQuery.isPending ? "Consultando los datos de la evaluación…" : "Preparando el reporte…"}</Notice>
      <Button variant="secondary" onClick={returnToCandidates}>Volver a candidatos</Button>
    </>;
  }

  if (!report) return <>
    <PageHeader eyebrow="CU027 · Reporte comparativo" title="No se pudo cargar el reporte" />
    <ErrorMessage error={reportQuery.error} />
    <Button variant="secondary" onClick={returnToCandidates}>Volver a candidatos</Button>
  </>;

  return <>
    <div className="print:hidden">
      <PageHeader eyebrow="CU027 · Paso 3 de 3" title="Reporte comparativo" description="Comparación entre los valores requeridos para el puesto y los obtenidos por el candidato." actions={<div className="flex gap-2"><Button variant="secondary" onClick={returnToCandidates}>Cancelar</Button><Button onClick={() => window.print()}>Imprimir</Button></div>} />
    </div>

    <Panel className="mb-6 rounded-2xl border-slate-100 shadow-sm">
      <dl className="grid gap-x-8 sm:grid-cols-2">
        <div className="flex flex-wrap gap-x-3 border-b border-slate-100 py-4"><dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Puesto:</dt><dd className="text-sm font-bold uppercase text-slate-900">{report.nombrePuesto}</dd></div>
        <div className="flex flex-wrap gap-x-3 border-b border-slate-100 py-4"><dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Empresa:</dt><dd className="text-sm font-bold uppercase text-slate-900">{report.empresa ?? "—"}</dd></div>
        <div className="flex flex-wrap gap-x-3 py-4"><dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Candidato:</dt><dd className="text-sm font-bold uppercase text-slate-900">{report.candidato.apellido}, {report.candidato.nombre}</dd></div>
        <div className="flex flex-wrap gap-x-3 py-4"><dt className="text-xs font-bold uppercase tracking-wide text-slate-400">{report.candidato.tipoDocumento}:</dt><dd className="text-sm font-bold text-slate-900">{report.candidato.numeroDocumento}</dd></div>
      </dl>
      <div className="grid gap-x-8 border-t border-slate-100 pt-3 text-xs text-slate-500 sm:grid-cols-2"><p>Candidato N.º: <strong className="text-slate-700">{report.candidato.numeroCandidato}</strong></p><p>Finalización: <strong className="text-slate-700">{report.candidato.fechaFinalizacion.slice(0, 10).split("-").reverse().join("/")}</strong></p></div>
      <ErrorMessage error={reportQuery.error} />
    </Panel>

    <div className="grid items-stretch gap-6 lg:grid-cols-2">
      <Panel className="rounded-2xl border-slate-100 shadow-sm" title={<span className="text-center text-xs font-bold uppercase tracking-[.12em] text-slate-500">Visualización de perfil de competencias</span>}>
        <CompetencyRadarChart rows={report.competencias} />
      </Panel>

      <Panel className="rounded-2xl border-slate-100 shadow-sm" title={<span className="text-center text-xs font-bold uppercase tracking-[.12em] text-slate-500">Detalle numérico por competencia</span>}>
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-400"><tr>
              <th className="px-3 py-3">Competencia</th><th className="px-3 py-3 text-right">Req.</th><th className="px-3 py-3 text-right">Obt.</th><th className="px-3 py-3 text-right">Dif.</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">{report.competencias.map((row) => {
              const difference = row.valorObtenido - row.valorRequerido;
              const differenceTone = difference > 0 ? "text-green-700" : difference < 0 ? "text-red-600" : "text-indigo-600";
              return <tr key={row.idCompetencia}>
                <th scope="row" className="px-3 py-3 text-[10px] font-bold uppercase leading-4 text-slate-600">{row.nombreCompetencia}</th>
                <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-slate-600">{formatScore(row.valorRequerido)}</td>
                <td className="whitespace-nowrap px-3 py-3 text-right font-bold tabular-nums text-slate-800">{formatScore(row.valorObtenido)}</td>
                <td className={`whitespace-nowrap px-3 py-3 text-right font-bold tabular-nums ${differenceTone}`}>{difference > 0 ? "+" : ""}{formatScore(difference)}</td>
              </tr>;
            })}</tbody>
            <tfoot className="bg-indigo-50/70"><tr>
              <th scope="row" className="px-3 py-3 text-[10px] font-bold uppercase text-indigo-600">Totales</th>
              <td className="whitespace-nowrap px-3 py-3 text-right font-bold tabular-nums text-slate-700">{formatScore(totalRequerido)}</td>
              <td className="whitespace-nowrap px-3 py-3 text-right font-bold tabular-nums text-slate-800">{formatScore(totalObtenido)}</td>
              <td className={`whitespace-nowrap px-3 py-3 text-right font-bold tabular-nums ${diferenciaTotal > 0 ? "text-green-700" : diferenciaTotal < 0 ? "text-red-600" : "text-indigo-600"}`}>{diferenciaTotal > 0 ? "+" : ""}{formatScore(diferenciaTotal)}</td>
            </tr></tfoot>
          </table>
        </div>
      </Panel>
    </div>
  </>;
}
