package com.diseno.miApp.ExportacionResultados;

import java.time.LocalDateTime;

public record CandidatoExportacionResponse(
        Long idCuestionario,
        Long idCandidato,
        String nombre,
        String apellido,
        String tipoDocumento,
        String numeroDocumento,
        String numeroCandidato,
        LocalDateTime fechaFinalizacion) {
}
