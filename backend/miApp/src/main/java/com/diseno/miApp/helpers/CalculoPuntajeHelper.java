package com.diseno.miApp.helpers;

import com.diseno.miApp.ModeloCuestionario.ModeloCompetencia;
import com.diseno.miApp.ModeloCuestionario.ModeloPregunta;
import com.diseno.miApp.RespuestaPreguntaCuestionario.RespuestaPreguntaCuestionario;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.diseno.miApp.helpers.ManejoErroresHelper.errorSolicitud;

@Component
public class CalculoPuntajeHelper {
    public ResultadoPuntaje calcularResultado(
            List<RespuestaPreguntaCuestionario> respuestas,
            List<ModeloCompetencia> competencias) {
        if (respuestas == null || respuestas.isEmpty()) {
            throw errorSolicitud(
                    "El cuestionario completo no tiene respuestas registradas");
        }
        if (competencias == null || competencias.isEmpty()) {
            throw errorSolicitud(
                    "El modelo no tiene competencias configuradas");
        }

        Map<Long, Double> puntajes = calcularPuntajes(respuestas);
        return new ResultadoPuntaje(
                calcularPuntajeFinal(puntajes, competencias),
                cumpleMinimo(puntajes, competencias),
                puntajes);
    }

    private Map<Long, Double> calcularPuntajes(
            List<RespuestaPreguntaCuestionario> respuestas) {
        Map<Long, Map<Long, Integer>> sumas = new HashMap<>();
        Map<Long, Map<Long, Integer>> cantidades = new HashMap<>();

        for (RespuestaPreguntaCuestionario respuesta : respuestas) {
            ModeloPregunta pregunta = respuesta.getPregunta();
            Long idCompetencia = pregunta.getIdCompetenciaOriginal();
            Long idFactor = pregunta.getIdFactorOriginal();
            Integer ponderacion = respuesta.getOpcionSeleccionada()
                    .getPonderacion();

            if (idCompetencia == null || idFactor == null || ponderacion == null) {
                throw errorSolicitud(
                        "Una respuesta no tiene los datos congelados necesarios para calcular el puntaje");
            }
            sumas.computeIfAbsent(idCompetencia, id -> new HashMap<>())
                    .merge(idFactor, ponderacion, Integer::sum);
            cantidades.computeIfAbsent(idCompetencia, id -> new HashMap<>())
                    .merge(idFactor, 1, Integer::sum);
        }

        Map<Long, Double> resultado = new HashMap<>();
        sumas.forEach((idCompetencia, porFactor) -> {
            Map<Long, Integer> conteoPorFactor =
                    cantidades.getOrDefault(idCompetencia, Map.of());
            double puntajeCompetencia = porFactor.entrySet().stream()
                    .mapToDouble(entrada -> {
                        int cantidad = conteoPorFactor.getOrDefault(
                                entrada.getKey(), 2);
                        return entrada.getValue() / (double) Math.max(1, cantidad);
                    })
                    .average()
                    .orElse(0.0);
            resultado.put(idCompetencia, puntajeCompetencia);
        });
        return resultado;
    }

    private boolean cumpleMinimo(
            Map<Long, Double> puntajes,
            List<ModeloCompetencia> competencias) {
        return competencias.stream().allMatch(competencia -> {
            Double obtenido = puntajes.get(
                    competencia.getIdCompetenciaOriginal());
            Integer minimo = competencia.getPonderacionMinima();
            return obtenido != null && minimo != null && obtenido >= minimo;
        });
    }

    private Float calcularPuntajeFinal(
            Map<Long, Double> puntajes,
            List<ModeloCompetencia> competencias) {
        return (float) competencias.stream()
                .mapToDouble(competencia -> puntajes.getOrDefault(
                        competencia.getIdCompetenciaOriginal(), 0.0))
                .average()
                .orElse(0.0);
    }

    public record ResultadoPuntaje(
            Float puntajeFinal,
            boolean cumpleMinimo,
            Map<Long, Double> puntajesPorCompetencia) {
    }
}
