import { api } from "@/shared/api";
import type { ComparativeCandidate, ComparativeReport, MeritEvaluation, MeritGroup, PositionReportSearch, PositionReportSummary } from "./types";

export const searchPositionSummaries = (body: PositionReportSearch) => api.post<PositionReportSummary[], PositionReportSearch>("Reporte/puestos/buscar", body);
export const getMeritOrderEvaluations = (positionId: number) => api.get<MeritEvaluation[]>(`Reporte/puestos/${positionId}/evaluaciones`);
export const getMeritOrder = (positionId: number, selection: { todas: boolean; idsCuestionario: number[] }) => {
  const query = new URLSearchParams();
  if (selection.todas) query.set("todas", "true");
  else selection.idsCuestionario.forEach((id) => query.append("idsCuestionario", String(id)));
  return api.get<MeritGroup[]>(`Reporte/puestos/${positionId}/orden-merito?${query.toString()}`);
};
export const getCompletedCandidates = (positionId: number) => api.get<ComparativeCandidate[]>(`Reporte/puestos/${positionId}/candidatos-completos`);
export const getComparativeReport = (positionId: number, questionnaireId: number) => api.get<ComparativeReport>(`Reporte/puestos/${positionId}/cuestionarios/${questionnaireId}/comparativo`);
