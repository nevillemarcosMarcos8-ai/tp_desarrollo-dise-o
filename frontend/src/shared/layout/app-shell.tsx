"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { getConsultantSession, logoutConsultant } from "@/features/auth/service";

type NavItem = { label: string; href: string; logout?: boolean };

const consultantItems: NavItem[] = [
  { label: "Inicio consultor", href: "/consultor" },
  { label: "Gestionar puestos", href: "/puestos" },
  { label: "Gestionar candidatos", href: "/candidatos" },
  { label: "Evaluar candidatos", href: "/evaluaciones/nueva" },
  { label: "Reporte comparativo", href: "/reportes/comparativo" },
  { label: "Exportar resultados", href: "/exportar-resultados" },
  { label: "Orden de mérito", href: "/reportes/puestos" },
  { label: "Gestionar preguntas", href: "/administracion/preguntas" },
  { label: "Gestionar opciones de respuesta", href: "/administracion/opciones-respuesta" },
  { label: "Gestionar factores", href: "/administracion/factores" },
  { label: "Gestionar competencias", href: "/administracion/competencias" },
  { label: "Gestionar empresas", href: "/administracion/empresas" },
  { label: "Cerrar sesión", href: "/", logout: true },
];

const candidateItems: NavItem[] = [
  { label: "Cuestionario", href: "/cuestionario" },
  { label: "Cerrar sesión", href: "/", logout: true },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [consultantName, setConsultantName] = useState("");
  const [consultantSessionReady, setConsultantSessionReady] = useState(false);
  const isCandidateFlow = pathname === "/cuestionario" || pathname.startsWith("/cuestionario/");
  const consultantPrefixes = ["/consultor", "/candidatos", "/administracion", "/puestos", "/evaluaciones", "/reportes", "/exportar-resultados", "/importar-candidatos"];
  const isConsultantFlow = consultantPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const navItems = isCandidateFlow ? candidateItems : isConsultantFlow ? consultantItems : [{ label: "Inicio", href: "/" }];

  useEffect(() => {
    if (!isConsultantFlow) return;

    let active = true;
    setConsultantSessionReady(false);
    getConsultantSession()
      .then((session) => {
        if (!active) return;
        setConsultantName(session.nombreConsultor);
        sessionStorage.setItem("consultant-name", session.nombreConsultor);
        setConsultantSessionReady(true);
      })
      .catch(() => {
        if (!active) return;
        sessionStorage.removeItem("consultant-name");
        router.replace("/login/consultor");
      });

    return () => {
      active = false;
    };
  }, [isConsultantFlow, pathname, router]);

  async function closeSession() {
    if (isCandidateFlow) {
      sessionStorage.removeItem("candidate-session");
    } else {
      try {
        await logoutConsultant();
      } catch {
        // Se limpia el estado del navegador aunque el backend no responda.
      }
      sessionStorage.removeItem("consultant-name");
      setConsultantName("");
      setConsultantSessionReady(false);
    }
    router.replace("/");
  }

  if (isConsultantFlow && !consultantSessionReady) {
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <p role="status" className="text-sm text-slate-600">
          Verificando el ingreso de consultor…
        </p>
      </main>
    );
  }

  return <div className="min-h-screen lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
    <aside className="border-b border-[var(--color-border)] bg-white px-5 py-5 print:hidden lg:min-h-screen lg:border-b-0 lg:border-r">
      <Link href="/" className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-[var(--color-brand)] text-lg font-bold text-white">M</span>
        <span><strong className="block text-lg">miApp</strong><small className="text-slate-500">{isCandidateFlow ? "Perfil candidato" : isConsultantFlow ? consultantName || "Perfil consultor" : "Seleccionar perfil"}</small></span>
      </Link>
      <nav aria-label="Navegación principal" className="mt-7">
        <ul className="grid gap-1">
          {navItems.map((item) => {
            const active = item.href !== "/" && (pathname === item.href || pathname.startsWith(`${item.href}/`));
            return <li key={item.href}>
              <Link
                href={item.href}
                onClick={item.logout ? (event) => {
                  event.preventDefault();
                  void closeSession();
                } : undefined}
                aria-current={active ? "page" : undefined}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${item.logout ? "mt-5 border-t border-[var(--color-border)] pt-4 text-red-700 hover:bg-red-50" : active ? "bg-[var(--color-brand-soft)] text-[var(--color-brand)]" : "text-slate-700 hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]"}`}
              >{item.label}</Link>
            </li>;
          })}
        </ul>
      </nav>
    </aside>
    <main className="min-w-0 px-4 py-6 print:px-0 print:py-0 sm:px-7 lg:px-10 lg:py-9">{children}</main>
  </div>;
}
