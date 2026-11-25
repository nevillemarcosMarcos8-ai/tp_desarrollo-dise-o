"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useVerifyEvaluationPosition } from "@/features/evaluations/hooks";
import { clearEvaluationFlow, readEvaluationFlow, writeEvaluationFlow, type EvaluationFlowState } from "@/features/evaluations/flow";
import { appRoutes } from "@/shared/navigation/routes";
import { Button, Notice, PageHeader, Panel, SelectField, ValidationSummary } from "@/shared/ui";

export default function EvaluationPositionPage() {
  const router = useRouter();
  const [flow, setFlow] = useState<EvaluationFlowState | null>(null);
  const [ready, setReady] = useState(false);
  const [positionId, setPositionId] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const action = useVerifyEvaluationPosition();

  useEffect(() => {
    const saved = readEvaluationFlow();
    if (saved?.selectedIds.length) {
      setFlow(saved);
      setPositionId(saved.positionId ? String(saved.positionId) : "");
    } else {
      router.replace(appRoutes.newEvaluation);
    }
    setReady(true);
  }, [router]);

  async function verify() {
    if (!flow) return;
    if (!positionId) {
      setValidationErrors(["Se debe seleccionar una función o puesto."]);
      return;
    }
    setValidationErrors([]);
    action.clear();
    const competencies = await action.execute({ idPuesto: Number(positionId) });
    if (!competencies) return;
    const updated = { ...flow, positionId: Number(positionId), competencies, confirmed: null };
    writeEvaluationFlow(updated);
    router.push(appRoutes.evaluationCompetencies);
  }

  function finishOnNonEvaluableCompetencies() {
    clearEvaluationFlow();
    router.push("/consultor");
  }

  if (!ready || !flow) return null;
  const errorMessage = action.error instanceof Error ? action.error.message : null;

  return <>
    <PageHeader eyebrow="CU025 · Paso 3 de 5" title="Evaluación de candidatos" description="Seleccioná la función o puesto en la cual deseás evaluar a los candidatos seleccionados." />
    <Panel title="Función o puesto a evaluar">
      {flow.positions.length ? <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <SelectField label="Función o puesto" value={positionId} onChange={(event) => { setPositionId(event.target.value); setValidationErrors([]); action.clear(); }}>
          <option value="">Seleccionar función o puesto…</option>
          {flow.positions.map((item) => <option key={item.idPuesto} value={item.idPuesto}>{item.nombrePuesto}{item.nombreEmpresa ? ` · ${item.nombreEmpresa}` : ""}</option>)}
        </SelectField>
        <Button type="button" disabled={action.isPending} onClick={verify}>{action.isPending ? "Verificando…" : "Siguiente"}</Button>
      </div> : <Notice tone="warning">La selección se validó, pero no hay puestos activos disponibles para evaluarla.</Notice>}
      <ValidationSummary errors={validationErrors} />
      {errorMessage && <Notice tone="error" title="Competencias no evaluables">
        <p>{errorMessage}</p>
        <div className="mt-3">
          <Button type="button" variant="secondary" onClick={finishOnNonEvaluableCompetencies}>Aceptar</Button>
        </div>
      </Notice>}
      <div className="mt-5 flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={() => router.push(appRoutes.evaluationCandidates)}>Volver a candidatos</Button>
        <Button type="button" variant="secondary" onClick={finishOnNonEvaluableCompetencies}>Cancelar</Button>
      </div>
    </Panel>
  </>;
}
