import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return <header className="mb-7 flex flex-col gap-4 border-b border-[var(--color-border)] pb-6 sm:flex-row sm:items-end sm:justify-between"><div>{eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-[var(--color-brand)]">{eyebrow}</p>}<h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>{description && <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">{description}</p>}</div>{actions}</header>;
}

export function Panel({ title, description, actions, children, className = "" }: { title?: ReactNode; description?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:p-6 ${className}`}><div className="mb-4 flex flex-wrap items-start justify-between gap-3">{(title || description) && <div>{title && <h2 className="font-semibold">{title}</h2>}{description && <p className="mt-1 text-sm text-[var(--color-muted)]">{description}</p>}</div>}{actions}</div>{children}</section>;
}

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
const buttonStyles: Record<ButtonVariant, string> = {
  primary: "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-dark)]",
  secondary: "border border-[var(--color-border)] bg-white text-slate-700 hover:bg-slate-50",
  danger: "bg-red-700 text-white hover:bg-red-800",
  ghost: "text-[var(--color-brand)] hover:bg-[var(--color-brand-soft)]",
};
export function Button({ variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={`inline-flex min-h-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition ${buttonStyles[variant]} ${className}`} {...props} />;
}

const fieldClass = "mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
export function Field({ label, hint, className = "", uppercase = false, onChange, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; uppercase?: boolean }) {
  return <label className={`block text-sm font-medium text-slate-700 ${className}`}>{label}<input className={`${fieldClass} ${uppercase ? "uppercase placeholder:normal-case" : ""}`} onChange={uppercase && onChange ? (event) => { event.target.value = event.target.value.toUpperCase(); onChange(event); } : onChange} {...props} />{hint && <small className="mt-1 block text-xs font-normal text-slate-500">{hint}</small>}</label>;
}
export function SelectField({ label, children, className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  return <label className={`block text-sm font-medium text-slate-700 ${className}`}>{label}<select className={fieldClass} {...props}>{children}</select></label>;
}
export function TextAreaField({ label, className = "", uppercase = false, onChange, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; uppercase?: boolean }) {
  return <label className={`block text-sm font-medium text-slate-700 ${className}`}>{label}<textarea className={`${fieldClass} min-h-24 resize-y ${uppercase ? "uppercase placeholder:normal-case" : ""}`} onChange={uppercase && onChange ? (event) => { event.target.value = event.target.value.toUpperCase(); onChange(event); } : onChange} {...props} /></label>;
}

type NoticeTone = "info" | "success" | "warning" | "error";
const noticeStyles: Record<NoticeTone, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-900",
  success: "border-green-200 bg-green-50 text-green-900",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  error: "border-red-200 bg-red-50 text-red-900",
};
export function Notice({ tone = "info", title, children, onDismiss }: { tone?: NoticeTone; title?: string; children: ReactNode; onDismiss?: () => void }) {
  return <div role={tone === "error" ? "alert" : "status"} className={`my-4 rounded-lg border p-4 text-sm ${noticeStyles[tone]}`}><div className="flex items-start justify-between gap-3"><div>{title && <strong className="mb-1 block">{title}</strong>}<div className="leading-6">{children}</div></div>{onDismiss && <button onClick={onDismiss} className="text-lg leading-none" aria-label="Cerrar aviso">×</button>}</div></div>;
}

export function ValidationSummary({ errors, title = "Revisá estos datos" }: { errors: string[]; title?: string }) {
  if (!errors.length) return null;
  return <Notice tone="error" title={title}><ul className="list-inside list-disc">{errors.map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}</ul></Notice>;
}

export function CreateAnotherPrompt({ title, description, question, affirmativeLabel, finishLabel, onCreateAnother, onFinish }: { title: string; description: string; question: string; affirmativeLabel: string; finishLabel: string; onCreateAnother: () => void; onFinish: () => void }) {
  return <>
    <PageHeader eyebrow="Alta completada" title={title} description={description} />
    <Panel title={question}>
      <div className="flex flex-wrap gap-2"><Button onClick={onCreateAnother}>{affirmativeLabel}</Button><Button variant="secondary" onClick={onFinish}>{finishLabel}</Button></div>
    </Panel>
  </>;
}

export function LoadingState({ label = "Cargando datos…" }: { label?: string }) { return <div className="py-8 text-center text-sm text-slate-500" role="status">{label}</div>; }
export function EmptyState({ title = "No hay resultados", children }: { title?: string; children?: ReactNode }) { return <div className="rounded-lg border border-dashed border-[var(--color-border)] px-5 py-8 text-center"><p className="font-semibold text-slate-700">{title}</p>{children && <p className="mt-1 text-sm text-slate-500">{children}</p>}</div>; }
export function StatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" }) {
  const styles = { neutral: "bg-slate-100 text-slate-700", success: "bg-green-100 text-green-800", warning: "bg-amber-100 text-amber-900", danger: "bg-red-100 text-red-800" };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[tone]}`}>{children}</span>;
}

export type TableColumn<T> = { key: string; header: string; render: (row: T) => ReactNode; className?: string };
export function DataTable<T>({ rows, columns, rowKey, emptyTitle, emptyDescription }: { rows: T[]; columns: TableColumn<T>[]; rowKey: (row: T) => string | number; emptyTitle?: string; emptyDescription?: string }) {
  if (!rows.length) return <EmptyState title={emptyTitle}>{emptyDescription}</EmptyState>;
  return <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]"><table className="min-w-full divide-y divide-slate-200 text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{columns.map((column) => <th className={`px-4 py-3 font-semibold ${column.className ?? ""}`} key={column.key}>{column.header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 bg-white">{rows.map((row) => <tr key={rowKey(row)} className="align-top hover:bg-slate-50/70">{columns.map((column) => <td className={`px-4 py-3 text-slate-700 ${column.className ?? ""}`} key={column.key}>{column.render(row)}</td>)}</tr>)}</tbody></table></div>;
}

export function ErrorMessage({ error }: { error: unknown }) {
  if (!error) return null;
  const message = error instanceof Error ? error.message : "Ocurrió un error inesperado.";
  const fieldErrors = error && typeof error === "object" && "fieldErrors" in error && Array.isArray(error.fieldErrors) ? error.fieldErrors as Array<{ campo: string; mensaje: string }> : [];
  return <Notice tone="error" title="No se pudo completar la operación">{message}{fieldErrors.length > 0 && <ul className="mt-2 list-inside list-disc">{fieldErrors.map((item, index) => <li key={`${item.campo}-${index}`}><strong>{item.campo}:</strong> {item.mensaje}</li>)}</ul>}</Notice>;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("es-AR");
}
