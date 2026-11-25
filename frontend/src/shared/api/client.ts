import { ApiError } from "@/shared/api/errors";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/backend").replace(/\/$/, "");

function route(path: string) {
  return `${apiBase}/${path.replace(/^\//, "")}`;
}

function messageForHttpError(status: number, backendMessage?: string): string {
  const safeBackendMessage = backendMessage?.trim();
  switch (status) {
    case 400:
      return safeBackendMessage || "Revisá los datos ingresados y volvé a intentar.";
    case 401:
      return safeBackendMessage || "No se pudo verificar tu acceso. Iniciá sesión nuevamente.";
    case 403:
      return safeBackendMessage || "No tenés permiso para realizar esta acción.";
    case 404:
      return safeBackendMessage || "No encontramos lo que buscabas o ya no está disponible.";
    case 409:
      return safeBackendMessage || "La operación entra en conflicto con datos existentes.";
    case 422:
      return safeBackendMessage || "No se pudieron procesar algunos datos. Revisalos e intentá de nuevo.";
    default:
      if (status >= 500) {
        return "Ocurrió un problema en el servidor. Probá de nuevo más tarde.";
      }
      return "No se pudo completar la solicitud. Volvé a intentarlo.";
  }
}

export async function request<TResponse>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  token?: string,
): Promise<TResponse> {
  const url = route(path);
  let response: Response;

  try {
    const headers: Record<string, string> = body === undefined
      ? { Accept: "application/json" }
      : { Accept: "application/json", "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    response = await fetch(url, {
      method,
      cache: "no-store",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError({
      message: "No se pudo conectar con la API. Revisá que el backend esté iniciado.",
      status: 0,
      method,
      path,
    });
  }

  if (response.status === 204) return undefined as TResponse;

  const contentType = response.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    const apiPayload = payload && typeof payload === "object"
      ? payload as { mensaje?: unknown; errores?: unknown }
      : undefined;
    const fieldErrors = (response.status === 400 || response.status === 422) && Array.isArray(apiPayload?.errores)
      ? apiPayload.errores.filter((item): item is { campo: string; mensaje: string } =>
          !!item && typeof item === "object" &&
          typeof (item as { campo?: unknown }).campo === "string" &&
          typeof (item as { mensaje?: unknown }).mensaje === "string")
      : [];

    throw new ApiError({
      message: messageForHttpError(
        response.status,
        typeof apiPayload?.mensaje === "string" ? apiPayload.mensaje : undefined,
      ),
      status: response.status,
      method,
      path,
      fieldErrors,
    });
  }

  return payload as TResponse;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T, B = unknown>(path: string, body: B) => request<T>("POST", path, body),
  postWithToken: <T, B = unknown>(path: string, body: B, token: string) => request<T>("POST", path, body, token),
  patchWithToken: <T, B = unknown>(path: string, body: B, token: string) => request<T>("PATCH", path, body, token),
  put: <T, B = unknown>(path: string, body: B) => request<T>("PUT", path, body),
  patch: <T, B = unknown>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: (path: string) => request<void>("DELETE", path),
};
