import { FeatureUnavailableError } from "@/shared/api/errors";

export type CapabilityState = "available" | "partial" | "unavailable";

export const capabilities = {
  candidates: { state: "partial", reason: "La API existe; revisar validaciones y semántica del PUT." },
  companies: { state: "partial", reason: "La API existe; no ofrece listado general y la modificación necesita validar nombre." },
  competencies: { state: "partial", reason: "La API existe; reglas y auditoría requieren revisión con el enunciado." },
  factors: { state: "partial", reason: "La API existe; la validación de nroOrden requiere revisión." },
  questions: { state: "partial", reason: "La API existe; el contrato de búsqueda y algunas reglas necesitan revisión." },
  answerOptions: { state: "partial", reason: "La API existe; la edición no permite agregar o quitar detalles." },
  positions: { state: "partial", reason: "La API existe; el alta/modificación usa relaciones como objetos anidados." },
  evaluations: { state: "partial", reason: "El flujo HTTP está implementado; falta cotejar alternativas con el enunciado." },
  reports: { state: "partial", reason: "Hay resumen y orden de mérito; revisar fórmula y filtros." },
  consultantLogin: { state: "available", reason: "" },
  candidateLogin: { state: "unavailable", reason: "El endpoint devuelve null; además TipoDocumento no tiene valores." },
  questionnaires: { state: "unavailable", reason: "La lógica existe en servicios, pero falta publicar endpoints HTTP." },
  csvImport: { state: "unavailable", reason: "El backend no implementa la importación de candidatos CSV." },
  csvExport: { state: "available", reason: "CU007 permite buscar puestos y candidatos con evaluaciones completas y descargar sus resultados en CSV." },
  comparativeReport: { state: "unavailable", reason: "El backend no implementa el reporte comparativo individual." },
  questionnaireClosing: { state: "unavailable", reason: "El backend no implementa el proceso periódico de cierre." },
  aiQuestionGeneration: { state: "unavailable", reason: "El backend no implementa generación de preguntas con IA." },
} as const satisfies Record<string, { state: CapabilityState; reason: string }>;

export type CapabilityId = keyof typeof capabilities;

export function assertCapabilityAvailable(id: CapabilityId): void {
  const capability = capabilities[id];
  if (capability.state === "unavailable") {
    throw new FeatureUnavailableError(id, capability.reason);
  }
}

export function getCapabilityMessage(id: CapabilityId): string | null {
  const capability = capabilities[id];
  return capability.state === "unavailable" ? capability.reason : null;
}
