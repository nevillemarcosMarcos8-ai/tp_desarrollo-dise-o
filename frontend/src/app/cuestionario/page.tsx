"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQuestionnaireAccess, useFinishQuestionnaireBlock, useSavePartialAnswers } from "@/features/questionnaires/hooks";
import type {
  QuestionnaireAnswer as MarkedAnswer,
  Questionnaire as QuestionnaireResponse,
  QuestionnaireSession,
} from "@/features/questionnaires/types";
import { Button, ErrorMessage, Field, LoadingState, PageHeader, Panel } from "@/shared/ui";

const SESSION_KEY = "candidate-session";

export default function QuestionnairePage() {
  const router = useRouter();
  const [session, setSession] = useState<QuestionnaireSession | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [clave, setClave] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);
  const [data, setData] = useState<QuestionnaireResponse | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [error, setError] = useState<unknown>(null);
  const access = useQuestionnaireAccess();
  const save = useSavePartialAnswers();
  const finish = useFinishQuestionnaireBlock();
  const busy = access.isPending || save.isPending || finish.isPending;

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
  }

  async function enterQuestionnaire(event: FormEvent) {
    event.preventDefault();
    if (!session || !clave.trim()) {
      setError(new Error("Ingresá la clave de ingreso que te compartió el consultor."));
      return;
    }
    setError(null);
    access.clear();
    setShowInstructions(true);
  }

  async function acceptInstructions() {
    if (!session) return;
    setError(null);
    const response = await access.execute({ token: session.token, claveIngreso: clave.trim() });
    if (response) updateResponse(response);
    else setShowInstructions(false);
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
      <PageHeader eyebrow="Cuestionario finalizado" title="Gracias por responder" description={`Evaluación de ${session.nombreCandidato}`} actions={<Button variant="secondary" onClick={logout}>Cerrar sesión</Button>} />
      <Panel title="Resultado registrado">
        <p className="text-sm">Puntaje final: <strong>{data.puntajeFinal ?? "—"}</strong></p>
        <p className="mt-2 text-sm">Ponderación mínima: <strong>{data.cumplePonderacionMinima ? "Cumplida" : "No cumplida"}</strong></p>
      </Panel>
    </>;
  }

  return <>
    <PageHeader eyebrow="Perfil candidato" title="Realizar cuestionario" description={`Sesión iniciada como ${session.nombreCandidato}. Ingresá la clave y revisá las instrucciones antes de iniciar.`} actions={<Button variant="secondary" onClick={logout}>Cerrar sesión</Button>} />
    {!data && !showInstructions ? <Panel title="Clave de ingreso" description="La clave corresponde al cuestionario asignado a tu candidatura. Se validará cuando aceptes iniciar.">
      <form noValidate onSubmit={enterQuestionnaire} className="grid max-w-xl gap-4">
        <Field label="Clave de ingreso *" autoComplete="off" value={clave} onChange={(event) => setClave(event.target.value)} />
        <ErrorMessage error={error ?? access.error} />
        <Button disabled={busy}>{busy ? "Continuando…" : "Continuar a instrucciones"}</Button>
      </form>
    </Panel> : !data ? <Panel title="Instrucciones del cuestionario" description="Leé estas indicaciones antes de comenzar.">
      <div className="max-w-2xl space-y-3 text-sm text-slate-700">
        <p>Respondé cada pregunta seleccionando la opción que mejor describa tu situación.</p>
        <p>Podés guardar tus respuestas y continuar después mientras el cuestionario siga habilitado.</p>
        <p>Al finalizar el bloque, tus respuestas quedan registradas para esta evaluación.</p>
      </div>
      <ErrorMessage error={error ?? access.error} />
      <div className="mt-5 flex flex-wrap gap-3">
        <Button disabled={busy} onClick={() => void acceptInstructions()}>{busy ? "Abriendo…" : "Aceptar e iniciar"}</Button>
        <Button variant="secondary" disabled={busy} onClick={() => { setShowInstructions(false); setError(null); access.clear(); }}>Cancelar</Button>
      </div>
    </Panel> : <Panel title={`Bloque ${data.bloque ?? "—"}`} description="Tus respuestas se guardan contra la versión asignada a esta evaluación.">
      {data.preguntas.map((question, index) => <fieldset key={question.idPreguntaModelo} className="mb-5 rounded-lg border border-[var(--color-border)] p-4">
        <legend className="px-1 text-xs font-semibold uppercase text-[var(--color-brand)]">Pregunta {index + 1}</legend>
        <p className="font-semibold">{question.texto}</p>
        {question.descripcion && <p className="mt-1 text-sm text-slate-600">{question.descripcion}</p>}
        <div className="mt-4 grid gap-2">{question.opciones.map((option) => <label key={option.idOpcionModelo} className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm hover:bg-slate-50">
          <input type="radio" name={`question-${question.idPreguntaModelo}`} className="mt-0.5 accent-blue-700" checked={(answers[question.idPreguntaModelo] ?? savedAnswers[question.idPreguntaModelo]) === option.idOpcionModelo} onChange={() => setAnswers((current) => ({ ...current, [question.idPreguntaModelo]: option.idOpcionModelo }))} />
          <span>{option.descripcion}</span>
        </label>)}</div>
      </fieldset>)}
      <ErrorMessage error={error ?? save.error} />
      <ErrorMessage error={finish.error} />
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" disabled={busy} onClick={savePartial}>{busy ? "Guardando…" : "Guardar respuestas"}</Button>
        <Button disabled={busy} onClick={finishBlock}>{busy ? "Enviando…" : "Finalizar bloque"}</Button>
      </div>
    </Panel>}
  </>;
}
