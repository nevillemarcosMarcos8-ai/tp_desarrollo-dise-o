package com.diseno.miApp.Reporte;

import java.time.LocalDateTime;

public record CandidatoComparativoResponse(
        Long idCuestionario,
        Long idCandidato,
        String nombre,
        String apellido,
        String tipoDocumento,
        String numeroDocumento,
        String numeroCandidato,
        LocalDateTime fechaFinalizacion) {
}
