"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useVerifyEvaluationPosition } from "@/features/evaluations/hooks";
import { readEvaluationFlow, writeEvaluationFlow, type EvaluationFlowState } from "@/features/evaluations/flow";
import { appRoutes } from "@/shared/navigation/routes";
import { Button, ErrorMessage, Notice, PageHeader, Panel, SelectField, ValidationSummary } from "@/shared/ui";

export default function EvaluationPositionPage() {
  const router = useRouter();
  const [flow, setFlow] = useState<EvaluationFlowState | null>(null);
  const [ready, setReady] = useState(false);
  const [positionId, setPositionId] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const action = useVerifyEvaluationPosition();

  useEffect(() => {
    const saved = readEvaluationFlow();
    if (saved?.selectedIds.length) { setFlow(saved); setPositionId(saved.positionId ? String(saved.positionId) : ""); }
    else router.replace(appRoutes.newEvaluation);
    setReady(true);
  }, [router]);

  async function verify() {
    if (!flow) return;
    if (!positionId) {
      setValidationErrors(["Seleccioná un puesto antes de continuar."]);
      return;
    }
    setValidationErrors([]);
    const competencies = await action.execute({ idPuesto: Number(positionId) });
    if (!competencies) return;
    const updated = { ...flow, positionId: Number(positionId), competencies, confirmed: null };
    writeEvaluationFlow(updated);
    router.push(appRoutes.evaluationCompetencies);
  }

  if (!ready || !flow) return null;
  return <>
    <PageHeader eyebrow="CU025 · Paso 3 de 5" title="Elegir puesto" description="El backend devuelve puestos activos disponibles para los candidatos seleccionados." />
    <Panel title="Puesto a evaluar">
      {flow.positions.length ? <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <SelectField label="Puesto" value={positionId} onChange={(event) => setPositionId(event.target.value)}>
          <option value="">Seleccionar puesto…</option>
          {flow.positions.map((item) => <option key={item.idPuesto} value={item.idPuesto}>{item.nombrePuesto}{item.nombreEmpresa ? ` · ${item.nombreEmpresa}` : ""}</option>)}
        </SelectField>
        <Button disabled={action.isPending} onClick={verify}>{action.isPending ? "Verificando…" : "Verificar puesto"}</Button>
      </div> : <Notice tone="warning">La selección se validó, pero el backend no devolvió puestos disponibles para evaluarla.</Notice>}
      <ValidationSummary errors={validationErrors} />
      <ErrorMessage error={action.error} />
      <Link className="mt-5 inline-flex min-h-10 items-center rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-semibold" href={appRoutes.evaluationCandidates}>Volver a candidatos</Link>
    </Panel>
  </>;
}
