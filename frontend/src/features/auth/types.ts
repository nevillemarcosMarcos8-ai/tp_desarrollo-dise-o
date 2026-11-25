import type { TipoDocumento } from "@/shared/types/enums";

export type CandidateLoginRequest = { tipo: TipoDocumento; documento: string; contrasenia: string };
export type ConsultantLoginRequest = { nombre: string };
export type LoginResponse = { token: string; idCandidato: number; nombreCandidato: string };
export type ConsultantSession = { idConsultor: number; nombreConsultor: string };
