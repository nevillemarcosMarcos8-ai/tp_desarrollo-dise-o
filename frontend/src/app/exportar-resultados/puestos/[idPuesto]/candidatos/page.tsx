"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useDownloadResultsCsv, useExportCandidates } from "@/features/result-export/hooks";
import type { ExportCandidate, ExportCandidatesQuery } from "@/features/result-export/types";
import { appRoutes } from "@/shared/navigation/routes";
import { Button, DataTable, ErrorMessage, LoadingState, Notice, PageHeader, Panel, formatDate } from "@/shared/ui";

export default function ResultsExportCandidatesPage() {
  const params = useParams<{ idPuesto: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const idPuesto = Number(params.idPuesto);
  const [candidates, setCandidates] = useState<ExportCandidate[]>([]);
  const candidatesAction = useExportCandidates();
  const downloadAction = useDownloadResultsCsv();
  const desde = searchParams.get("desde") || undefined;
  const hasta = searchParams.get("hasta") || undefined;
  const query = useMemo<ExportCandidatesQuery>(() => ({
    positionId: idPuesto,
    desde,
    hasta,
  }), [idPuesto, desde, hasta]);
  const searchSuffix = searchParams.toString() ? `?${searchParams.toString()}` : "";

  useEffect(() => {
    let mounted = true;
    setCandidates([]);
    if (!Number.isInteger(idPuesto) || idPuesto <= 0) return;
    candidatesAction.execute(query).then((result) => {
      if (mounted && result) setCandidates(result);
    });
    return () => { mounted = false; };
  }, [idPuesto, query, candidatesAction.execute]);

  function backToPositions() {
    router.push(`${appRoutes.resultsExportPositions}${searchSuffix}`);
  }

  return <>
    <PageHeader
      eyebrow="Consultor · CU007 · Paso 3 de 3"
      title="Candidatos evaluados"
      description={`Puesto ID ${idPuesto}. Se listan únicamente cuestionarios completos dentro del período elegido.`}
      actions={<Button variant="secondary" onClick={backToPositions}>Volver a puestos</Button>}
    />
    <Panel
      title="Candidatos con cuestionario completo"
      actions={<Button
        disabled={!candidates.length || candidatesAction.isPending || downloadAction.isPending}
        onClick={() => downloadAction.execute(query, "CSV generado")}
      >{downloadAction.isPending ? "Generando CSV…" : "Exportar CSV"}</Button>}
    >
      {candidatesAction.isPending
        ? <LoadingState label="Buscando candidatos evaluados…" />
        : <DataTable
            rows={candidates}
            rowKey={(row) => row.idCuestionario}
            emptyDescription="No hay candidatos con cuestionarios completos para este puesto y período."
            columns={[
              { key: "apellido", header: "Apellido", render: (row) => row.apellido },
              { key: "nombre", header: "Nombre", render: (row) => row.nombre },
              { key: "tipoDocumento", header: "Tipo documento", render: (row) => row.tipoDocumento ?? "—" },
              { key: "numeroDocumento", header: "Nro documento", render: (row) => row.numeroDocumento },
              { key: "numeroCandidato", header: "Nro candidato", render: (row) => row.numeroCandidato },
              { key: "fecha", header: "Finalización", render: (row) => formatDate(row.fechaFinalizacion) },
            ]}
          />}
      <ErrorMessage error={candidatesAction.error} />
      <ErrorMessage error={downloadAction.error} />
      {downloadAction.success && <Notice tone="success">El archivo CSV se descargó.</Notice>}
    </Panel>
  </>;
}
