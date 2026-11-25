package com.diseno.miApp.Reporte;

import java.util.List;

public record ReporteComparativoResponse(
        Long idPuesto,
        String codigoPuesto,
        String nombrePuesto,
        String empresa,
        CandidatoComparativoResponse candidato,
        List<CompetenciaComparadaResponse> competencias) {
    public ReporteComparativoResponse {
        competencias = List.copyOf(competencias);
    }
}
