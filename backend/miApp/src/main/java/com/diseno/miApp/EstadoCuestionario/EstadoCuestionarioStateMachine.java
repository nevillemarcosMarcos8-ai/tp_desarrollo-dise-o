package com.diseno.miApp.EstadoCuestionario;

import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import static com.diseno.miApp.helpers.ManejoErroresHelper.errorConflicto;

/** Resuelve el comportamiento asociado al estado persistido del cuestionario. */
@Component
public class EstadoCuestionarioStateMachine {
    private final Map<EstadoCuestionario, EstadoCuestionarioBehavior> comportamientos;

    public EstadoCuestionarioStateMachine(
            List<EstadoCuestionarioBehavior> comportamientos) {
        this.comportamientos = new EnumMap<>(EstadoCuestionario.class);
        for (EstadoCuestionarioBehavior comportamiento : comportamientos) {
            this.comportamientos.put(comportamiento.estado(), comportamiento);
        }
    }

    public EstadoCuestionario transicionar(
            EstadoCuestionario estadoActual,
            AccionEstadoCuestionario accion) {
        EstadoCuestionarioBehavior comportamiento = comportamientos.get(estadoActual);
        if (comportamiento == null) {
            throw errorConflicto(
                    "No hay comportamiento configurado para el estado "
                            + estadoActual);
        }
        return comportamiento.transicionar(accion);
    }
}
