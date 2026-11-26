"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useSearchPositionSummaries } from "@/features/reports/hooks";
import type { PositionReportSummary, PositionReportSearch } from "@/features/reports/types";
import { Button, DataTable, ErrorMessage, Field, Notice, PageHeader, Panel } from "@/shared/ui";

export default function PositionReportsPage() {
  const [criteria, setCriteria] = useState<PositionReportSearch>({ codigo: "", nombre: "", empresa: "" }); const [rows, setRows] = useState<PositionReportSummary[] | null>(null); const searchAction = useSearchPositionSummaries();
  async function search(event: FormEvent) { event.preventDefault(); const result = await searchAction.execute(criteria); if (result) setRows(result); }
  return <><PageHeader eyebrow="Reportes" title="Evaluaciones por puesto" description="Buscar un puesto y consultar cuántos candidatos completaron la evaluación." /><Panel title="Filtros"><form onSubmit={search} className="grid gap-4 sm:grid-cols-4"><Field label="Código" value={criteria.codigo ?? ""} onChange={(e) => setCriteria({ ...criteria, codigo: e.target.value })} /><Field label="Puesto" value={criteria.nombre ?? ""} onChange={(e) => setCriteria({ ...criteria, nombre: e.target.value })} /><Field label="Empresa" value={criteria.empresa ?? ""} onChange={(e) => setCriteria({ ...criteria, empresa: e.target.value })} /><div className="self-end"><Button disabled={searchAction.isPending}>Buscar reporte</Button></div></form><ErrorMessage error={searchAction.error} />{searchAction.success && <Notice tone="success">{searchAction.success}</Notice>}</Panel>{rows && <Panel className="mt-6" title="Resultados"><DataTable rows={rows} rowKey={(row) => row.idPuesto} columns={[{ key: "code", header: "Código", render: (row) => row.codigoPuesto }, { key: "name", header: "Puesto", render: (row) => row.nombrePuesto }, { key: "company", header: "Empresa", render: (row) => row.empresa ?? "—" }, { key: "complete", header: "Evaluaciones completas", render: (row) => row.evaluacionesCompletas }, { key: "candidates", header: "Candidatos", render: (row) => row.candidatos.map((candidate) => `${candidate.apellido}, ${candidate.nombre}`).join(" · ") || "—" }, { key: "merit", header: "Orden de mérito", render: (row) => <Link className="font-semibold text-[var(--color-brand)] hover:underline" href={`/reportes/puestos/${row.idPuesto}/orden-merito/seleccion`}>Abrir →</Link> }]} emptyDescription="No hay resultados para esos filtros." /></Panel>}</>;
}
