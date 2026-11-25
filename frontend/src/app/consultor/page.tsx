import Link from "next/link";
import { PageHeader, Panel, StatusBadge } from "@/shared/ui";

const tasks = [
  { title: "Gestionar puestos", description: "Buscar puestos y dar de alta, modificar o dar de baja.", href: "/puestos", state: "Conectado" },
  { title: "Gestionar candidatos", description: "Buscar, crear, modificar y dar de baja candidatos.", href: "/candidatos", state: "Conectado" },
  { title: "Evaluar candidatos", description: "Seleccionar candidatos y puestos para generar cuestionarios de evaluación.", href: "/evaluaciones/nueva", state: "Conectado" },
  { title: "Emitir reporte comparativo", description: "Comparar los valores requeridos de un puesto con los obtenidos por un candidato.", href: "/reportes/comparativo", state: "Conectado" },
  { title: "Exportar resultados", description: "Elegir puesto y filtros para preparar el archivo de resultados.", href: "/exportar-resultados", state: "Falta endpoint" },
  { title: "Emitir orden de mérito", description: "Consultar evaluaciones por puesto y abrir su orden de mérito.", href: "/reportes/puestos", state: "Conectado" },
  { title: "Gestionar preguntas", description: "Buscar preguntas y dar de alta, modificar o dar de baja.", href: "/administracion/preguntas", state: "Conectado" },
  { title: "Gestionar opciones de respuesta", description: "Crear, modificar y eliminar opciones y sus detalles de respuesta.", href: "/administracion/opciones-respuesta", state: "Conectado" },
  { title: "Gestionar factores", description: "Administrar factores asociados a competencias.", href: "/administracion/factores", state: "Conectado" },
  { title: "Gestionar competencias", description: "Administrar el catálogo de competencias.", href: "/administracion/competencias", state: "Conectado" },
  { title: "Gestionar empresas", description: "Buscar, crear y modificar empresas. La baja no tiene endpoint.", href: "/administracion/empresas", state: "Parcial" },
];

export default function ConsultantHomePage() {
  return <>
    <PageHeader eyebrow="Perfil consultor · CU001" title="Casos de uso" description="Elegí qué tarea querés realizar. La autenticación se omite para este prototipo; cada pantalla informa el estado real de su integración." />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{tasks.map((task) => <Link key={task.href} href={task.href} className="rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-3"><h2 className="font-semibold">{task.title}</h2><StatusBadge tone={task.state === "Conectado" ? "success" : task.state === "Parcial" ? "warning" : "danger"}>{task.state}</StatusBadge></div>
      <p className="text-sm leading-6 text-slate-600">{task.description}</p><span className="mt-4 inline-block text-sm font-semibold text-[var(--color-brand)]">Abrir caso de uso →</span>
    </Link>)}</div>
    <Panel title="Qué significa el estado" className="mt-6"><p className="text-sm leading-6 text-slate-600"><strong>Conectado:</strong> la pantalla usa endpoints existentes. <strong>Parcial:</strong> permite probar las operaciones disponibles y señala la faltante. <strong>Falta endpoint:</strong> se muestra el flujo, pero la pantalla no inventa una respuesta ni confirma una operación que el backend no puede realizar.</p></Panel>
  </>;
}
