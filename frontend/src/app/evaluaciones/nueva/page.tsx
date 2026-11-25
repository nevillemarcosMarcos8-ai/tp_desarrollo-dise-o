"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSearchCandidatesForEvaluation } from "@/features/evaluations/hooks";
import { clearEvaluationFlow, readEvaluationFlow, writeEvaluationFlow } from "@/features/evaluations/flow";
import type { SearchEvaluationCandidatesRequest } from "@/features/evaluations/types";
import { appRoutes } from "@/shared/navigation/routes";
import { Button, ErrorMessage, Field, LoadingState, PageHeader, Panel, ValidationSummary } from "@/shared/ui";

function NewEvaluationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const keepSelection = searchParams.get("acumular") === "1";
  const [criteria, setCriteria] = useState<SearchEvaluationCandidatesRequest>({ apellido: "", nombre: "", numeroCandidato: "" });
  const [validation, setValidation] = useState<string[]>([]);
  const searchAction = useSearchCandidatesForEvaluation();

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!Object.values(criteria).some((value) => value?.trim())) {
      setValidation(["Completá al menos un criterio de búsqueda."]);
      return;
    }
    setValidation([]);
    const previous = keepSelection ? readEvaluationFlow() : null;
    if (!keepSelection) clearEvaluationFlow();
    const candidates = await searchAction.execute(criteria);
    if (candidates) {
      const selectedCandidates = previous?.selectedCandidates ?? [];
      const selectedIds = selectedCandidates.map((item) => item.id);
      writeEvaluationFlow({
        criteria,
        candidates,
        selectedCandidates,
        selectedIds,
        positions: [],
        positionId: null,
        competencies: null,
        confirmed: null,
      });
      router.push(appRoutes.evaluationCandidates);
    }
  }

  function cancel() {
    clearEvaluationFlow();
    router.push("/consultor");
  }

  return <>
    <PageHeader eyebrow="CU025 · Paso 1 de 5" title="Buscar candidatos para evaluar" description="Ingresá al menos un criterio. Nombre y apellido admiten coincidencias parciales." />
    <Panel title="Criterios de búsqueda">
      <form onSubmit={search} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Número de candidato" uppercase value={criteria.numeroCandidato ?? ""} onChange={(event) => setCriteria({ ...criteria, numeroCandidato: event.target.value })} />
          <Field label="Apellido" uppercase value={criteria.apellido ?? ""} onChange={(event) => setCriteria({ ...criteria, apellido: event.target.value })} />
          <Field label="Nombre" uppercase value={criteria.nombre ?? ""} onChange={(event) => setCriteria({ ...criteria, nombre: event.target.value })} />
        </div>
        <ValidationSummary errors={validation} />
        <ErrorMessage error={searchAction.error} />
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={searchAction.isPending}>{searchAction.isPending ? "Buscando…" : "Buscar candidatos"}</Button>
          {keepSelection && <Button type="button" variant="secondary" onClick={() => router.push(appRoutes.evaluationCandidates)}>Volver a candidatos a evaluar</Button>}
          <Button type="button" variant="secondary" onClick={cancel}>Cancelar</Button>
        </div>
      </form>
    </Panel>
  </>;
}

export default function NewEvaluationPage() {
  return (
    <Suspense fallback={<LoadingState label="Cargando búsqueda de candidatos…" />}>
      <NewEvaluationContent />
    </Suspense>
  );
}
