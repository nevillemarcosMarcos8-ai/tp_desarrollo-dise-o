package com.diseno.miApp.Pregunta;

import org.springframework.stereotype.Service;

import java.util.List;

import static com.diseno.miApp.helpers.ManejoErroresHelper.errorNoEncontrado;
import static com.diseno.miApp.helpers.ManejoErroresHelper.errorSolicitud;
import static com.diseno.miApp.helpers.ValidacionesHelper.patronContieneOpcional;
import static com.diseno.miApp.helpers.ValidacionesHelper.validarAlMenosUnCriterio;
import static com.diseno.miApp.helpers.ValidacionesHelper.validarIdPositivo;

@Service
public class PreguntaService {

    private final PreguntaRepository preguntaRepository;

    public PreguntaService(PreguntaRepository preguntaRepository) {
        this.preguntaRepository = preguntaRepository;
    }

    public List<Pregunta> listarTodas() {
        return preguntaRepository.findAll();
    }

    public List<Pregunta> buscarConteniendo(PreguntaBuscarRequest request) {
        if (request == null) {
            throw errorSolicitud(
                    "Debe enviar los criterios para buscar preguntas"
            );
        }

        String competencia = patronContieneOpcional(
                request.nombreCompetencia()
        );
        String factor = patronContieneOpcional(request.nombreFactor());
        String pregunta = patronContieneOpcional(request.nombrePregunta());
        Long competenciaId = request.competenciaId();
        Long factorId = request.factorId();

        if (competenciaId != null) {
            validarIdPositivo(
                    competenciaId,
                    "El ID de competencia debe ser un número positivo"
            );
        }
        if (factorId != null) {
            validarIdPositivo(
                    factorId,
                    "El ID de factor debe ser un número positivo"
            );
        }

        validarAlMenosUnCriterio(
                "Ingrese al menos un criterio para buscar preguntas",
                competenciaId,
                factorId,
                competencia,
                factor,
                pregunta
        );

        return preguntaRepository.buscarConteniendo(
                competenciaId,
                factorId,
                competencia,
                factor,
                pregunta
        );
    }

    public List<Pregunta> listarActivasPorFactor(Long idFactor) {
        validarIdPositivo(idFactor, "El ID del factor debe ser positivo");
        return preguntaRepository.findByFactor_IdAndEstaActivoTrue(idFactor);
    }

    public Pregunta buscarPorId(Long id) {
        validarIdPositivo(id, "El ID de pregunta debe ser positivo");
        return preguntaRepository.findById(id)
                .orElseThrow(() -> errorNoEncontrado(
                        "Pregunta no encontrada"
                ));
    }

    public Pregunta guardar(Pregunta pregunta) {
        return preguntaRepository.save(pregunta);
    }

    public boolean existeAsociadaAOpcionRespuesta(Long idOpcionRespuesta) {
        return preguntaRepository.existsByOpcionRespuesta_Id(idOpcionRespuesta);
    }

    public long contarActivasPorFactor(Long idFactor) {
        validarIdPositivo(idFactor, "El ID del factor debe ser positivo");
        return preguntaRepository.countByFactor_IdAndEstaActivoTrue(idFactor);
    }

    public Pregunta reactivarPregunta(Long id) {
        Pregunta pregunta = buscarPorId(id);
        pregunta.setEstaActivo(true);
        return preguntaRepository.save(pregunta);
    }

}
