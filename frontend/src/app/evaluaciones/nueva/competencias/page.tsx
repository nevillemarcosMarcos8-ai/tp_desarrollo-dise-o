"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConfirmEvaluation } from "@/features/evaluations/hooks";
import { clearEvaluationFlow, readEvaluationFlow, writeEvaluationFlow, type EvaluationFlowState } from "@/features/evaluations/flow";
import { appRoutes } from "@/shared/navigation/routes";
import { Button, DataTable, ErrorMessage, Notice, PageHeader, Panel } from "@/shared/ui";

export default function EvaluationCompetenciesPage() {
  const router = useRouter();
  const [flow, setFlow] = useState<EvaluationFlowState | null>(null);
  const [ready, setReady] = useState(false);
  const action = useConfirmEvaluation();

  useEffect(() => {
    const saved = readEvaluationFlow();
    if (saved?.selectedIds.length && saved.positionId && saved.competencies) setFlow(saved);
    else router.replace(appRoutes.newEvaluation);
    setReady(true);
  }, [router]);

  async function confirm() {
    if (!flow?.positionId || !flow.selectedIds.length) return;
    const confirmed = await action.execute({ idsCandidatos: flow.selectedIds, idPuesto: flow.positionId });
    if (!confirmed) return;
    writeEvaluationFlow({ ...flow, confirmed });
    router.push(appRoutes.evaluationResult);
  }

  function cancel() {
    clearEvaluationFlow();
    router.push("/consultor");
  }

  if (!ready || !flow) return null;
  const selectedPosition = flow.positions.find((item) => item.idPuesto === flow.positionId);
  const previewCandidates = flow.selectedCandidates ?? [];

  return <>
    <PageHeader eyebrow="CU025 · Paso 4 de 5" title="Revisar y finalizar evaluación" description="Verificá las competencias requeridas para la función y confirmá la generación de cuestionarios y claves." />
    <div className="space-y-5">
      <Panel title="Función seleccionada">
        <p><strong>Función o puesto:</strong> {selectedPosition?.nombrePuesto ?? flow.positionId}</p>
        <p className="mt-1"><strong>Empresa:</strong> {selectedPosition?.nombreEmpresa ?? "—"}</p>
        <p className="mt-1"><strong>Candidatos a evaluar:</strong> {flow.selectedIds.length}</p>
      </Panel>
      <Panel title="Competencias asociadas a la función">
        {flow.competencies?.length ? <DataTable rows={flow.competencies} rowKey={(row) => row.nombreCompetencia} columns={[
          { key: "competencia", header: "Competencia", render: (row) => row.nombreCompetencia },
          { key: "ponderacion", header: "Ponderación requerida", render: (row) => row.ponderacion },
        ]} /> : <Notice tone="warning">El puesto no tiene competencias devueltas por el backend; no es posible confirmar.</Notice>}
      </Panel>
      {previewCandidates.length > 0 && <Panel title="Candidatos seleccionados">
        <DataTable rows={previewCandidates} rowKey={(row) => row.id} columns={[
          { key: "numero", header: "N.º candidato", render: (row) => row.numeroCandidato },
          { key: "apellido", header: "Apellido", render: (row) => row.apellido },
          { key: "nombre", header: "Nombre", render: (row) => row.nombre },
        ]} />
      </Panel>}
      <Panel title="Confirmación">
        <ErrorMessage error={action.error} />
        <div className="flex flex-wrap gap-3">
          <Button type="button" disabled={!flow.competencies?.length || action.isPending} onClick={confirm}>{action.isPending ? "Generando cuestionarios…" : "Finalizar"}</Button>
          <Button type="button" variant="secondary" onClick={() => router.push(appRoutes.evaluationPosition)}>Volver a elegir puesto</Button>
          <Button type="button" variant="secondary" onClick={cancel}>Cancelar</Button>
        </div>
      </Panel>
    </div>
  </>;
}
