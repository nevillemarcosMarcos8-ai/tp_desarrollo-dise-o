import type { CandidateLoginRequest, ConsultantLoginRequest, ConsultantSession, LoginResponse } from "./types";
import { api } from "@/shared/api";

export async function loginCandidate(body: CandidateLoginRequest): Promise<LoginResponse> {
  return api.post<LoginResponse, CandidateLoginRequest>("login/candidato", body);
}

export const loginConsultant = (body: ConsultantLoginRequest) =>
  api.post<ConsultantSession, ConsultantLoginRequest>("login/consultor", body);

export const getConsultantSession = () =>
  api.get<ConsultantSession>("login/consultor/sesion");

export const logoutConsultant = () =>
  api.post<void>("login/consultor/salir", {});
