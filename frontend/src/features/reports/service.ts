import { api } from "@/shared/api";
import type { ComparativeCandidate, ComparativeReport, MeritGroup, PositionEvaluation, PositionReportSearch, PositionReportSummary } from "./types";

export const searchPositionSummaries = (body: PositionReportSearch) => api.post<PositionReportSummary[], PositionReportSearch>("Reporte/puestos/buscar", body);
export const getPositionEvaluations = (positionId: number) => api.get<PositionEvaluation[]>(`Reporte/puestos/${positionId}/evaluaciones`);
export const getMeritOrder = (positionId: number, evaluationIds?: number[]) => {
  const params = new URLSearchParams();
  for (const id of evaluationIds ?? []) {
    params.append("idsEvaluaciones", String(id));
  }
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return api.get<MeritGroup[]>(`Reporte/puestos/${positionId}/orden-merito${suffix}`);
};
export const getCompletedCandidates = (positionId: number) => api.get<ComparativeCandidate[]>(`Reporte/puestos/${positionId}/candidatos-completos`);
export const getComparativeReport = (positionId: number, questionnaireId: number) => api.get<ComparativeReport>(`Reporte/puestos/${positionId}/cuestionarios/${questionnaireId}/comparativo`);
