package com.diseno.miApp.Factor;

import com.diseno.miApp.Competencia.Competencia;
import com.diseno.miApp.Competencia.FactorModificarRequest;
import org.springframework.stereotype.Service;

import java.util.List;

import static com.diseno.miApp.helpers.ManejoErroresHelper.errorSolicitud;
import static com.diseno.miApp.helpers.ManejoErroresHelper.errorNoEncontrado;
import static com.diseno.miApp.helpers.ValidacionesHelper.normalizarMayusculasObligatorio;
import static com.diseno.miApp.helpers.ValidacionesHelper.normalizarMayusculasOpcional;
import static com.diseno.miApp.helpers.ValidacionesHelper.patronContieneOpcional;
import static com.diseno.miApp.helpers.ValidacionesHelper.validarAlMenosUnCriterio;
import static com.diseno.miApp.helpers.ValidacionesHelper.validarIdPositivo;

@Service
public class FactorService {

    private final FactorRepository factorRepository;
    public FactorService(FactorRepository factorRepository) {
        this.factorRepository = factorRepository;
    }

    public Factor buscarPorId(Long id) {
        validarIdPositivo(id, "El ID de factor debe ser un número positivo");

        return factorRepository.findById(id)
                .orElseThrow(() -> errorNoEncontrado(
                        "Factor no encontrado"
                ));
    }

    public List<Factor> listarTodos() {
        return factorRepository.findAll();
    }

    public List<Factor> buscarConteniendo(FactorBuscarRequest request) {
        if (request == null) {
            throw errorSolicitud(
                    "Debe enviar los criterios para buscar factores"
            );
        }

        String competencia = patronContieneOpcional(
                request.nombreCompetencia()
        );
        Long competenciaId = request.competenciaId();
        if (competenciaId != null) {
            validarIdPositivo(
                    competenciaId,
                    "El ID de competencia debe ser un número positivo"
            );
        }
        String codigo = patronContieneOpcional(request.codigo());
        String factor = patronContieneOpcional(request.nombreFactor());

        validarAlMenosUnCriterio(
                "Ingrese al menos un criterio para buscar factores",
                competenciaId,
                competencia,
                codigo,
                factor
        );

        return factorRepository.buscarConteniendo(
                competenciaId,
                competencia,
                codigo,
                factor
        );
    }

    public Factor reactivarFactor(Long id) {
        Factor factor = buscarPorId(id);
        factor.setEstaActivo(true);
        return factorRepository.save(factor);
    }

    public List<Factor> listarPorCompetencia(Long idCompetencia) {
        validarIdPositivo(
                idCompetencia,
                "El ID de competencia debe ser un número positivo"
        );

        return factorRepository.findByCompetenciaId(idCompetencia);
    }

    public Factor crearFactor(
            FactorCrearRequest request,
            Competencia competencia) {
        if (request == null) {
            throw errorSolicitud("Debe enviar los datos del factor");
        }

        String codigo = normalizarMayusculasObligatorio(
                request.getCodigo(), "El código es obligatorio");
        String nombre = normalizarMayusculasObligatorio(
                request.getNombre(), "El nombre es obligatorio");

        Long idCompetencia = request.getCompetencia_id();
        validarIdPositivo(
                idCompetencia,
                "El ID de competencia debe ser un número positivo"
        );

        Factor factor = new Factor();
        factor.setCodigo(codigo);
        factor.setNombre(nombre);
        factor.setDescripcion(
                normalizarMayusculasOpcional(request.getDescripcion()));
        factor.setNroOrden(request.getNroOrden());
        factor.setEstaActivo(true);
        factor.setCompetencia(competencia);

        return factorRepository.save(factor);
    }

    public Factor modificarFactor(
            Long id,
            FactorModificarRequest request,
            Competencia competencia) {

        validarIdPositivo(id, "El ID de factor debe ser un número positivo");

        if (request == null) {
            throw errorSolicitud(
                    "Debe enviar los datos para modificar el factor"
            );
        }

        String nombre = normalizarMayusculasOpcional(request.getNombre());
        String descripcion = normalizarMayusculasOpcional(
                request.getDescripcion());
        Long idCompetencia = request.getCompetencia_id();
        Integer nroOrden = request.getNroOrden();

        if (nombre == null
                && descripcion == null
                && idCompetencia == null
                && nroOrden == null) {
            throw errorSolicitud(
                    "Debe enviar al menos un campo con valor para modificar"
            );
        }
        if (idCompetencia != null) {
            validarIdPositivo(
                    idCompetencia,
                    "El ID de competencia debe ser un número positivo"
            );
        }

        Factor factor = buscarPorId(id);

        if (nombre != null) {
            factor.setNombre(nombre);
        }

        if (descripcion != null) {
            factor.setDescripcion(descripcion);
        }

        if (idCompetencia != null) {
            factor.setCompetencia(competencia);
        }

        if (nroOrden != null) {
            factor.setNroOrden(nroOrden);
        }

        return factorRepository.save(factor);
    }

}
