import { api } from "@/shared/api";
import type { Questionnaire, SaveQuestionnaireAnswersRequest } from "./types";

export const accessQuestionnaire = (token: string, claveIngreso: string) =>
  api.postWithToken<Questionnaire, { claveIngreso: string }>(
    "cuestionario/acceder", { claveIngreso }, token);

export const startQuestionnaire = (token: string, questionnaireId: number) =>
  api.postWithToken<Questionnaire, Record<string, never>>(
    `cuestionario/${questionnaireId}/iniciar`, {}, token);

export const savePartialAnswers = (
  token: string, questionnaireId: number,
  body: SaveQuestionnaireAnswersRequest) =>
  api.patchWithToken<Questionnaire, SaveQuestionnaireAnswersRequest>(
    `cuestionario/${questionnaireId}/respuestas`, body, token);

export const finishQuestionnaireBlock = (
  token: string, questionnaireId: number,
  body: SaveQuestionnaireAnswersRequest) =>
  api.postWithToken<Questionnaire, SaveQuestionnaireAnswersRequest>(
    `cuestionario/${questionnaireId}/finalizar-bloque`, body, token);
