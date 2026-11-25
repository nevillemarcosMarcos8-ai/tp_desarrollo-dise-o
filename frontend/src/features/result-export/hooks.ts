"use client";

import { useServiceAction } from "@/shared/hooks/use-service-action";
import * as service from "./service";
import type { ExportCandidatesQuery, ResultExportSearch } from "./types";

export const useSearchExportPositions = () =>
  useServiceAction((criteria: ResultExportSearch) => service.searchExportPositions(criteria));

export const useExportCandidates = () =>
  useServiceAction((query: ExportCandidatesQuery) => service.getExportCandidates(query));

export const useDownloadResultsCsv = () =>
  useServiceAction((query: ExportCandidatesQuery) => service.downloadResultsCsv(query));
