package com.diseno.miApp.ModeloCuestionario;

import com.diseno.miApp.CaracteristicasPuesto.CaracteristicasPuestoRepository;
import com.diseno.miApp.DetalleOpcionRespuesta.DetalleOpcionRespuestaService;
import com.diseno.miApp.Factor.FactorService;
import com.diseno.miApp.Pregunta.PreguntaService;
import com.diseno.miApp.PreguntaOpcionPonderacion.PreguntaOpcionPonderacionService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Factory que crea un Builder nuevo por cada modelo para que no comparta estado
 * entre cuestionarios. Las variantes futuras se seleccionan por su tipo.
 */
@Component
public class ModeloCuestionarioBuilderFactory {
    private final CaracteristicasPuestoRepository caracteristicasRepository;
    private final FactorService factorService;
    private final PreguntaService preguntaService;
    private final DetalleOpcionRespuestaService detalleService;
    private final PreguntaOpcionPonderacionService ponderacionService;
    private final int preguntasPorBloque;

    public ModeloCuestionarioBuilderFactory(
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

    public ModeloCuestionarioBuilder crear(TipoModeloCuestionario tipo) {
        if (tipo == null) {
            throw new IllegalArgumentException("Debe indicar el tipo de modelo");
        }
        return switch (tipo) {
            case ESTANDAR -> new ModeloCuestionarioEstandarBuilder(
                    caracteristicasRepository,
                    factorService,
                    preguntaService,
                    detalleService,
                    ponderacionService,
                    preguntasPorBloque);
        };
    }
}
