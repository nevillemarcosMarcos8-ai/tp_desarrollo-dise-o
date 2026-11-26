"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useValidateCandidateSelection } from "@/features/evaluations/hooks";
import { readEvaluationFlow, writeEvaluationFlow, type EvaluationFlowState } from "@/features/evaluations/flow";
import type { EvaluationCandidate } from "@/features/evaluations/types";
import { appRoutes } from "@/shared/navigation/routes";
import { Button, DataTable, ErrorMessage, PageHeader, Panel, ValidationSummary } from "@/shared/ui";

export default function EvaluationCandidatesPage() {
  const router = useRouter();
  const [flow, setFlow] = useState<EvaluationFlowState | null>(null);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [markedAvailable, setMarkedAvailable] = useState<number[]>([]);
  const [markedChosen, setMarkedChosen] = useState<number[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const action = useValidateCandidateSelection();

  useEffect(() => {
    const saved = readEvaluationFlow();
    if (saved) { setFlow(saved); setSelected(saved.selectedIds); }
    else router.replace(appRoutes.newEvaluation);
    setReady(true);
  }, [router]);

  const available = flow?.candidates.filter((candidate) => !selected.includes(candidate.id)) ?? [];
  const chosen = flow?.candidates.filter((candidate) => selected.includes(candidate.id)) ?? [];

  function addCandidates() {
    const next = [...new Set([...selected, ...markedAvailable])];
    setSelected(next);
    setMarkedAvailable([]);
    setValidationErrors([]);
    if (flow) {
      const updated = { ...flow, selectedIds: next };
      setFlow(updated);
      writeEvaluationFlow(updated);
    }
  }

  function removeCandidates() {
    const next = selected.filter((id) => !markedChosen.includes(id));
    setSelected(next);
    setMarkedChosen([]);
    setValidationErrors([]);
    if (flow) {
      const updated = { ...flow, selectedIds: next };
      setFlow(updated);
      writeEvaluationFlow(updated);
    }
  }

  async function continueToPosition() {
    if (!flow) return;
    if (selected.length === 0) {
      setValidationErrors(["Agregá al menos un candidato a la grilla de seleccionados."]);
      return;
    }
    setValidationErrors([]);
    const positions = await action.execute({ idsCandidatos: selected }, "Selección validada.");
    if (!positions) return;
    const updated = { ...flow, selectedIds: selected, positions, positionId: null, competencies: null, confirmed: null };
    writeEvaluationFlow(updated);
    router.push(appRoutes.evaluationPosition);
  }

  const columns = [
    { key: "select", header: "Elegir", render: (row: EvaluationCandidate) => <input aria-label={`Seleccionar ${row.nombre} ${row.apellido}`} type="checkbox" checked={markedAvailable.includes(row.id)} onChange={() => setMarkedAvailable((current) => current.includes(row.id) ? current.filter((id) => id !== row.id) : [...current, row.id])} /> },
    { key: "numero", header: "N.º candidato", render: (row: EvaluationCandidate) => row.numeroCandidato },
    { key: "apellido", header: "Apellido", render: (row: EvaluationCandidate) => row.apellido },
    { key: "nombre", header: "Nombre", render: (row: EvaluationCandidate) => row.nombre },
  ];

  if (!ready || !flow) return null;
  return <>
    <PageHeader eyebrow="CU025 · Paso 2 de 5" title="Seleccionar candidatos" description="Pasá los candidatos que participarán a la grilla de seleccionados." />
    <div className="grid items-start gap-4 xl:grid-cols-[1fr_auto_1fr]">
      <Panel title="Candidatos encontrados" description={`Disponibles: ${available.length}`}>
        <DataTable rows={available} rowKey={(row) => row.id} emptyTitle="No hay candidatos disponibles" emptyDescription="No quedan candidatos para agregar." columns={columns} />
      </Panel>
      <div className="flex gap-2 xl:flex-col xl:pt-12">
        <Button type="button" variant="secondary" disabled={markedAvailable.length === 0} onClick={addCandidates}>Agregar →</Button>
        <Button type="button" variant="secondary" disabled={markedChosen.length === 0} onClick={removeCandidates}>← Quitar</Button>
      </div>
      <Panel title="Candidatos seleccionados" description={`Seleccionados: ${chosen.length}`}>
        <DataTable rows={chosen} rowKey={(row) => row.id} emptyTitle="Todavía no seleccionaste candidatos" emptyDescription="Marcá candidatos en la grilla izquierda y presioná Agregar." columns={[
          { key: "select", header: "Elegir", render: (row) => <input aria-label={`Quitar ${row.nombre} ${row.apellido}`} type="checkbox" checked={markedChosen.includes(row.id)} onChange={() => setMarkedChosen((current) => current.includes(row.id) ? current.filter((id) => id !== row.id) : [...current, row.id])} /> },
          { key: "numero", header: "N.º candidato", render: (row) => row.numeroCandidato },
          { key: "apellido", header: "Apellido", render: (row) => row.apellido },
          { key: "nombre", header: "Nombre", render: (row) => row.nombre },
        ]} />
      </Panel>
    </div>
    <div className="mt-5 grid justify-items-start gap-3">
      <ValidationSummary errors={validationErrors} />
      <ErrorMessage error={action.error} />
      <div className="flex flex-wrap gap-3">
        <Button disabled={action.isPending} onClick={() => void continueToPosition()}>{action.isPending ? "Validando…" : "Validar selección y elegir puesto"}</Button>
        <Link className="inline-flex min-h-10 items-center rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-semibold" href={appRoutes.newEvaluation}>Volver a buscar</Link>
      </div>
    </div>
  </>;
}
