package com.diseno.miApp.ModeloCuestionario;

import com.diseno.miApp.CaracteristicasPuesto.CaracteristicasPuesto;
import com.diseno.miApp.CaracteristicasPuesto.CaracteristicasPuestoRepository;
import com.diseno.miApp.Competencia.Competencia;
import com.diseno.miApp.DetalleOpcionRespuesta.DetalleOpcionRespuesta;
import com.diseno.miApp.DetalleOpcionRespuesta.DetalleOpcionRespuestaService;
import com.diseno.miApp.Factor.Factor;
import com.diseno.miApp.Factor.FactorService;
import com.diseno.miApp.Pregunta.Pregunta;
import com.diseno.miApp.Pregunta.PreguntaService;
import com.diseno.miApp.PreguntaOpcionPonderacion.PreguntaOpcionPonderacionService;
import com.diseno.miApp.Puesto.Puesto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static com.diseno.miApp.helpers.ManejoErroresHelper.errorConflicto;
import static com.diseno.miApp.helpers.ManejoErroresHelper.errorSolicitud;

@Service
public class ModeloCuestionarioService {
    private final CaracteristicasPuestoRepository caracteristicasRepository;
    private final FactorService factorService;
    private final PreguntaService preguntaService;
    private final DetalleOpcionRespuestaService detalleService;
    private final PreguntaOpcionPonderacionService ponderacionService;
    private final int preguntasPorBloque;

    public ModeloCuestionarioService(
            CaracteristicasPuestoRepository caracteristicasRepository,
            FactorService factorService,
            PreguntaService preguntaService,
            DetalleOpcionRespuestaService detalleService,
            PreguntaOpcionPonderacionService ponderacionService,
            @Value("${cuestionario.preguntas-por-bloque:5}") int preguntasPorBloque) {
        this.caracteristicasRepository = caracteristicasRepository;
        this.factorService = factorService;
        this.preguntaService = preguntaService;
        this.detalleService = detalleService;
        this.ponderacionService = ponderacionService;
        this.preguntasPorBloque = preguntasPorBloque;
    }

    /** Construye y valida en memoria; no persiste nada si falta información. */
    public ModeloCuestionario construirYValidar(Puesto puesto) {
        if (puesto == null || puesto.getId() == null) {
            throw errorSolicitud("Debe indicar un puesto");
        }
        if (!Boolean.TRUE.equals(puesto.getEstaActiva())) {
            throw errorConflicto("El puesto seleccionado está dado de baja");
        }
        if (preguntasPorBloque <= 0) {
            throw errorSolicitud(
                    "La cantidad de preguntas por bloque debe ser positiva");
        }

        List<CaracteristicasPuesto> caracteristicas =
                caracteristicasRepository.findByPuesto_Id(puesto.getId());
        if (caracteristicas.isEmpty()) {
            throw errorSolicitud(
                    "El puesto seleccionado no tiene competencias asociadas");
        }

        ModeloCuestionario modelo = new ModeloCuestionario();
        modelo.setIdPuestoOriginal(puesto.getId());
        modelo.setNombrePuesto(puesto.getNombre());
        modelo.setFechaCreacion(LocalDateTime.now());
        List<ModeloPregunta> seleccionadas = new ArrayList<>();

        for (CaracteristicasPuesto caracteristica : caracteristicas) {
            Competencia competencia = caracteristica.getCompetencia();
            if (competencia == null || caracteristica.getPonderacion() == null) {
                throw errorSolicitud(
                        "El puesto tiene una competencia o ponderación incompleta");
            }

            ModeloCompetencia copiaCompetencia = new ModeloCompetencia();
            copiaCompetencia.setIdCompetenciaOriginal(competencia.getId());
            copiaCompetencia.setCodigoCompetencia(competencia.getCodigo());
            copiaCompetencia.setNombreCompetencia(competencia.getNombre());
            copiaCompetencia.setPonderacionMinima(
                    caracteristica.getPonderacion());
            modelo.agregarCompetencia(copiaCompetencia);

            int factoresElegibles = 0;
            for (Factor factor :
                    factorService.listarPorCompetencia(competencia.getId())) {
                if (!factor.isEstaActvivo()) {
                    continue;
                }
                List<Pregunta> disponibles =
                        preguntaService.listarActivasPorFactor(factor.getId());
                if (disponibles.size() < 2) {
                    continue;
                }

                factoresElegibles++;
                Collections.shuffle(disponibles);
                for (Pregunta pregunta : disponibles.subList(0, 2)) {
                    seleccionadas.add(
                            congelarPregunta(pregunta, factor, competencia));
                }
            }

            if (factoresElegibles == 0) {
                throw errorSolicitud(
                        "La competencia " + competencia.getNombre()
                                + " no tiene un factor activo con al menos "
                                + "dos preguntas activas");
            }
        }

        Collections.shuffle(seleccionadas);
        for (int i = 0; i < seleccionadas.size(); i++) {
            ModeloPregunta pregunta = seleccionadas.get(i);
            pregunta.setBloque(i / preguntasPorBloque + 1);
            pregunta.setOrden(i % preguntasPorBloque + 1);
            modelo.agregarPregunta(pregunta);
        }
        return modelo;
    }

    private ModeloPregunta congelarPregunta(
            Pregunta original, Factor factor, Competencia competencia) {
        if (original.getOpcionRespuesta() == null) {
            throw errorSolicitud("La pregunta " + original.getId()
                    + " no tiene una opción de respuesta");
        }

        ModeloPregunta copia = new ModeloPregunta();
        copia.setIdPreguntaOriginal(original.getId());
        copia.setIdFactorOriginal(factor.getId());
        copia.setIdCompetenciaOriginal(competencia.getId());
        copia.setNombreFactor(factor.getNombre());
        copia.setNombreCompetencia(competencia.getNombre());
        copia.setNombrePregunta(original.getName());
        copia.setTexto(original.getTextoPregunta());
        copia.setDescripcion(original.getDescripcion());

        List<DetalleOpcionRespuesta> detalles =
                detalleService.listarPorOpcionRespuesta(
                        original.getOpcionRespuesta().getId());
        if (detalles.isEmpty()) {
            throw errorSolicitud("La pregunta " + original.getId()
                    + " no tiene opciones configuradas");
        }
        for (DetalleOpcionRespuesta detalle : detalles) {
            ModeloOpcion opcion = new ModeloOpcion();
            opcion.setIdDetalleOriginal(detalle.getId());
            opcion.setDescripcion(detalle.getDescrpicion());
            opcion.setOrdenVisualizacion(detalle.getOrdenVisualizacion());
            opcion.setPonderacion(ponderacionService.buscarPonderacion(
                    original.getId(), detalle.getId()));
            copia.agregarOpcion(opcion);
        }
        return copia;
    }
}
