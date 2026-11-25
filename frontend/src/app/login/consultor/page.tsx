"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useConsultantLogin } from "@/features/auth/hooks";
import {
  Button,
  ErrorMessage,
  Field,
  PageHeader,
  Panel,
  ValidationSummary,
} from "@/shared/ui";

export default function ConsultantLoginPage() {
  const router = useRouter();
  const login = useConsultantLogin();
  const [nombre, setNombre] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const nombreIngresado = nombre.trim();
    const nextErrors = nombreIngresado
      ? []
      : ["Ingresá tu nombre para continuar."];
    setErrors(nextErrors);
    if (nextErrors.length) return;

    const session = await login.execute({ nombre: nombreIngresado });
    if (!session) return;

    sessionStorage.setItem("consultant-name", session.nombreConsultor);
    router.push("/consultor");
  }

  return (
    <>
      <PageHeader
        eyebrow="Ingreso de consultor"
        title="¿Cómo te llamás?"
        description="Ingresá tu nombre. Si es la primera vez, el sistema creará tu registro automáticamente."
      />
      <Panel title="Identificación del consultor">
        <form noValidate onSubmit={submit} className="grid max-w-xl gap-4">
          <Field
            label="Nombre *"
            autoComplete="name"
            maxLength={100}
            value={nombre}
            onChange={(event) => {
              setNombre(event.target.value);
              setErrors([]);
            }}
            placeholder="Ingresá tu nombre"
          />
          <ValidationSummary errors={errors} />
          <ErrorMessage error={login.error} />
          <Button disabled={login.isPending}>
            {login.isPending ? "Ingresando…" : "Continuar"}
          </Button>
        </form>
      </Panel>
    </>
  );
}
