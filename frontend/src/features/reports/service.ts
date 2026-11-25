import { api } from "@/shared/api";
import type { ComparativeCandidate, ComparativeReport, MeritGroup, PositionReportSearch, PositionReportSummary } from "./types";

export const searchPositionSummaries = (body: PositionReportSearch) => api.post<PositionReportSummary[], PositionReportSearch>("Reporte/puestos/buscar", body);
export const getMeritOrder = (positionId: number) => api.get<MeritGroup[]>(`Reporte/puestos/${positionId}/orden-merito`);
export const getCompletedCandidates = (positionId: number) => api.get<ComparativeCandidate[]>(`Reporte/puestos/${positionId}/candidatos-completos`);
export const getComparativeReport = (positionId: number, questionnaireId: number) => api.get<ComparativeReport>(`Reporte/puestos/${positionId}/cuestionarios/${questionnaireId}/comparativo`);
