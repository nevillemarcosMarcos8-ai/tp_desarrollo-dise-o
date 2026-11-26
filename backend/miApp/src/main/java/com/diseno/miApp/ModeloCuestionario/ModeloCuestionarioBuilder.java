package com.diseno.miApp.ModeloCuestionario;

import com.diseno.miApp.Puesto.Puesto;

/** Contrato de construcción paso a paso del snapshot del cuestionario. */
public interface ModeloCuestionarioBuilder {
    ModeloCuestionarioBuilder iniciar(Puesto puesto);

    ModeloCuestionarioBuilder copiarCompetenciasYPonderaciones();

    ModeloCuestionarioBuilder agregarPreguntasYOpciones();

    ModeloCuestionarioBuilder asignarOrdenYBloques();

    ModeloCuestionario build();
}
