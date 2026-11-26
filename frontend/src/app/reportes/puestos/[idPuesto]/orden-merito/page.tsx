"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMeritOrder } from "@/features/reports/hooks";
import type { MeritGroup, MeritCandidate } from "@/features/reports/types";
import { Button, DataTable, ErrorMessage, LoadingState, PageHeader, Panel, StatusBadge } from "@/shared/ui";

export default function MeritOrderPage() {
  const params = useParams<{ idPuesto: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = Number(params.idPuesto);
  const [groups, setGroups] = useState<MeritGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const meritOrder = useMeritOrder();
  const query = searchParams.toString();
  const todas = searchParams.get("todas") === "true";

  useEffect(() => {
    let mounted = true;
    const idsCuestionario = new URLSearchParams(query).getAll("idsCuestionario").map(Number).filter(Number.isInteger);
    if (!todas && idsCuestionario.length === 0) {
      router.replace(`/reportes/puestos/${id}/orden-merito/seleccion`);
      return () => { mounted = false; };
    }
    setLoading(true);
    meritOrder.execute({ positionId: id, selection: { todas, idsCuestionario } })
      .then((rows) => { if (mounted && rows) setGroups(rows); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [id, query, todas, meritOrder.execute, router]);

  return <>
    <PageHeader eyebrow="CU028 · Reportes" title="Orden de mérito" description={`Puesto ID ${id}. Se muestran los candidatos agrupados por estado del cuestionario.`} actions={<div className="flex gap-2"><Button variant="secondary" onClick={() => router.push(`/reportes/puestos/${id}/orden-merito/seleccion`)}>Cambiar selección</Button><Button variant="secondary" onClick={() => window.print()}>Imprimir</Button></div>} />
    {loading ? <LoadingState /> : groups.length === 0 ? <Panel><p className="text-sm text-slate-600">No hay resultados de mérito para la selección realizada.</p></Panel> : <div className="space-y-5">{groups.map((group) => <MeritGroupPanel key={group.estado} group={group} />)}</div>}
    <ErrorMessage error={meritOrder.error} />
  </>;
}

function MeritGroupPanel({ group }: { group: MeritGroup }) {
  return <Panel title={<><StatusBadge>{group.estado}</StatusBadge><span className="ml-3">{group.candidatos.length} candidatos</span></>}><DataTable<MeritCandidate> rows={group.candidatos} rowKey={(row) => row.idCuestionario} columns={[
    { key: "rank", header: "Orden", render: (row) => row.ordenMerito ?? "—" },
    { key: "candidate", header: "Candidato", render: (row) => [row.apellido, row.nombre].filter(Boolean).join(", ") || "—" },
    { key: "documentType", header: "Tipo documento", render: (row) => row.tipoDocumento ?? "—" },
    { key: "document", header: "Número documento", render: (row) => row.numeroDocumento ?? "—" },
    { key: "score", header: "Puntaje", render: (row) => row.puntajeObtenido ?? "—" },
    { key: "start", header: "Inicio", render: (row) => row.fechaInicio ?? "—" },
    { key: "end", header: "Finalización", render: (row) => row.fechaFin ?? "—" },
    { key: "lastAccess", header: "Último ingreso", render: (row) => row.ultimoIngreso ?? "—" },
    { key: "access", header: "Accesos", render: (row) => row.cantidadAccesos ?? "—" },
  ]}/></Panel>;
}
