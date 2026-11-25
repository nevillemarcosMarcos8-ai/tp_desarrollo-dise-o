"use client";
import { useServiceAction } from "@/shared/hooks/use-service-action";
import { accessQuestionnaire, finishQuestionnaireBlock, savePartialAnswers, startQuestionnaire } from "./service";
import type { SaveQuestionnaireAnswersRequest } from "./types";

export const useQuestionnaireAccess = () =>
  useServiceAction(({ token, claveIngreso }: { token: string; claveIngreso: string }) =>
    accessQuestionnaire(token, claveIngreso),
  );
export const useStartQuestionnaire = () =>
  useServiceAction(({ token, id }: { token: string; id: number }) =>
    startQuestionnaire(token, id),
  );
export const useSavePartialAnswers = () =>
  useServiceAction(({ token, id, body }: { token: string; id: number; body: SaveQuestionnaireAnswersRequest }) =>
    savePartialAnswers(token, id, body),
  );
export const useFinishQuestionnaireBlock = () =>
  useServiceAction(({ token, id, body }: { token: string; id: number; body: SaveQuestionnaireAnswersRequest }) =>
    finishQuestionnaireBlock(token, id, body),
  );
