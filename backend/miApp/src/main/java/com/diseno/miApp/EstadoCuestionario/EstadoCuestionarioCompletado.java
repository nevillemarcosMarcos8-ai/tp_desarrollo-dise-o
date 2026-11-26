package com.diseno.miApp.EstadoCuestionario;

import org.springframework.stereotype.Component;

@Component
public class EstadoCuestionarioCompletado
        extends EstadoCuestionarioTerminalBehavior {
    @Override
    public EstadoCuestionario estado() {
        return EstadoCuestionario.COMPLETO;
    }
}
