"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useCreateQuestion, useUpdateQuestion } from "@/features/questions/hooks";
import type { Question, CreateQuestionRequest, UpdateQuestionRequest } from "@/features/questions/types";
import { useCompetencies } from "@/features/competencies/hooks";
import type { Competency } from "@/features/competencies/types";
import { useFactors } from "@/features/factors/hooks";
import type { Factor } from "@/features/factors/types";
import { useAnswerOptions } from "@/features/answer-options/hooks";
import type { AnswerOption } from "@/features/answer-options/types";
import { Button, ErrorMessage, Field, LoadingState, Notice, PageHeader, Panel, SelectField, TextAreaField, ValidationSummary } from "@/shared/ui";

type EditorMode = "create" | "update";
type FormValues = { competenciaId: string; factorId: string; nombre: string; textoPregunta: string; descripcion: string; opcionId: string };
const emptyForm: FormValues = { competenciaId: "", factorId: "", nombre: "", textoPregunta: "", descripcion: "", opcionId: "" };

export function QuestionEditor({ mode, question }: { mode: EditorMode; question?: Question }) {
  const router = useRouter();
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [options, setOptions] = useState<AnswerOption[]>([]);
  const [loadingReferences, setLoadingReferences] = useState(true);
  const [form, setForm] = useState<FormValues>(() => question ? {
    competenciaId: String(question.factor?.competencia?.id ?? ""),
    factorId: String(question.factor?.id ?? ""),
    nombre: question.name,
    textoPregunta: question.textoPregunta,
    descripcion: question.descripcion ?? "",
    opcionId: String(question.opcionRespuesta?.id ?? ""),
  } : emptyForm);
  const [weights, setWeights] = useState<Record<number, string>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showAiNotice, setShowAiNotice] = useState(false);
  const [createdName, setCreatedName] = useState<string | null>(null);
  const [updateDone, setUpdateDone] = useState(false);
  const competencyList = useCompetencies();
  const factorList = useFactors();
  const optionList = useAnswerOptions();
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();

  useEffect(() => {
    let mounted = true;
    async function load() {
      const [competencyRows, factorRows, optionRows] = await Promise.all([
        competencyList.execute(undefined),
        factorList.execute(undefined),
        optionList.execute(undefined),
      ]);
      if (mounted && competencyRows) setCompetencies(competencyRows);
      if (mounted && factorRows) setFactors(factorRows);
      if (mounted && optionRows) setOptions(optionRows);
      if (mounted) setLoadingReferences(false);
    }
    void load();
    return () => { mounted = false; };
  }, [competencyList.execute, factorList.execute, optionList.execute]);

  const selectedOption = useMemo(() => {
    const selectedId = Number(form.opcionId);
    return options.find((option) => option.id === selectedId)
      ?? (question?.opcionRespuesta?.id === selectedId ? question.opcionRespuesta : undefined);
  }, [form.opcionId, options, question]);
  const selectableOptions = useMemo(() => {
    if (question?.opcionRespuesta && !options.some((option) => option.id === question.opcionRespuesta?.id)) {
      return [question.opcionRespuesta, ...options];
    }
    return options;
  }, [options, question]);
  const optionChanged = !!question && Number(form.opcionId) !== question.opcionRespuesta?.id;
  const needsWeights = mode === "create" || optionChanged;
  const activeFactors = factors.filter((factor) =>
    factor.estaActivo && factor.competenciaId === Number(form.competenciaId));

  function updateText(key: "nombre" | "textoPregunta" | "descripcion", value: string) {
    setForm((current) => ({ ...current, [key]: value.toLocaleUpperCase("es-AR") }));
    setValidationErrors([]);
  }

  function validate(): string[] {
    const errors: string[] = [];
    if (mode === "create" && !form.competenciaId) errors.push("Seleccioná una competencia.");
    if (mode === "create" && !form.factorId) errors.push("Seleccioná un factor.");
    if (!form.nombre.trim()) errors.push("Ingresá el nombre de la pregunta.");
    if (!form.textoPregunta.trim()) errors.push("Ingresá el texto de la pregunta.");
    if (!form.opcionId) errors.push("Seleccioná una opción de respuesta.");
    if (form.nombre.length > 100) errors.push("El nombre no puede superar los 100 caracteres.");
    if (form.textoPregunta.length > 1000) errors.push("El texto no puede superar los 1000 caracteres.");
    if (form.descripcion.length > 500) errors.push("La descripción no puede superar los 500 caracteres.");
    if (needsWeights) {
      const details = selectedOption?.detalles ?? [];
      if (details.length === 0) errors.push("La opción seleccionada no tiene detalles de respuesta para ponderar.");
      if (details.some((detail) => weights[detail.id] === undefined || weights[detail.id] === "")) {
        errors.push("Ingresá una ponderación para cada detalle de la opción.");
      }
      if (details.some((detail) => Number(weights[detail.id]) < 0)) {
        errors.push("Las ponderaciones no pueden ser negativas.");
      }
      const total = details.reduce((sum, detail) => sum + Number(weights[detail.id] || 0), 0);
      const roundedTotal = Math.round(total * 1_000_000) / 1_000_000;
      if (details.length > 0 && roundedTotal !== 10) errors.push(`Las ponderaciones deben sumar 10. Actualmente suman ${roundedTotal}.`);
    }
    if (mode === "update" && question?.descripcion && !form.descripcion.trim()) {
      errors.push("El backend no permite borrar la descripción con la operación de modificación. Dejala como está o pedí ese cambio al backend.");
    }
    if (mode === "update") {
      const changed = form.nombre !== question?.name
        || form.textoPregunta !== question?.textoPregunta
        || form.descripcion !== (question?.descripcion ?? "")
        || optionChanged;
      if (!changed) errors.push("Modificá al menos un dato antes de guardar.");
    }
    return errors;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setValidationErrors([]);
    const errors = validate();
    if (errors.length) { setValidationErrors(errors); return; }

    if (mode === "create") {
      const body: CreateQuestionRequest = {
        competenciaId: Number(form.competenciaId),
        idFactor: Number(form.factorId),
        nombre: form.nombre.trim(),
        textoPregunta: form.textoPregunta.trim(),
        descripcion: form.descripcion.trim() || null,
        idOpcionRespuesta: Number(form.opcionId),
        ponderaciones: (selectedOption?.detalles ?? []).map((detail) => ({
          detalleOpcionRespuestaId: detail.id,
          ponderacion: Number(weights[detail.id]),
        })),
      };
      const created = await createQuestion.execute(body);
      if (created) setCreatedName(created.name);
      return;
    }

    if (!question) return;
    const body: UpdateQuestionRequest = {
      nombre: form.nombre.trim(),
      textoPregunta: form.textoPregunta.trim(),
      ...(form.descripcion.trim() !== (question.descripcion ?? "") && form.descripcion.trim()
        ? { descripcion: form.descripcion.trim() }
        : {}),
      ...(optionChanged ? {
        idOpcionRespuesta: Number(form.opcionId),
        ponderaciones: (selectedOption?.detalles ?? []).map((detail) => ({
          detalleOpcionRespuestaId: detail.id,
          ponderacion: Number(weights[detail.id]),
        })),
      } : {}),
    };
    const updated = await updateQuestion.execute({ id: question.id, body });
    if (updated) setUpdateDone(true);
  }

  function createAnother() {
    setCreatedName(null);
    setForm(emptyForm);
    setWeights({});
    createQuestion.clear();
  }

  const isUpdate = mode === "update";
  const title = isUpdate ? "Modificar pregunta" : "Dar de alta pregunta";

  if (isUpdate && !question) return <LoadingState label="Cargando la pregunta…" />;
  if (createdName) return <>
    <PageHeader eyebrow="CU021 · Alta" title="Pregunta creada" description={`La pregunta “${createdName}” se creó correctamente.`} actions={<Button variant="secondary" onClick={() => router.push("/consultor")}>Salir</Button>} />
    <Panel title="¿Deseás cargar otra pregunta?" description="Elegí cómo continuar.">
      <div className="flex flex-wrap gap-3"><Button onClick={createAnother}>Sí, cargar otra</Button><Button variant="secondary" onClick={() => router.push("/administracion/preguntas")}>No, volver a gestión</Button></div>
    </Panel>
  </>;
  if (updateDone) return <>
    <PageHeader eyebrow="CU022 · Modificación" title="Pregunta modificada" description="La operación ha culminado con éxito." actions={<Button variant="secondary" onClick={() => router.push("/consultor")}>Salir</Button>} />
    <Panel title="Cambios guardados"><Notice tone="success">La operación ha culminado con éxito.</Notice><Button onClick={() => router.push("/administracion/preguntas")}>Volver a gestionar preguntas</Button></Panel>
  </>;

  return <>
    <PageHeader eyebrow={isUpdate ? "CU022 · Modificación" : "CU021 · Alta"} title={title} description={isUpdate ? "Competencia y factor son de solo lectura. Modificá los demás datos y confirmá." : "Completá los datos y asociá una ponderación a cada detalle de la opción de respuesta."} actions={<Button variant="secondary" onClick={() => router.push("/consultor")}>Salir</Button>} />
    <Panel title={title} description="Los textos literales se guardan en mayúsculas, según el caso de uso.">
      {loadingReferences ? <LoadingState label="Cargando competencias, factores y opciones…" /> : <form noValidate className="grid gap-5" onSubmit={submit}>
        <ErrorMessage error={competencyList.error} />
        <ErrorMessage error={factorList.error} />
        <ErrorMessage error={optionList.error} />
        {isUpdate ? <div className="grid gap-4 sm:grid-cols-2"><Field label="Competencia (solo lectura)" readOnly value={question?.factor?.competencia?.nombre ?? ""} /><Field label="Factor (solo lectura)" readOnly value={question?.factor?.nombre ?? ""} /></div> : <div className="grid gap-4 sm:grid-cols-2"><SelectField label="Competencia *" value={form.competenciaId} onChange={(event) => { setForm({ ...form, competenciaId: event.target.value, factorId: "" }); setValidationErrors([]); }}><option value="">Seleccionar…</option>{competencies.filter((item) => item.estaActivo).map((item) => <option value={item.id} key={item.id}>{item.nombre}</option>)}</SelectField><SelectField label="Factor *" value={form.factorId} disabled={!form.competenciaId} onChange={(event) => { setForm({ ...form, factorId: event.target.value }); setValidationErrors([]); }}><option value="">Seleccionar…</option>{activeFactors.map((item) => <option value={item.id} key={item.id}>{item.nombre}</option>)}</SelectField></div>}
        <Field label="Nombre de pregunta *" value={form.nombre} onChange={(event) => updateText("nombre", event.target.value)} />
        <TextAreaField label="Pregunta *" value={form.textoPregunta} onChange={(event) => updateText("textoPregunta", event.target.value)} />
        <TextAreaField label="Descripción (opcional)" value={form.descripcion} onChange={(event) => updateText("descripcion", event.target.value)} />
        <SelectField label="Opción de respuesta *" value={form.opcionId} onChange={(event) => { setForm({ ...form, opcionId: event.target.value }); setWeights({}); setValidationErrors([]); }}><option value="">Seleccionar…</option>{selectableOptions.map((item) => <option value={item.id} key={item.id}>{item.nombre}</option>)}</SelectField>
        {needsWeights && selectedOption && <div className="rounded-lg border border-[var(--color-border)]"><div className="border-b border-[var(--color-border)] bg-slate-50 px-4 py-3"><h3 className="text-sm font-semibold">Ponderaciones de “{selectedOption.nombre}”</h3><p className="mt-1 text-xs text-slate-500">La suma debe ser exactamente 10. El orden y la descripción vienen de la opción y no se editan acá.</p></div><div className="grid gap-3 p-4">{(selectedOption.detalles ?? []).map((detail) => <div key={detail.id} className="grid items-center gap-3 sm:grid-cols-[70px_1fr_150px]"><span className="text-sm text-slate-500">Orden {detail.ordenVisualizacion}</span><span className="text-sm">{detail.descripcion}</span><Field aria-label={`Ponderación para ${detail.descripcion}`} label="Ponderación" type="number" min="0" step="any" value={weights[detail.id] ?? ""} onChange={(event) => { setWeights({ ...weights, [detail.id]: event.target.value }); setValidationErrors([]); }} /></div>)}</div></div>}
        {isUpdate && <Notice tone="info">La modificación puede cambiar el nombre, texto, descripción y opción. Si cambiás la opción, tenés que ponderar todos sus detalles y sumar 10. La API actual no permite borrar una descripción existente con un valor vacío.</Notice>}
        {showAiNotice && <Notice tone="warning" title="Generación con IA no disponible">El CU033 todavía no tiene endpoint en el backend. Podés completar la pregunta manualmente.</Notice>}
        <ValidationSummary errors={validationErrors} />
        <ErrorMessage error={createQuestion.error} />
        <ErrorMessage error={updateQuestion.error} />
        {(createQuestion.success || updateQuestion.success) && <Notice tone="success">{createQuestion.success || updateQuestion.success}</Notice>}
        <div className="flex flex-wrap justify-between gap-3"><div className="flex flex-wrap gap-2">{!isUpdate && <Button type="button" variant="secondary" onClick={() => setShowAiNotice(true)}>Generar con IA</Button>}<Button type="button" variant="secondary" onClick={() => router.push("/administracion/preguntas")}>Cancelar</Button></div><Button type="submit" disabled={createQuestion.isPending || updateQuestion.isPending}>{createQuestion.isPending || updateQuestion.isPending ? "Guardando…" : "Aceptar"}</Button></div>
        <p className="text-xs text-slate-500">CU021 · Enter confirma el botón principal. Shift+Tab permite volver al campo anterior.</p>
      </form>}
    </Panel>
  </>;
}
