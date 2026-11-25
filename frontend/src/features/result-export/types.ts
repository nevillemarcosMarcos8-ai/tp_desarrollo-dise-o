export type ResultExportSearch = {
  nombre?: string;
  empresa?: string;
  desde?: string;
  hasta?: string;
};

export type ExportPosition = {
  idPuesto: number;
  codigoPuesto: string;
  nombrePuesto: string;
  empresa: string | null;
};

export type ExportCandidate = {
  idCuestionario: number;
  idCandidato: number;
  nombre: string;
  apellido: string;
  tipoDocumento: string | null;
  numeroDocumento: string;
  numeroCandidato: string;
  fechaFinalizacion: string;
};

export type ExportCandidatesQuery = {
  positionId: number;
  desde?: string;
  hasta?: string;
};
