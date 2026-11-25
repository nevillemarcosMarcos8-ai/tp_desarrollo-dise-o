"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMeritOrder, usePositionEvaluations } from "@/features/reports/hooks";
import type { MeritCandidate, MeritGroup, PositionEvaluation } from "@/features/reports/types";
import { Button, DataTable, ErrorMessage, LoadingState, Notice, PageHeader, Panel, StatusBadge, ValidationSummary, formatDate } from "@/shared/ui";

const GROUP_LABELS: Record<string, string> = {
  COMPLETO_SI_CUMPLE_PONDERACION_MINIMA: "Orden de mérito (Completos que alcanzan ponderaciones mínimas)",
  COMPLETO_NO_CUMPLE_PONDERACION_MINIMA: "Completos que no alcanzaron ponderaciones mínimas",
  ACTIVO: "Cuestionarios en estado Activo",
  EN_PROCESO: "Cuestionarios en estado En Proceso",
  INCOMPLETO: "Cuestionarios en estado Incompleto",
  SIN_CONTESTAR: "Cuestionarios en estado Sin Contestar",
};

function isCompleteGroup(estado: string) {
  return estado.startsWith("COMPLETO");
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return formatDate(value);
  return parsed.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

export default function MeritOrderPage() {
  const params = useParams<{ idPuesto: string }>();
  const router = useRouter();
  const id = Number(params.idPuesto);
  const [evaluations, setEvaluations] = useState<PositionEvaluation[]>([]);
  const [mode, setMode] = useState<"ALL" | "SELECTED">("ALL");
  const [selectedEvaluationIds, setSelectedEvaluationIds] = useState<number[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [groups, setGroups] = useState<MeritGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const evaluationsQuery = usePositionEvaluations();
  const meritOrder = useMeritOrder();

  useEffect(() => {
    let mounted = true;
    if (!Number.isInteger(id) || id <= 0) return;
    setLoading(true);
    Promise.all([
      evaluationsQuery.execute(id),
      meritOrder.execute({ positionId: id }),
    ])
      .then(([evalRows, meritRows]) => {
        if (!mounted) return;
        if (evalRows) setEvaluations(evalRows);
        if (meritRows) setGroups(meritRows);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [id, evaluationsQuery.execute, meritOrder.execute]);

  async function applyEvaluationFilter() {
    if (mode === "SELECTED" && selectedEvaluationIds.length === 0) {
      setValidationErrors(["Seleccioná al menos una evaluación o marcá la opción TODAS."]);
      return;
    }
    setValidationErrors([]);
    const rows = await meritOrder.execute({
      positionId: id,
      evaluationIds: mode === "ALL" ? undefined : selectedEvaluationIds,
    });
    if (rows) setGroups(rows);
  }

  const nonEmptyGroups = groups.filter((group) => group.candidatos.length > 0);

  return <>
    <div className="print:hidden">
      <PageHeader
        eyebrow="CU028 · Reportes"
        title="Orden de mérito"
        description={`Puesto ID ${id}. Seleccioná las evaluaciones a incluir o la opción TODAS.`}
        actions={<div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => router.push("/reportes/puestos")}>Volver a puestos</Button>
          <Button type="button" onClick={() => window.print()}>Imprimir</Button>
        </div>}
      />

      {evaluations.length > 0 && <Panel className="mb-6" title="Evaluaciones del puesto" description="Seleccioná para qué evaluación/es deseás emitir el orden de mérito o elegí TODAS.">
        <div className="space-y-3 text-sm">
          <label className="flex cursor-pointer items-center gap-2 font-semibold">
            <input type="radio" name="evalMode" checked={mode === "ALL"} onChange={() => { setMode("ALL"); setValidationErrors([]); }} />
            <span>TODAS ({evaluations.length} evaluaciones)</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 font-semibold">
            <input type="radio" name="evalMode" checked={mode === "SELECTED"} onChange={() => { setMode("SELECTED"); setValidationErrors([]); }} />
            <span>Seleccionar evaluación/es específica/s</span>
          </label>
          {mode === "SELECTED" && <div className="ml-6 grid gap-2 sm:grid-cols-2">
            {evaluations.map((evaluation) => <label key={evaluation.idEvaluacion} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-2.5 hover:bg-slate-50">
              <input
                type="checkbox"
                checked={selectedEvaluationIds.includes(evaluation.idEvaluacion)}
                onChange={() => {
                  setValidationErrors([]);
                  setSelectedEvaluationIds((current) =>
                    current.includes(evaluation.idEvaluacion)
                      ? current.filter((item) => item !== evaluation.idEvaluacion)
                      : [...current, evaluation.idEvaluacion],
                  );
                }}
              />
              <span>Evaluación #{evaluation.idEvaluacion} · {formatDateTime(evaluation.fechaCreacion)} ({evaluation.cantidadCandidatos} cand. / {evaluation.cantidadCompletos} compl.)</span>
            </label>)}
          </div>}
        </div>
        <ValidationSummary errors={validationErrors} />
        <div className="mt-4">
          <Button type="button" disabled={meritOrder.isPending} onClick={() => void applyEvaluationFilter()}>
            {meritOrder.isPending ? "Emitiendo…" : "Emitir listado"}
          </Button>
        </div>
      </Panel>}
    </div>

    {loading ? <LoadingState /> : nonEmptyGroups.length === 0 && !meritOrder.error ? <Panel>
      <Notice tone="error" title="Sin evaluaciones">El puesto no posee evaluaciones asociadas.</Notice>
    </Panel> : <div className="space-y-5">
      {nonEmptyGroups.map((group) => <MeritGroupPanel key={group.estado} group={group} />)}
    </div>}
    <ErrorMessage error={evaluationsQuery.error ?? meritOrder.error} />
  </>;
}

function MeritGroupPanel({ group }: { group: MeritGroup }) {
  const complete = isCompleteGroup(group.estado);
  const isMerit = group.estado === "COMPLETO_SI_CUMPLE_PONDERACION_MINIMA";
  const columns = [
    ...(isMerit ? [{ key: "rank", header: "Orden", render: (row: MeritCandidate) => row.ordenMerito ?? "—" }] : []),
    { key: "docType", header: "Tipo documento", render: (row: MeritCandidate) => row.tipoDocumento ?? "—" },
    { key: "docNumber", header: "Número documento", render: (row: MeritCandidate) => row.numeroDocumento ?? "—" },
    { key: "lastName", header: "Apellido", render: (row: MeritCandidate) => row.apellido ?? "—" },
    { key: "firstName", header: "Nombre", render: (row: MeritCandidate) => row.nombre ?? "—" },
    ...(complete ? [{
      key: "score",
      header: "Puntaje obtenido",
      render: (row: MeritCandidate) => row.puntajeObtenido != null ? row.puntajeObtenido.toFixed(2).replace(".", ",") : "—",
    }] : []),
    {
      key: "extra",
      header: "Datos adicionales",
      render: (row: MeritCandidate) => complete
        ? `Inicio: ${formatDateTime(row.fechaInicio)} · Fin: ${formatDateTime(row.fechaFin)} · Accesos: ${row.cantidadAccesos ?? 0}`
        : `Inicio: ${formatDateTime(row.fechaInicio)} · Último ingreso: ${formatDateTime(row.ultimoIngreso)} · Accesos: ${row.cantidadAccesos ?? 0}`,
    },
  ];

  return <Panel title={<><StatusBadge tone={isMerit ? "success" : complete ? "warning" : "neutral"}>{GROUP_LABELS[group.estado] ?? group.estado}</StatusBadge><span className="ml-3 text-sm font-normal text-slate-600">{group.candidatos.length} candidato(s)</span></>}>
    <DataTable<MeritCandidate> rows={group.candidatos} rowKey={(row) => row.idCuestionario} columns={columns} />
  </Panel>;
}
