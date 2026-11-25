"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { usePosition } from "@/features/positions/hooks";
import type { Position } from "@/features/positions/types";
import { useCompletedCandidates } from "@/features/reports/hooks";
import type { ComparativeCandidate } from "@/features/reports/types";
import { Button, DataTable, ErrorMessage, Notice, PageHeader, Panel, ValidationSummary } from "@/shared/ui";

export default function ComparativeCandidatesPage() {
  const params = useParams<{ idPuesto: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const idPuesto = Number(params.idPuesto);
  const [position, setPosition] = useState<Position | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const positionQuery = usePosition();
  const candidatesQuery = useCompletedCandidates();
  const [candidates, setCandidates] = useState<ComparativeCandidate[]>([]);
  const query = searchParams.toString();
  const querySuffix = query ? `?${query}` : "";

  useEffect(() => {
    let mounted = true;
    if (!Number.isInteger(idPuesto) || idPuesto <= 0) return;
    setCandidates([]);
    positionQuery.execute(idPuesto).then((result) => { if (mounted && result) setPosition(result); });
    candidatesQuery.execute(idPuesto).then((result) => {
      if (mounted && result) setCandidates(result);
    });
    return () => { mounted = false; };
  }, [idPuesto, positionQuery.execute, candidatesQuery.execute]);

  function compare() {
    if (!selected) {
      setErrors(["Al menos se debe seleccionar un candidato de la lista."]);
      return;
    }
    router.push(`/reportes/comparativo/puestos/${idPuesto}/cuestionarios/${selected}${querySuffix}`);
  }

  function backToPositions() {
    router.push(query ? `/reportes/comparativo/puestos/resultados?${query}` : "/reportes/comparativo");
  }

  return <>
    <PageHeader eyebrow="CU027 · Paso 2 de 3" title="Candidatos evaluados" description={position ? `${position.nombre} · ${position.empresaNombre ?? "Empresa sin nombre"}` : `Puesto ID ${idPuesto}`} actions={<Button variant="secondary" onClick={backToPositions}>Volver a puestos</Button>} />
    <Panel title="Elegir candidato" description="El caso de uso requiere listar solo candidatos con cuestionario completo para el puesto seleccionado.">
      {candidatesQuery.isPending ? <Notice>Cargando candidatos con evaluación completa…</Notice> : candidates.length === 0 && !candidatesQuery.error ? <Notice>No hay candidatos con cuestionario completo para este puesto.</Notice> : null}
      <DataTable
        rows={candidates}
        rowKey={(row) => row.idCuestionario}
        columns={[
          { key: "select", header: "Elegir", render: (row) => <input type="radio" name="candidate" checked={selected === row.idCuestionario} onChange={() => { setSelected(row.idCuestionario); setErrors([]); }} aria-label={`Elegir a ${row.apellido}, ${row.nombre}`} /> },
          { key: "apellido", header: "Apellido", render: (row) => row.apellido },
          { key: "nombre", header: "Nombre", render: (row) => row.nombre },
          { key: "tipoDocumento", header: "Tipo de documento", render: (row) => row.tipoDocumento },
          { key: "documento", header: "Documento", render: (row) => row.numeroDocumento },
          { key: "numeroCandidato", header: "N.º de candidato", render: (row) => row.numeroCandidato },
          { key: "fecha", header: "Finalización", render: (row) => row.fechaFinalizacion.slice(0, 10).split("-").reverse().join("/") },
        ]}
      />
      <div className="mt-4 grid justify-items-start gap-2">
        <ValidationSummary errors={errors} />
        <ErrorMessage error={positionQuery.error} />
        <ErrorMessage error={candidatesQuery.error} />
        <div className="flex flex-wrap gap-3">
          <Button type="button" disabled={candidatesQuery.isPending} onClick={compare}>Comparar</Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/consultor")}>Cancelar</Button>
        </div>
      </div>
    </Panel>
  </>;
}
