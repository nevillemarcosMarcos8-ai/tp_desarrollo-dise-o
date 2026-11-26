"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMeritOrderEvaluations } from "@/features/reports/hooks";
import type { MeritEvaluation } from "@/features/reports/types";
import { Button, ErrorMessage, LoadingState, Notice, PageHeader, Panel, ValidationSummary } from "@/shared/ui";

export default function MeritEvaluationSelectionPage() {
  const params = useParams<{ idPuesto: string }>();
  const router = useRouter();
  const positionId = Number(params.idPuesto);
  const [evaluations, setEvaluations] = useState<MeritEvaluation[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [all, setAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const action = useMeritOrderEvaluations();

  useEffect(() => {
    let mounted = true;
    action.execute(positionId).then((rows) => {
      if (mounted && rows) setEvaluations(rows);
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [positionId, action.execute]);

  function continueToReport() {
    if (!all && selectedIds.length === 0) {
      setValidationErrors(["Seleccioná una o más evaluaciones, o elegí TODAS."]);
      return;
    }
    const query = new URLSearchParams();
    if (all) query.set("todas", "true");
    else selectedIds.forEach((id) => query.append("idsCuestionario", String(id)));
    router.push(`/reportes/puestos/${positionId}/orden-merito?${query.toString()}`);
  }

  return <>
    <PageHeader eyebrow="CU028 · Paso 2 de 2" title="Elegir evaluaciones" description={`Seleccioná las evaluaciones del puesto ID ${positionId} que querés incluir en el orden de mérito.`} />
    <Panel title="Evaluaciones del puesto">
      {loading ? <LoadingState label="Cargando evaluaciones…" /> : evaluations.length === 0 ? <Notice>No hay evaluaciones asociadas a este puesto.</Notice> : <>
        <label className="mb-4 flex items-center gap-3 rounded-lg border border-[var(--color-border)] p-3 text-sm font-semibold">
          <input type="checkbox" checked={all} onChange={(event) => { setAll(event.target.checked); setValidationErrors([]); }} />
          Incluir TODAS las evaluaciones
        </label>
        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
          <table className="min-w-full divide-y divide-[var(--color-border)] text-left text-sm">
            <thead className="bg-slate-50"><tr>{["Elegir", "Candidato", "Documento", "Estado", "Creada"].map((label) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {evaluations.map((evaluation) => <tr key={evaluation.idCuestionario}>
                <td className="px-4 py-3"><input type="checkbox" disabled={all} checked={selectedIds.includes(evaluation.idCuestionario)} aria-label={`Incluir cuestionario ${evaluation.idCuestionario}`} onChange={() => { setSelectedIds((current) => current.includes(evaluation.idCuestionario) ? current.filter((id) => id !== evaluation.idCuestionario) : [...current, evaluation.idCuestionario]); setValidationErrors([]); }} /></td>
                <td className="px-4 py-3">{[evaluation.apellido, evaluation.nombre].filter(Boolean).join(", ") || `Candidato ID ${evaluation.idCandidato ?? "—"}`}</td>
                <td className="px-4 py-3">{[evaluation.tipoDocumento, evaluation.numeroDocumento].filter(Boolean).join(" ") || "—"}</td>
                <td className="px-4 py-3">{evaluation.estado ?? "—"}</td>
                <td className="px-4 py-3">{evaluation.fechaCreacion ? new Date(evaluation.fechaCreacion).toLocaleString("es-AR") : "—"}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </>}
      <ValidationSummary errors={validationErrors} />
      <ErrorMessage error={action.error} />
      <div className="mt-5 flex flex-wrap gap-3">
        <Button disabled={loading || action.isPending || evaluations.length === 0} onClick={continueToReport}>Generar orden de mérito</Button>
        <Button variant="secondary" onClick={() => router.push("/reportes/puestos")}>Volver a puestos</Button>
      </div>
    </Panel>
  </>;
}
