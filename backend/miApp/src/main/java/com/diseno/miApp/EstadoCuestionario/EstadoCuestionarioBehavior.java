package com.diseno.miApp.EstadoCuestionario;

public interface EstadoCuestionarioBehavior {
    EstadoCuestionario estado();

    EstadoCuestionario transicionar(AccionEstadoCuestionario accion);
}
