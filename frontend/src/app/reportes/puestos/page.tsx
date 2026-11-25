"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { usePositionEvaluations, useSearchPositionSummaries } from "@/features/reports/hooks";
import type { PositionReportSearch, PositionReportSummary } from "@/features/reports/types";
import { Button, DataTable, ErrorMessage, Field, Notice, PageHeader, Panel } from "@/shared/ui";

export default function PositionReportsPage() {
  const router = useRouter();
  const [criteria, setCriteria] = useState<PositionReportSearch>({ codigo: "", nombre: "", empresa: "" });
  const [rows, setRows] = useState<PositionReportSummary[] | null>(null);
  const [noEvaluationsMessage, setNoEvaluationsMessage] = useState("");
  const searchAction = useSearchPositionSummaries();
  const checkEvaluations = usePositionEvaluations();

  async function search(event: FormEvent) {
    event.preventDefault();
    setNoEvaluationsMessage("");
    checkEvaluations.clear();
    const result = await searchAction.execute(criteria);
    if (result) setRows(result);
  }

  async function openMeritOrder(row: PositionReportSummary) {
    setNoEvaluationsMessage("");
    if (row.candidatos.length === 0) {
      setNoEvaluationsMessage(`El puesto "${row.nombrePuesto}" no posee evaluaciones asociadas.`);
      return;
    }
    const evaluations = await checkEvaluations.execute(row.idPuesto);
    if (!evaluations || evaluations.length === 0) {
      setNoEvaluationsMessage(`El puesto "${row.nombrePuesto}" no posee evaluaciones disponibles.`);
      return;
    }
    router.push(`/reportes/puestos/${row.idPuesto}/orden-merito`);
  }

  return <>
    <PageHeader eyebrow="CU028 · Reportes" title="Emitir orden de mérito" description="Buscá un puesto para emitir el orden de mérito alcanzado por los candidatos." />
    <Panel title="Criterios de búsqueda">
      <form onSubmit={search} className="grid gap-4 sm:grid-cols-3">
        <Field label="Código" uppercase value={criteria.codigo ?? ""} onChange={(event) => setCriteria({ ...criteria, codigo: event.target.value })} />
        <Field label="Nombre del puesto" uppercase value={criteria.nombre ?? ""} onChange={(event) => setCriteria({ ...criteria, nombre: event.target.value })} />
        <Field label="Empresa" uppercase value={criteria.empresa ?? ""} onChange={(event) => setCriteria({ ...criteria, empresa: event.target.value })} />
        <div className="flex flex-wrap gap-3 sm:col-span-3">
          <Button type="submit" disabled={searchAction.isPending}>{searchAction.isPending ? "Buscando…" : "Buscar"}</Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/consultor")}>Cancelar</Button>
        </div>
      </form>
      <ErrorMessage error={searchAction.error} />
      {searchAction.success && <Notice tone="success">{searchAction.success}</Notice>}
    </Panel>
    {rows && <Panel className="mt-6" title="Puestos encontrados">
      {noEvaluationsMessage && <Notice tone="error" title="Sin evaluaciones">{noEvaluationsMessage}</Notice>}
      <ErrorMessage error={checkEvaluations.error} />
      <DataTable rows={rows} rowKey={(row) => row.idPuesto} columns={[
        { key: "code", header: "Código", render: (row) => row.codigoPuesto },
        { key: "name", header: "Nombre del puesto", render: (row) => row.nombrePuesto },
        { key: "company", header: "Empresa", render: (row) => row.empresa ?? "—" },
        { key: "candidates", header: "Candidatos", render: (row) => row.candidatos.map((candidate) => `${candidate.apellido}, ${candidate.nombre}`).join(" · ") || "0" },
        { key: "complete", header: "Evaluaciones completas", render: (row) => row.evaluacionesCompletas },
        { key: "merit", header: "Acción", render: (row) => <Button type="button" variant="secondary" disabled={checkEvaluations.isPending} onClick={() => void openMeritOrder(row)}>Emitir el orden de mérito</Button> },
      ]} emptyDescription="No hay resultados para esos filtros." />
    </Panel>}
  </>;
}
