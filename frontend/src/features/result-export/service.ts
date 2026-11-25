import { api } from "@/shared/api";
import { ApiError } from "@/shared/api/errors";
import type { ExportCandidate, ExportCandidatesQuery, ExportPosition, ResultExportSearch } from "./types";

const endpoint = "ExportacionResultados";

function toDateQuery(query: ExportCandidatesQuery): string {
  const params = new URLSearchParams();
  if (query.desde) params.set("desde", query.desde);
  if (query.hasta) params.set("hasta", query.hasta);
  const value = params.toString();
  return value ? `?${value}` : "";
}

export function searchExportPositions(criteria: ResultExportSearch) {
  return api.post<ExportPosition[], ResultExportSearch>(
    `${endpoint}/puestos/buscar`, criteria);
}

export function getExportCandidates(query: ExportCandidatesQuery) {
  return api.get<ExportCandidate[]>(
    `${endpoint}/puestos/${query.positionId}/candidatos${toDateQuery(query)}`);
}

function filenameFromDisposition(disposition: string | null): string | null {
  if (!disposition) return null;
  const utf8 = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (utf8) {
    try { return decodeURIComponent(utf8.replace(/^"|"$/g, "")); }
    catch { return utf8.replace(/^"|"$/g, ""); }
  }
  return disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? null;
}

export async function downloadResultsCsv(query: ExportCandidatesQuery): Promise<void> {
  const path = `${endpoint}/puestos/${query.positionId}/csv${toDateQuery(query)}`;
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/backend").replace(/\/$/, "");
  let response: Response;
  try {
    response = await fetch(`${apiBase}/${path}`, {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "text/csv" },
    });
  } catch {
    throw new ApiError({
      message: "No se pudo conectar con la API. Revisá que el backend esté iniciado.",
      status: 0,
      method: "GET",
      path,
    });
  }

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const backendMessage = payload && typeof payload === "object"
      && "mensaje" in payload && typeof payload.mensaje === "string"
      ? payload.mensaje : undefined;
    throw new ApiError({
      message: backendMessage || (response.status >= 500
        ? "Ocurrió un problema en el servidor al generar el CSV."
        : "No se pudo generar el archivo CSV."),
      status: response.status,
      method: "GET",
      path,
    });
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filenameFromDisposition(response.headers.get("content-disposition"))
    ?? `resultados-puesto-${query.positionId}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
