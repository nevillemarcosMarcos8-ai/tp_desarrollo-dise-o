package com.diseno.miApp.EstadoCuestionario;

import org.springframework.stereotype.Component;

import static com.diseno.miApp.helpers.ManejoErroresHelper.errorConflicto;

@Component
public class EstadoCuestionarioActivo implements EstadoCuestionarioBehavior {
    @Override
    public EstadoCuestionario estado() {
        return EstadoCuestionario.ACTIVO;
    }

    @Override
    public EstadoCuestionario transicionar(AccionEstadoCuestionario accion) {
        return switch (accion) {
            case INICIAR -> EstadoCuestionario.EN_PROCESO;
            case VENCER -> EstadoCuestionario.SIN_CONTESTAR;
            case EXCEDER_ACCESOS -> EstadoCuestionario.INCOMPLETO;
            case COMPLETAR -> throw errorConflicto(
                    "Un cuestionario activo debe iniciarse antes de completarse");
        };
    }
}
