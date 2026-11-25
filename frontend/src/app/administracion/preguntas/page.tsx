"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useCompetencies } from "@/features/competencies/hooks";
import { useFactors } from "@/features/factors/hooks";
import type { Competency } from "@/features/competencies/types";
import type { Factor } from "@/features/factors/types";
import { Button, ErrorMessage, Field, LoadingState, Notice, PageHeader, Panel, SelectField } from "@/shared/ui";

export default function QuestionsManagementPage() {
  const router = useRouter();
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [competencyId, setCompetencyId] = useState("");
  const [factorId, setFactorId] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [validation, setValidation] = useState("");
  const competencyList = useCompetencies();
  const factorList = useFactors();

  useEffect(() => {
    let mounted = true;
    Promise.all([competencyList.execute(undefined), factorList.execute(undefined)])
      .then(([competencyRows, factorRows]) => {
        if (mounted && competencyRows) setCompetencies(competencyRows);
        if (mounted && factorRows) setFactors(factorRows);
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [competencyList.execute, factorList.execute]);

  function search(event: FormEvent) {
    event.preventDefault();
    if (!competencyId && !factorId && !name.trim()) {
      setValidation("Completá al menos un criterio para buscar.");
      return;
    }
    const query = new URLSearchParams();
    if (competencyId) query.set("competenciaId", competencyId);
    if (factorId) query.set("factorId", factorId);
    if (name.trim()) query.set("nombre", name.trim());
    router.push(`/administracion/preguntas/resultados?${query.toString()}`);
  }

  function clear() { setCompetencyId(""); setFactorId(""); setName(""); setValidation(""); competencyList.clear(); factorList.clear(); }
  const availableFactors = factors.filter((factor) => !competencyId || factor.competenciaId === Number(competencyId));

  return <>
    <PageHeader eyebrow="CU020 · Gestión" title="Gestionar preguntas" description="Buscá preguntas existentes o iniciá el alta de una nueva." />
    <Panel title="Filtros de búsqueda" description="Completá al menos un criterio para buscar preguntas.">
      {loading ? <LoadingState label="Cargando competencias y factores…" /> : <form onSubmit={search} className="grid gap-5 sm:grid-cols-2">
        <SelectField label="Competencia" value={competencyId} onChange={(event) => { setCompetencyId(event.target.value); setFactorId(""); }}>
          <option value="">Seleccionar competencia</option>
          {competencies.filter((item) => item.estaActivo).map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
        </SelectField>
        <SelectField label="Factor" value={factorId} onChange={(event) => setFactorId(event.target.value)}>
          <option value="">Seleccionar factor</option>
          {availableFactors.filter((item) => item.estaActivo).map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
        </SelectField>
        <Field label="Nombre de pregunta" uppercase placeholder="Buscar por nombre de pregunta" value={name} onChange={(event) => setName(event.target.value)} />
        <div className="flex flex-wrap items-end justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="secondary" onClick={() => router.push("/consultor")}>Salir</Button>
          <Button type="button" variant="secondary" onClick={clear}>Limpiar</Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/administracion/preguntas/nueva")}>Nueva pregunta</Button>
          <Button>Buscar</Button>
        </div>
      </form>}
      {validation && <Notice tone="error">{validation}</Notice>}
      <ErrorMessage error={competencyList.error} />
      <ErrorMessage error={factorList.error} />
    </Panel>
    {!loading && <Notice title="Búsqueda de preguntas">Completá al menos un filtro y presioná “Buscar” para ver los resultados. También podés crear una nueva pregunta con “Nueva pregunta”.</Notice>}
  </>;
}
