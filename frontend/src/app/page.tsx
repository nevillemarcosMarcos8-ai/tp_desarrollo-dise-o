import Link from "next/link";
import { PageHeader, Panel } from "@/shared/ui";

const roles = [
  { title: "Ingresar como consultor", description: "Administrar puestos, candidatos, preguntas, competencias, factores, empresas y reportes.", href: "/login/consultor", action: "Continuar como consultor" },
  { title: "Realizar cuestionario", description: "Iniciar sesión como candidato, ingresar la clave recibida y responder el cuestionario asignado.", href: "/login/candidato", action: "Ingresar como candidato" },
];

export default function HomePage() {
  return <>
    <PageHeader eyebrow="miApp · Selección de perfil" title="¿Cómo querés ingresar?" description="El consultor ingresa con su nombre. El candidato usa su documento y contraseña antes de ingresar la clave del cuestionario." />
    <div className="grid gap-5 md:grid-cols-2">{roles.map((role) => <Panel key={role.href} title={role.title} description={role.description}>
      <Link className="mt-2 inline-flex min-h-10 items-center rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-brand-dark)]" href={role.href}>{role.action} →</Link>
    </Panel>)}</div>
  </>;
}
