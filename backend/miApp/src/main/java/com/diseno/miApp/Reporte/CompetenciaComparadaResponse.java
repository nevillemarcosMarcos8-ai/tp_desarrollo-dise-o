package com.diseno.miApp.Reporte;

public record CompetenciaComparadaResponse(
        Long idCompetencia,
        String nombreCompetencia,
        Double valorRequerido,
        Double valorObtenido) {
}
