package com.diseno.miApp.Competencia;

import org.springframework.stereotype.Service;

import java.util.List;

import static com.diseno.miApp.helpers.ManejoErroresHelper.errorSolicitud;
import static com.diseno.miApp.helpers.ManejoErroresHelper.errorNoEncontrado;
import static com.diseno.miApp.helpers.ValidacionesHelper.normalizarMayusculasObligatorio;
import static com.diseno.miApp.helpers.ValidacionesHelper.normalizarMayusculasOpcional;
import static com.diseno.miApp.helpers.ValidacionesHelper.patronContieneOpcional;
import static com.diseno.miApp.helpers.ValidacionesHelper.validarIdPositivo;

@Service
public class CompetenciaService {

    private final CompetenciaRepository competenciaRepository;

    public CompetenciaService(CompetenciaRepository competenciaRepository) {
        this.competenciaRepository = competenciaRepository;
    }

    public Competencia buscarPorId(Long id) {
        validarIdPositivo(
                id,
                "El ID de competencia debe ser un número positivo"
        );

        return competenciaRepository.findById(id)
                .orElseThrow(() -> errorNoEncontrado(
                        "Competencia no encontrada"
                ));
    }

    public List<Competencia> listarTodas() {
        return competenciaRepository.findAll();
    }

    public List<Competencia> buscarConteniendo(
            CompetenciaBuscarRequest request) {
        if (request == null) {
            throw errorSolicitud("Debe enviar los criterios de búsqueda");
        }

        String codigo = patronContieneOpcional(request.codigo());
        String nombre = patronContieneOpcional(request.nombre());

        return competenciaRepository.buscarConteniendo(codigo, nombre);
    }

    public Competencia reactivarCompetencia(Long id) {
        Competencia competencia = buscarPorId(id);
        competencia.setEstaActivo(true);
        return competenciaRepository.save(competencia);
    }

    public Competencia crearCompetencia(CompetenciaCrearRequest request) {
        if (request == null) {
            throw errorSolicitud("Debe enviar los datos de la competencia");
        }

        String codigo = normalizarMayusculasObligatorio(
                request.getCodigo(), "El código es obligatorio");
        String nombre = normalizarMayusculasObligatorio(
                request.getNombre(), "El nombre es obligatorio");

        Competencia competencia = new Competencia();
        competencia.setCodigo(codigo);
        competencia.setNombre(nombre);
        competencia.setDescripcion(
                normalizarMayusculasOpcional(request.getDescripcion()));
        competencia.setEstaActivo(true);

        return competenciaRepository.save(competencia);
    }

    public Competencia modificarCompetencia(
            Long id,
            CompetenciaModificarRequest request) {

        validarIdPositivo(
                id,
                "El ID de competencia debe ser un número positivo"
        );

        if (request == null) {
            throw errorSolicitud(
                    "Debe enviar los datos para modificar la competencia"
            );
        }

        String nombre = normalizarMayusculasOpcional(request.getNombre());
        String descripcion = normalizarMayusculasOpcional(
                request.getDescripcion());

        if (nombre == null && descripcion == null) {
            throw errorSolicitud(
                    "Debe enviar al menos un campo con valor para modificar"
            );
        }
        Competencia competencia = buscarPorId(id);

        if (nombre != null) {
            competencia.setNombre(nombre);
        }

        if (descripcion != null) {
            competencia.setDescripcion(descripcion);
        }

        return competenciaRepository.save(competencia);
    }

}
