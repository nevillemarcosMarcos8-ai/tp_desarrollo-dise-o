package com.diseno.miApp.EstadoCuestionario;

import org.springframework.stereotype.Component;

@Component
public class EstadoCuestionarioIncompleto
        extends EstadoCuestionarioTerminalBehavior {
    @Override
    public EstadoCuestionario estado() {
        return EstadoCuestionario.INCOMPLETO;
    }
}
