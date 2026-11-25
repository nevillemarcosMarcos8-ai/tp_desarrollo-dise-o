import type { ConfirmedEvaluation, EvaluationCandidate, EvaluationPosition, RequiredCompetency, SearchEvaluationCandidatesRequest } from "./types";

const STORAGE_KEY = "evaluation-flow-v1";

export type EvaluationFlowState = {
  criteria: SearchEvaluationCandidatesRequest;
  candidates: EvaluationCandidate[];
  selectedCandidates?: EvaluationCandidate[];
  selectedIds: number[];
  positions: EvaluationPosition[];
  positionId: number | null;
  competencies: RequiredCompetency[] | null;
  confirmed: ConfirmedEvaluation[] | null;
};

export function readEvaluationFlow(): EvaluationFlowState | null {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) as EvaluationFlowState : null;
  } catch {
    return null;
  }
}

export function writeEvaluationFlow(value: EvaluationFlowState): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function clearEvaluationFlow(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

function xmlEscape(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

function filenamePart(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\\/:*?"<>|]/g, "-").trim().replace(/\s+/g, "-") || "Puesto";
}

export function downloadEvaluationKeysExcel(rows: ConfirmedEvaluation[], positionName: string): void {
  const headings = ["Apellido", "Nombre", "Tipo de documento", "Número de documento", "Clave de ingreso"];
  const data = rows.map((row) => [row.apellido, row.nombre, row.tipoDocumento, row.numeroDocumento, row.claveIngreso]);
  const xmlRows = [headings, ...data].map((row) => `<Row>${row.map((cell) => `<Cell><Data ss:Type="String">${xmlEscape(String(cell ?? ""))}</Data></Cell>`).join("")}</Row>`).join("");
  const workbook = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Claves"><Table>${xmlRows}</Table></Worksheet></Workbook>`;
  const blob = new Blob(["\ufeff", workbook], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const now = new Date();
  const timestamp = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0"), String(now.getHours()).padStart(2, "0"), String(now.getMinutes()).padStart(2, "0")].join("-");
  link.href = url;
  link.download = `${timestamp}-${filenamePart(positionName)}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
