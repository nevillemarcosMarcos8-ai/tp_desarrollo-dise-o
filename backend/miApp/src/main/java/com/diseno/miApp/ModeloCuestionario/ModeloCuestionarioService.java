package com.diseno.miApp.ModeloCuestionario;

import com.diseno.miApp.Puesto.Puesto;
import org.springframework.stereotype.Service;

/** Director del Builder: define el orden de construcción del modelo congelado. */
@Service
public class ModeloCuestionarioService {
    private final ModeloCuestionarioBuilderFactory builderFactory;

    public ModeloCuestionarioService(
            ModeloCuestionarioBuilderFactory builderFactory) {
        this.builderFactory = builderFactory;
    }

    /** Construye y valida en memoria; el llamador decide cuándo persistirlo. */
    public ModeloCuestionario construirYValidar(Puesto puesto) {
        return builderFactory.crear(TipoModeloCuestionario.ESTANDAR)
                .iniciar(puesto)
                .copiarCompetenciasYPonderaciones()
                .agregarPreguntasYOpciones()
                .asignarOrdenYBloques()
                .build();
    }
}
