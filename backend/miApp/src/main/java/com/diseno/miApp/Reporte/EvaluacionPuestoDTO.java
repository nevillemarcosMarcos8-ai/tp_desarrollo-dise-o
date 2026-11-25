package com.diseno.miApp.Reporte;

import java.time.LocalDateTime;

public record EvaluacionPuestoDTO(
        Long idEvaluacion,
        LocalDateTime fechaCreacion,
        long cantidadCandidatos,
        long cantidadCompletos
) {
}
