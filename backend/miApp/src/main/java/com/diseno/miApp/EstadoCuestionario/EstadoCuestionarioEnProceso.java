package com.diseno.miApp.EstadoCuestionario;

import org.springframework.stereotype.Component;

import static com.diseno.miApp.helpers.ManejoErroresHelper.errorConflicto;

@Component
public class EstadoCuestionarioEnProceso implements EstadoCuestionarioBehavior {
    @Override
    public EstadoCuestionario estado() {
        return EstadoCuestionario.EN_PROCESO;
    }

    @Override
    public EstadoCuestionario transicionar(AccionEstadoCuestionario accion) {
        return switch (accion) {
            case COMPLETAR -> EstadoCuestionario.COMPLETO;
            case VENCER -> EstadoCuestionario.INCOMPLETO;
            case EXCEDER_ACCESOS -> EstadoCuestionario.INCOMPLETO;
            case INICIAR -> throw errorConflicto(
                    "El cuestionario ya está en proceso");
        };
    }
}
