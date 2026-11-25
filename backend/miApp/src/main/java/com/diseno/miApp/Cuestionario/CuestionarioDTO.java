package com.diseno.miApp.Cuestionario;

import com.diseno.miApp.EstadoCuestionario.EstadoCuestionario;

import java.util.List;
import java.util.Map;

public record CuestionarioDTO(
        Long idCuestionario,
        EstadoCuestionario estado,
        Integer bloque,
        Integer totalBloques,
        String instrucciones,
        List<PreguntaDTO> preguntas,
        List<RespuestaDTO> respuestasGuardadas,
        Float puntajeFinal,
        Boolean cumplePonderacionMinima,
        Map<Long, Double> puntajesPorCompetencia) {

    public record PreguntaDTO(
            Long idPreguntaModelo,
            String texto,
            String descripcion,
            Integer orden,
            List<DetalleRespuestaDTO> opciones) {
    }

    public record DetalleRespuestaDTO(
            Long idOpcionModelo,
            String descripcion,
            Integer ordenVisualizacion) {
    }

    public record RespuestaDTO(
            Long idPreguntaModelo,
            Long idOpcionModelo) {
    }
}
