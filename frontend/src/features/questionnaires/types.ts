import type { EstadoCuestionario } from "@/shared/types/enums";

export type Questionnaire = { idCuestionario: number; estado: EstadoCuestionario; bloque: number | null; totalBloques: number | null; instrucciones: string | null; preguntas: QuestionnaireQuestion[]; respuestasGuardadas: QuestionnaireAnswer[]; puntajeFinal: number | null; cumplePonderacionMinima: boolean | null; puntajesPorCompetencia: Record<number, number> | null };
export type QuestionnaireQuestion = { idPreguntaModelo: number; texto: string; descripcion: string | null; orden: number; opciones: Array<{ idOpcionModelo: number; descripcion: string; ordenVisualizacion: number }> };
export type QuestionnaireAnswer = { idPreguntaModelo: number; idOpcionModelo: number };
export type SaveQuestionnaireAnswersRequest = { respuestas: QuestionnaireAnswer[] };
export type QuestionnaireSession = { token: string; idCandidato: number; nombreCandidato: string };
