package com.diseno.miApp.RegistroAuditoria;

import com.diseno.miApp.CaracteristicasPuesto.CaracteristicasPuestoRepository;
import com.diseno.miApp.Competencia.Competencia;
import com.diseno.miApp.Competencia.CompetenciaRepository;
import com.diseno.miApp.Consultor.Consultor;
import com.diseno.miApp.Cuestionario.CuestionarioRepository;
import com.diseno.miApp.Factor.Factor;
import com.diseno.miApp.Factor.FactorRepository;
import com.diseno.miApp.Pregunta.Pregunta;
import com.diseno.miApp.Pregunta.PreguntaRepository;
import com.diseno.miApp.Puesto.Puesto;
import com.diseno.miApp.Puesto.PuestoRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static com.diseno.miApp.helpers.ManejoErroresHelper.errorConflicto;
import static com.diseno.miApp.helpers.ManejoErroresHelper.errorNoEncontrado;
import static com.diseno.miApp.helpers.ValidacionesHelper.validarIdPositivo;

@Service
public class GestionBajasService {

    private final PuestoRepository puestoRepository;
    private final CuestionarioRepository cuestionarioRepository;
    private final CompetenciaRepository competenciaRepository;
    private final CaracteristicasPuestoRepository caracteristicasRepository;
    private final FactorRepository factorRepository;
    private final PreguntaRepository preguntaRepository;
    private final RegistroAuditoriaService auditoriaService;
    private final ApplicationEventPublisher eventPublisher;

    public GestionBajasService(
            PuestoRepository puestoRepository,
            CuestionarioRepository cuestionarioRepository,
            CompetenciaRepository competenciaRepository,
            CaracteristicasPuestoRepository caracteristicasRepository,
            FactorRepository factorRepository,
            PreguntaRepository preguntaRepository,
            RegistroAuditoriaService auditoriaService,
            ApplicationEventPublisher eventPublisher) {
        this.puestoRepository = puestoRepository;
        this.cuestionarioRepository = cuestionarioRepository;
        this.competenciaRepository = competenciaRepository;
        this.caracteristicasRepository = caracteristicasRepository;
        this.factorRepository = factorRepository;
        this.preguntaRepository = preguntaRepository;
        this.auditoriaService = auditoriaService;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public void darBajaPuesto(Long id, HttpSession session) {
        validarIdPositivo(id, "El ID del puesto debe ser positivo");
        Consultor consultor = auditoriaService.consultorDeSesion(session);
        Puesto puesto = puestoRepository.findById(id)
                .orElseThrow(() -> errorNoEncontrado("Puesto no encontrado"));

        validarActivo(puesto.getEstaActiva(), "El puesto ya está dado de baja");
        if (cuestionarioRepository.existsByPuesto_Id(id)) {
            throw errorConflicto(
                    "El puesto tiene evaluaciones asociadas y no puede darse de baja"
            );
        }

        puesto.setEstaActiva(false);
        puestoRepository.save(puesto);
        publicarBaja(consultor, TipoEntidadAuditoria.PUESTO,
                id, puesto.getNombre());
    }

    @Transactional
    public void darBajaCompetencia(Long id, HttpSession session) {
        validarIdPositivo(id, "El ID de competencia debe ser positivo");
        Consultor consultor = auditoriaService.consultorDeSesion(session);
        Competencia competencia = competenciaRepository.findById(id)
                .orElseThrow(() -> errorNoEncontrado(
                        "Competencia no encontrada"));

        validarActivo(competencia.getEstaActivo(),
                "La competencia ya está dada de baja");
        if (factorRepository.existsByCompetencia_Id(id)) {
            throw errorConflicto(
                    "La competencia tiene factores asociados y no puede darse de baja"
            );
        }
        if (caracteristicasRepository.existsByCompetencia_Id(id)) {
            throw errorConflicto(
                    "La competencia está asociada a puestos y no puede darse de baja"
            );
        }

        competencia.setEstaActivo(false);
        competenciaRepository.save(competencia);
        publicarBaja(consultor, TipoEntidadAuditoria.COMPETENCIA,
                id, competencia.getNombre());
    }

    @Transactional
    public void darBajaFactor(Long id, HttpSession session) {
        validarIdPositivo(id, "El ID de factor debe ser positivo");
        Consultor consultor = auditoriaService.consultorDeSesion(session);
        Factor factor = factorRepository.findById(id)
                .orElseThrow(() -> errorNoEncontrado("Factor no encontrado"));

        validarActivo(factor.isEstaActvivo(), "El factor ya está dado de baja");
        List<Pregunta> preguntasActivas =
                preguntaRepository.findByFactor_IdAndEstaActivoTrue(id);

        factor.setEstaActivo(false);
        factorRepository.save(factor);
        preguntasActivas.forEach(pregunta -> pregunta.setEstaActivo(false));
        preguntaRepository.saveAll(preguntasActivas);

        publicarBaja(consultor, TipoEntidadAuditoria.FACTOR,
                id, factor.getNombre());
        preguntasActivas.forEach(pregunta -> publicarBaja(
                consultor, TipoEntidadAuditoria.PREGUNTA,
                pregunta.getId(), pregunta.getName()));
    }

    @Transactional
    public void darBajaPregunta(Long id, HttpSession session) {
        validarIdPositivo(id, "El ID de pregunta debe ser positivo");
        Consultor consultor = auditoriaService.consultorDeSesion(session);
        Pregunta pregunta = preguntaRepository.findById(id)
                .orElseThrow(() -> errorNoEncontrado(
                        "Pregunta no encontrada"));

        validarActivo(pregunta.getEstaActivo(),
                "La pregunta ya está dada de baja");
        pregunta.setEstaActivo(false);
        preguntaRepository.save(pregunta);
        publicarBaja(consultor, TipoEntidadAuditoria.PREGUNTA,
                id, pregunta.getName());
    }

    private void publicarBaja(
            Consultor consultor,
            TipoEntidadAuditoria tipoEntidad,
            Long idEntidad,
            String nombreEntidad) {
        eventPublisher.publishEvent(new BajaLogicaRealizada(
                consultor, tipoEntidad, idEntidad, nombreEntidad));
    }

    private void validarActivo(Boolean activo, String mensaje) {
        if (!Boolean.TRUE.equals(activo)) {
            throw errorConflicto(mensaje);
        }
    }

    private void validarActivo(boolean activo, String mensaje) {
        if (!activo) {
            throw errorConflicto(mensaje);
        }
    }
}
