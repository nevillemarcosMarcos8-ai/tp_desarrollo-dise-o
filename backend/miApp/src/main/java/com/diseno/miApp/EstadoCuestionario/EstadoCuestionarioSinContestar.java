package com.diseno.miApp.EstadoCuestionario;

import org.springframework.stereotype.Component;

@Component
public class EstadoCuestionarioSinContestar
        extends EstadoCuestionarioTerminalBehavior {
    @Override
    public EstadoCuestionario estado() {
        return EstadoCuestionario.SIN_CONTESTAR;
    }
}
