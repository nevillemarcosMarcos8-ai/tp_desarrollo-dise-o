"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSearchExportPositions } from "@/features/result-export/hooks";
import type { ExportPosition, ResultExportSearch } from "@/features/result-export/types";
import { appRoutes } from "@/shared/navigation/routes";
import { DataTable, ErrorMessage, LoadingState, PageHeader, Panel } from "@/shared/ui";

export default function ResultsExportPositionsPage() {
  const params = useSearchParams();
  const search = useSearchExportPositions();
  const [positions, setPositions] = useState<ExportPosition[]>([]);
  const nombre = params.get("nombre") || undefined;
  const empresa = params.get("empresa") || undefined;
  const desde = params.get("desde") || undefined;
  const hasta = params.get("hasta") || undefined;
  const criteria = useMemo<ResultExportSearch>(() => ({
    nombre, empresa, desde, hasta,
  }), [nombre, empresa, desde, hasta]);
  const query = params.toString();
  const querySuffix = query ? `?${query}` : "";

  useEffect(() => {
    let mounted = true;
    setPositions([]);
    search.execute(criteria).then((result) => {
      if (mounted && result) setPositions(result);
    });
    return () => { mounted = false; };
  }, [criteria, search.execute]);

  return <>
    <PageHeader eyebrow="Consultor · CU007 · Paso 2 de 3" title="Puestos encontrados" description="Elegí un puesto para consultar sus candidatos con cuestionarios completos." actions={<Link className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" href={appRoutes.resultsExport}>Volver a filtros</Link>} />
    <Panel title="Resultados de puestos">
      {search.isPending ? <LoadingState label="Buscando puestos con evaluaciones completas…" /> : <DataTable
        rows={positions}
        rowKey={(row) => row.idPuesto}
        emptyDescription="No hay puestos con cuestionarios completos que coincidan con esos filtros."
        columns={[
          { key: "code", header: "Código", render: (row) => row.codigoPuesto },
          { key: "position", header: "Puesto", render: (row) => row.nombrePuesto },
          { key: "company", header: "Empresa", render: (row) => row.empresa ?? "—" },
          { key: "select", header: "Acción", render: (row) => <Link className="font-semibold text-[var(--color-brand)] hover:underline" href={`${appRoutes.resultsExportCandidates(row.idPuesto)}${querySuffix}`}>Ver candidatos →</Link> },
        ]}
      />}
      <ErrorMessage error={search.error} />
    </Panel>
  </>;
}
