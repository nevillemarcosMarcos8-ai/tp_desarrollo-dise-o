import type { SearchPositionsRequest } from "@/features/positions/types";

export type PositionReportSearch = SearchPositionsRequest;
export type PositionReportSummary = { idPuesto: number; codigoPuesto: string; nombrePuesto: string; empresa: string | null; candidatos: Array<{ nombre: string; apellido: string }>; evaluacionesCompletas: number };
export type MeritCandidate = { idCuestionario: number; idCandidato: number | null; tipoDocumento: string | null; numeroDocumento: string | null; nombre: string | null; apellido: string | null; puntajeObtenido: number | null; ordenMerito: number | null; fechaInicio: string | null; fechaFin: string | null; ultimoIngreso: string | null; cantidadAccesos: number | null };
export type MeritGroup = { estado: string; candidatos: MeritCandidate[] };
export type PositionEvaluation = { idEvaluacion: number; fechaCreacion: string | null; cantidadCandidatos: number; cantidadCompletos: number };
export type ComparativeCandidate = { idCuestionario: number; idCandidato: number; nombre: string; apellido: string; tipoDocumento: string; numeroDocumento: string; numeroCandidato: string; fechaFinalizacion: string };
export type CompetencyComparison = { idCompetencia: number; nombreCompetencia: string; valorRequerido: number; valorObtenido: number };
export type ComparativeReport = { idPuesto: number; codigoPuesto: string; nombrePuesto: string; empresa: string | null; candidato: ComparativeCandidate; competencias: CompetencyComparison[] };
