"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearEvaluationFlow, downloadEvaluationKeysExcel, readEvaluationFlow, type EvaluationFlowState } from "@/features/evaluations/flow";
import { appRoutes } from "@/shared/navigation/routes";
import { Button, DataTable, Notice, PageHeader, Panel } from "@/shared/ui";

export default function EvaluationResultPage() {
  const router = useRouter();
  const [flow, setFlow] = useState<EvaluationFlowState | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = readEvaluationFlow();
    if (saved?.confirmed) setFlow(saved);
    else router.replace(appRoutes.newEvaluation);
    setReady(true);
  }, [router]);

  function finishWithoutExport() {
    clearEvaluationFlow();
    router.push("/consultor");
  }

  function exportAndFinish() {
    if (!flow?.confirmed) return;
    const position = flow.positions.find((item) => item.idPuesto === flow.positionId);
    const positionName = position?.nombrePuesto ?? "Puesto";
    downloadEvaluationKeysExcel(flow.confirmed, positionName);
  }

  if (!ready || !flow?.confirmed) return null;
  return <>
    <PageHeader eyebrow="CU025 · Paso 5 de 5" title="Evaluaciones generadas" description="Se crearon los cuestionarios en estado activo para cada candidato bajo el mismo modelo." />
    <Panel title="Lista de candidatos a evaluar y claves de ingreso">
      <Notice tone="success" title="Evaluación guardada">¿Deseás exportar la lista de candidatos con sus claves a un archivo Excel?</Notice>
      <DataTable rows={flow.confirmed} rowKey={(row) => `${row.numeroDocumento}-${row.claveIngreso}`} emptyTitle="No se generaron evaluaciones" columns={[
        { key: "apellido", header: "Apellido", render: (row) => row.apellido },
        { key: "nombre", header: "Nombre", render: (row) => row.nombre },
        { key: "tipoDocumento", header: "Tipo documento", render: (row) => row.tipoDocumento },
        { key: "numeroDocumento", header: "Nro. documento", render: (row) => row.numeroDocumento },
        { key: "key", header: "Clave de ingreso", render: (row) => <strong className="font-mono">{row.claveIngreso}</strong> },
      ]} />
      <Panel className="mt-5" title="Exportar datos a Excel" description="El archivo se descargará con el formato aaaa-mm-dd-hh-mm-NombreFunción.xls.">
        <div className="flex flex-wrap gap-3">
          <Button type="button" disabled={!flow.confirmed.length} onClick={exportAndFinish}>Exportar a Excel</Button>
          <Button type="button" variant="secondary" onClick={finishWithoutExport}>No exportar y finalizar</Button>
        </div>
      </Panel>
    </Panel>
  </>;
}
