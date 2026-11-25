"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useValidateCandidateSelection } from "@/features/evaluations/hooks";
import { clearEvaluationFlow, readEvaluationFlow, writeEvaluationFlow, type EvaluationFlowState } from "@/features/evaluations/flow";
import type { EvaluationCandidate } from "@/features/evaluations/types";
import { appRoutes } from "@/shared/navigation/routes";
import { Button, DataTable, ErrorMessage, PageHeader, Panel, ValidationSummary } from "@/shared/ui";

export default function EvaluationCandidatesPage() {
  const router = useRouter();
  const [flow, setFlow] = useState<EvaluationFlowState | null>(null);
  const [ready, setReady] = useState(false);
  const [checkedToAdd, setCheckedToAdd] = useState<number[]>([]);
  const [checkedToRemove, setCheckedToRemove] = useState<number[]>([]);
  const [addedCandidates, setAddedCandidates] = useState<EvaluationCandidate[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const action = useValidateCandidateSelection();

  useEffect(() => {
    const saved = readEvaluationFlow();
    if (saved) {
      setFlow(saved);
      const initialAdded = saved.selectedCandidates
        ?? saved.candidates.filter((candidate) => saved.selectedIds.includes(candidate.id));
      setAddedCandidates(initialAdded);
    } else {
      router.replace(appRoutes.newEvaluation);
    }
    setReady(true);
  }, [router]);

  function persistSelection(nextAdded: EvaluationCandidate[]) {
    setAddedCandidates(nextAdded);
    if (!flow) return;
    const updated: EvaluationFlowState = {
      ...flow,
      selectedCandidates: nextAdded,
      selectedIds: nextAdded.map((item) => item.id),
    };
    setFlow(updated);
    writeEvaluationFlow(updated);
  }

  function addSelectedCandidates() {
    action.clear();
    if (checkedToAdd.length === 0) {
      setValidationErrors(["Se debe seleccionar uno o más candidatos para agregar."]);
      return;
    }
    setValidationErrors([]);
    const existingIds = new Set(addedCandidates.map((item) => item.id));
    const toAdd = (flow?.candidates ?? []).filter(
      (candidate) => checkedToAdd.includes(candidate.id) && !existingIds.has(candidate.id),
    );
    persistSelection([...addedCandidates, ...toAdd]);
    setCheckedToAdd([]);
  }

  function removeSelectedCandidates() {
    action.clear();
    if (checkedToRemove.length === 0) {
      setValidationErrors(["Se debe seleccionar uno o más candidatos de 'Candidatos a evaluar' para quitar."]);
      return;
    }
    setValidationErrors([]);
    const nextAdded = addedCandidates.filter((item) => !checkedToRemove.includes(item.id));
    persistSelection(nextAdded);
    setCheckedToRemove([]);
  }

  async function continueToPosition() {
    if (!flow) return;
    if (addedCandidates.length === 0) {
      setValidationErrors(["Se debe seleccionar y agregar uno o más candidatos antes de continuar."]);
      return;
    }
    setValidationErrors([]);
    const ids = addedCandidates.map((item) => item.id);
    const positions = await action.execute({ idsCandidatos: ids });
    if (!positions) return;
    const updated: EvaluationFlowState = {
      ...flow,
      selectedCandidates: addedCandidates,
      selectedIds: ids,
      positions,
      positionId: null,
      competencies: null,
      confirmed: null,
    };
    writeEvaluationFlow(updated);
    router.push(appRoutes.evaluationPosition);
  }

  function cancel() {
    clearEvaluationFlow();
    router.push("/consultor");
  }

  if (!ready || !flow) return null;
  return <>
    <PageHeader eyebrow="CU025 · Paso 2 de 5" title="Seleccionar candidatos" description="Seleccioná candidatos de los resultados y agregalos a la grilla 'Candidatos a evaluar'." />
    <div className="space-y-6">
      <Panel title="Resultados de la búsqueda" description={`Candidatos encontrados: ${flow.candidates.length}`}>
        <DataTable rows={flow.candidates} rowKey={(row) => row.id} emptyTitle="No se encontraron candidatos" emptyDescription="Volvé a la búsqueda y probá con otros criterios." columns={[
          { key: "select", header: "Seleccionar", render: (row) => <input aria-label={`Seleccionar ${row.nombre} ${row.apellido}`} type="checkbox" checked={checkedToAdd.includes(row.id)} onChange={() => { setValidationErrors([]); setCheckedToAdd((current) => current.includes(row.id) ? current.filter((id) => id !== row.id) : [...current, row.id]); }} /> },
          { key: "numero", header: "N.º candidato", render: (row) => row.numeroCandidato },
          { key: "apellido", header: "Apellido", render: (row) => row.apellido },
          { key: "nombre", header: "Nombre", render: (row) => row.nombre },
        ]} />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" onClick={addSelectedCandidates}>Agregar</Button>
          <Button type="button" variant="secondary" onClick={() => router.push(`${appRoutes.newEvaluation}?acumular=1`)}>Nueva búsqueda</Button>
        </div>
      </Panel>

      <Panel title="Candidatos a evaluar" description={`Seleccionados para evaluar: ${addedCandidates.length}`}>
        <DataTable rows={addedCandidates} rowKey={(row) => row.id} emptyTitle="Sin candidatos agregados" emptyDescription="Marcá candidatos en los resultados de búsqueda y presioná 'Agregar'." columns={[
          { key: "selectRemove", header: "Seleccionar", render: (row) => <input aria-label={`Quitar ${row.nombre} ${row.apellido}`} type="checkbox" checked={checkedToRemove.includes(row.id)} onChange={() => { setValidationErrors([]); setCheckedToRemove((current) => current.includes(row.id) ? current.filter((id) => id !== row.id) : [...current, row.id]); }} /> },
          { key: "numero", header: "N.º candidato", render: (row) => row.numeroCandidato },
          { key: "apellido", header: "Apellido", render: (row) => row.apellido },
          { key: "nombre", header: "Nombre", render: (row) => row.nombre },
        ]} />
        <ValidationSummary errors={validationErrors} />
        <ErrorMessage error={action.error} />
        <div className="mt-5 flex flex-wrap gap-3">
          <Button type="button" variant="secondary" onClick={removeSelectedCandidates}>Quitar</Button>
          <Button type="button" disabled={action.isPending} onClick={continueToPosition}>{action.isPending ? "Validando…" : "Siguiente"}</Button>
          <Button type="button" variant="secondary" onClick={cancel}>Cancelar</Button>
        </div>
      </Panel>
    </div>
  </>;
}
