package com.diseno.miApp.EstadoCuestionario;

import static com.diseno.miApp.helpers.ManejoErroresHelper.errorConflicto;

/** Comportamiento común de estados desde los que no se permiten transiciones. */
public abstract class EstadoCuestionarioTerminalBehavior
        implements EstadoCuestionarioBehavior {
    @Override
    public EstadoCuestionario transicionar(AccionEstadoCuestionario accion) {
        throw errorConflicto(
                "No se puede realizar la acción " + accion
                        + " cuando el cuestionario está " + estado());
    }
}
