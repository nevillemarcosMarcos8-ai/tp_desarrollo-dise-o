"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  useFinishQuestionnaireBlock,
  useQuestionnaireAccess,
  useSavePartialAnswers,
  useStartQuestionnaire,
} from "@/features/questionnaires/hooks";
import type {
  QuestionnaireAnswer as MarkedAnswer,
  Questionnaire as QuestionnaireResponse,
  QuestionnaireSession,
} from "@/features/questionnaires/types";
import { Button, ErrorMessage, Field, LoadingState, Notice, PageHeader, Panel } from "@/shared/ui";

const SESSION_KEY = "candidate-session";

export default function QuestionnairePage() {
  const router = useRouter();
  const [session, setSession] = useState<QuestionnaireSession | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [clave, setClave] = useState("");
  const [data, setData] = useState<QuestionnaireResponse | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [error, setError] = useState<unknown>(null);
  const access = useQuestionnaireAccess();
  const start = useStartQuestionnaire();
  const save = useSavePartialAnswers();
  const finish = useFinishQuestionnaireBlock();
  const busy = access.isPending || start.isPending || save.isPending || finish.isPending;

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      router.replace("/login/candidato");
      return;
    }
    try {
      setSession(JSON.parse(raw) as QuestionnaireSession);
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      router.replace("/login/candidato");
    } finally {
      setSessionLoaded(true);
    }
  }, [router]);

  const savedAnswers = useMemo(() => {
    const saved: Record<number, number> = {};
    for (const item of data?.respuestasGuardadas ?? []) {
      saved[item.idPreguntaModelo] = item.idOpcionModelo;
    }
    return saved;
  }, [data]);

  function updateResponse(response: QuestionnaireResponse) {
    setData(response);
    const restored: Record<number, number> = {};
    response.respuestasGuardadas.forEach((item) => {
      restored[item.idPreguntaModelo] = item.idOpcionModelo;
    });
    setAnswers(restored);
    setError(null);
    access.clear();
    start.clear();
    save.clear();
    finish.clear();
  }

  async function enterQuestionnaire(event: FormEvent) {
    event.preventDefault();
    if (!session || !clave.trim()) {
      setError(new Error("Ingresá la clave de ingreso que te compartió el consultor."));
      return;
    }
    setError(null);
    const response = await access.execute({ token: session.token, claveIngreso: clave.trim() });
    if (response) updateResponse(response);
  }

  async function acceptInstructions() {
    if (!session || !data) return;
    setError(null);
    const response = await start.execute({ token: session.token, id: data.idCuestionario });
    if (response) updateResponse(response);
  }

  function cancelInstructions() {
    sessionStorage.removeItem(SESSION_KEY);
    router.replace("/");
  }

  function markedAnswers(): MarkedAnswer[] {
    return Object.entries(answers).map(([idPreguntaModelo, idOpcionModelo]) => ({
      idPreguntaModelo: Number(idPreguntaModelo),
      idOpcionModelo,
    }));
  }

  async function savePartial() {
    if (!session || !data) return;
    setError(null);
    const response = await save.execute({ token: session.token, id: data.idCuestionario, body: { respuestas: markedAnswers() } });
    if (response) updateResponse(response);
  }

  async function finishBlock() {
    if (!session || !data) return;
    setError(null);
    const response = await finish.execute({ token: session.token, id: data.idCuestionario, body: { respuestas: markedAnswers() } });
    if (response) updateResponse(response);
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    router.replace("/login/candidato");
  }

  if (!sessionLoaded) return <LoadingState label="Verificando el acceso…" />;
  if (!session) return <LoadingState label="Volviendo al ingreso…" />;

  if (data?.estado === "COMPLETO") {
    return <>
      <PageHeader eyebrow="CU026 · Cuestionario finalizado" title="Cuestionario completado" description={`Evaluación de ${session.nombreCandidato}`} actions={<Button type="button" variant="secondary" onClick={logout}>Cerrar sesión</Button>} />
      <Panel title="Confirmación">
        <Notice tone="success" title="Operación exitosa">El Cuestionario ha sido completado con éxito.</Notice>
      </Panel>
    </>;
  }

  if (data?.estado === "ACTIVO") {
    return <>
      <PageHeader eyebrow="CU026 · Paso 1" title="Cuestionario – Instrucciones" description={`Candidato: ${session.nombreCandidato}`} actions={<Button type="button" variant="secondary" onClick={logout}>Cerrar sesión</Button>} />
      <Panel title="Instrucciones para realizar el cuestionario">
        <p className="text-sm leading-6 text-slate-700">
          {data.instrucciones ?? "Lea atentamente cada pregunta antes de responder. Debe contestar todas las preguntas de cada bloque para avanzar al siguiente paso."}
        </p>
        <ErrorMessage error={error ?? start.error} />
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" disabled={busy} onClick={acceptInstructions}>{busy ? "Iniciando…" : "Aceptar"}</Button>
          <Button type="button" variant="secondary" disabled={busy} onClick={cancelInstructions}>Cancelar</Button>
        </div>
      </Panel>
    </>;
  }

  const isLastBlock = data?.bloque != null && data?.totalBloques != null && data.bloque >= data.totalBloques;

  return <>
    <PageHeader eyebrow="CU026 · Perfil candidato" title="Cuestionario" description={`Sesión iniciada como ${session.nombreCandidato}.`} actions={<Button type="button" variant="secondary" onClick={logout}>Cerrar sesión</Button>} />
    {!data ? <Panel title="Clave de ingreso" description="Ingresá la clave de 8 caracteres asignada a tu evaluación.">
      <form noValidate onSubmit={enterQuestionnaire} className="grid max-w-xl gap-4">
        <Field label="Clave de ingreso *" uppercase autoComplete="off" value={clave} onChange={(event) => setClave(event.target.value)} />
        <ErrorMessage error={error ?? access.error} />
        <div><Button type="submit" disabled={busy}>{busy ? "Verificando…" : "Abrir cuestionario"}</Button></div>
      </form>
    </Panel> : <Panel title={`Bloque ${data.bloque ?? "—"}${data.totalBloques ? ` de ${data.totalBloques}` : ""}`} description="Respondé todas las preguntas del bloque para avanzar.">
      {data.preguntas.map((question, index) => <fieldset key={question.idPreguntaModelo} className="mb-5 rounded-lg border border-[var(--color-border)] p-4">
        <legend className="px-1 text-xs font-semibold uppercase text-[var(--color-brand)]">Pregunta {question.orden ?? index + 1}</legend>
        <p className="font-semibold">{question.texto}</p>
        {question.descripcion && <p className="mt-1 text-sm text-slate-600">{question.descripcion}</p>}
        <div className="mt-4 grid gap-2">{question.opciones.map((option) => <label key={option.idOpcionModelo} className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm hover:bg-slate-50">
          <input type="radio" name={`question-${question.idPreguntaModelo}`} className="mt-0.5 accent-blue-700" checked={(answers[question.idPreguntaModelo] ?? savedAnswers[question.idPreguntaModelo]) === option.idOpcionModelo} onChange={() => setAnswers((current) => ({ ...current, [question.idPreguntaModelo]: option.idOpcionModelo }))} />
          <span>{option.descripcion}</span>
        </label>)}</div>
      </fieldset>)}
      <ErrorMessage error={error ?? save.error ?? finish.error} />
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="secondary" disabled={busy} onClick={savePartial}>{busy ? "Guardando…" : "Guardar respuestas"}</Button>
        <Button type="button" disabled={busy} onClick={finishBlock}>{busy ? "Enviando…" : isLastBlock ? "Finalizar" : "Siguiente"}</Button>
      </div>
    </Panel>}
  </>;
}
