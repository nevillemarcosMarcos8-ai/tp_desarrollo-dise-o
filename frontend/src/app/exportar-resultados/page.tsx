"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { appRoutes } from "@/shared/navigation/routes";
import { Button, Field, PageHeader, Panel, ValidationSummary } from "@/shared/ui";

export default function ResultsExportSearchPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({ nombre: "", empresa: "", desde: "", hasta: "" });
  const [errors, setErrors] = useState<string[]>([]);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (filters.desde && filters.hasta && filters.desde > filters.hasta) {
      setErrors(["La fecha desde no puede ser posterior a la fecha hasta."]);
      return;
    }
    if (!Object.values(filters).some((value) => value.trim())) {
      setErrors(["Completá al menos un filtro para buscar puestos."]);
      return;
    }
    setErrors([]);
    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
    router.push(`${appRoutes.resultsExportPositions}?${query.toString()}`);
  }

  return <>
    <PageHeader eyebrow="Consultor · CU007 · Paso 1 de 3" title="Buscar resultados para exportar" description="Buscá puestos por nombre o función, empresa y fecha de finalización de los cuestionarios." />
    <Panel title="Filtros de búsqueda">
      <form onSubmit={search} className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre o función del puesto" value={filters.nombre} onChange={(event) => setFilters({ ...filters, nombre: event.target.value })} />
        <Field label="Empresa" value={filters.empresa} onChange={(event) => setFilters({ ...filters, empresa: event.target.value })} />
        <Field label="Fecha de finalización desde" type="date" value={filters.desde} onChange={(event) => setFilters({ ...filters, desde: event.target.value })} />
        <Field label="Fecha de finalización hasta" type="date" value={filters.hasta} onChange={(event) => setFilters({ ...filters, hasta: event.target.value })} />
        <div className="sm:col-span-2"><ValidationSummary errors={errors} /><Button type="submit">Buscar puestos</Button></div>
      </form>
    </Panel>
  </>;
}
