"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, PageHeader, Panel, ValidationSummary } from "@/shared/ui";

export default function ComparativeReportSearchPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = !nombre.trim() && !empresa.trim()
      ? ["Ingresá el nombre del puesto o la empresa para buscar."]
      : [];
    setErrors(nextErrors);
    if (nextErrors.length) return;

    const params = new URLSearchParams();
    if (nombre.trim()) params.set("nombre", nombre.trim());
    if (empresa.trim()) params.set("empresa", empresa.trim());
    router.push(`/reportes/comparativo/puestos/resultados?${params.toString()}`);
  }

  return <>
    <PageHeader eyebrow="Consultor · CU027" title="Emitir reporte comparativo" description="Primero buscá el puesto para el que querés comparar los resultados de un candidato." />
    <Panel title="Buscar puesto" description="Podés completar el nombre del puesto, la empresa o ambos.">
      <form noValidate onSubmit={search} className="grid max-w-2xl gap-4 sm:grid-cols-2">
        <Field label="Nombre de función o puesto" uppercase placeholder="Ej.: ANALISTA DE SISTEMAS" value={nombre} onChange={(event) => { setNombre(event.target.value); setErrors([]); }} />
        <Field label="Empresa" uppercase placeholder="Ej.: EMPRESA NORTE" value={empresa} onChange={(event) => { setEmpresa(event.target.value); setErrors([]); }} />
        <ValidationSummary errors={errors} />
        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <Button type="submit">Buscar funciones</Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/consultor")}>Cancelar</Button>
        </div>
      </form>
    </Panel>
  </>;
}
