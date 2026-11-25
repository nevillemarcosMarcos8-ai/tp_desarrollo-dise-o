package com.diseno.miApp.Puesto;


import com.diseno.miApp.CaracteristicasPuesto.CaracteristicasPuesto;
import com.diseno.miApp.CaracteristicasPuesto.CaracteristicasPuestoRepository;
import com.diseno.miApp.Empresa.Empresa;
import org.springframework.stereotype.Service;

import java.util.List;

import static com.diseno.miApp.helpers.ValidacionesHelper.validarIdPositivo;
import static com.diseno.miApp.helpers.ValidacionesHelper.normalizarMayusculasObligatorio;
import static com.diseno.miApp.helpers.ValidacionesHelper.normalizarMayusculasOpcional;
import static com.diseno.miApp.helpers.ValidacionesHelper.patronContieneOpcional;
import static com.diseno.miApp.helpers.ValidacionesHelper.validarAlMenosUnCriterio;
import static com.diseno.miApp.helpers.ManejoErroresHelper.errorNoEncontrado;
import static com.diseno.miApp.helpers.ManejoErroresHelper.errorSolicitud;

@Service
public class PuestoService {

    private final PuestoRepository puestoRepository;
    private final CaracteristicasPuestoRepository caracteristicasPuestoRepository;

    public PuestoService(
            PuestoRepository puestoRepository,
            CaracteristicasPuestoRepository caracteristicasPuestoRepository) {

        this.puestoRepository = puestoRepository;
        this.caracteristicasPuestoRepository = caracteristicasPuestoRepository;
    }
    public List<CaracteristicasPuesto> obtenerCaracteristicas(Long idPuesto) {
        Puesto puesto = buscarPorId(idPuesto);
        return caracteristicasPuestoRepository.findByPuesto_Id(puesto.getId());
    }

    public List<Puesto> listarTodos() {
        return puestoRepository.findAll();
    }

    public Puesto buscarPorId(Long id) {
        validarIdPositivo(id, "El ID del puesto debe ser un número positivo");

        return puestoRepository.findById(id)
                .orElseThrow(() -> errorNoEncontrado(
                        "Puesto no encontrado"
                ));
    }
    public Puesto crearPuesto(
            PuestoCrearRequest request,
            Empresa empresa,
            List<CaracteristicasPuesto> caracteristicas) {

        Puesto puesto = new Puesto();

        puesto.setCodigo(normalizarMayusculasObligatorio(
                request.getCodigo(), "El código del puesto es obligatorio"));
        puesto.setNombre(normalizarMayusculasObligatorio(
                request.getNombre(), "El nombre del puesto es obligatorio"));
        puesto.setDescripcion(
                normalizarMayusculasOpcional(request.getDescripcion()));
        puesto.setEmpresa(empresa);
        puesto.setEstaActiva(true);

        // Primero guardamos el puesto
        Puesto puestoGuardado = puestoRepository.save(puesto);

        // Después guardamos las características del puesto
        if (caracteristicas != null) {

            for (CaracteristicasPuesto caracteristica
                    : caracteristicas) {

                caracteristica.setPuesto(puestoGuardado);

                caracteristicasPuestoRepository.save(caracteristica);
            }
        }

        return puestoGuardado;
    }
    public List<Puesto> buscarPuestos(PuestoRequest request) {
        if (request == null) {
            throw errorSolicitud(
                    "Debe ingresar al menos un criterio de búsqueda"
            );
        }

        String codigo = normalizarMayusculasOpcional(request.getCodigo());
        String nombre = normalizarMayusculasOpcional(request.getNombre());
        String empresa = normalizarMayusculasOpcional(request.getEmpresa());

        if (codigo == null && nombre == null && empresa == null) {
            throw errorSolicitud(
                    "Debe ingresar al menos un criterio de búsqueda"
            );
        }

        return puestoRepository.buscarPuestoPorCodigoNombreYEmpresa(
                codigo, nombre, empresa
        );
    }

    public List<Puesto> buscarPuestosConteniendo(PuestoRequest request) {
        if (request == null) {
            throw errorSolicitud(
                    "Debe ingresar al menos un criterio de búsqueda"
            );
        }

        String codigo = patronContieneOpcional(request.getCodigo());
        String nombre = patronContieneOpcional(request.getNombre());
        String empresa = patronContieneOpcional(request.getEmpresa());

        validarAlMenosUnCriterio(
                "Debe ingresar al menos un criterio de búsqueda",
                codigo,
                nombre,
                empresa
        );

        return puestoRepository
                .buscarPuestoPorCodigoNombreYEmpresaConteniendo(
                        codigo,
                        nombre,
                        empresa
                );
    }

    public Puesto modificarPuesto(
            Long id,
            PuestoModificarRequest request,
            Empresa empresaResuelta,
            List<CaracteristicasPuesto> caracteristicasResueltas) {
        validarIdPositivo(id, "El ID del puesto debe ser un número positivo");

        if (request == null) {
            throw errorSolicitud(
                    "Debe enviar los datos para modificar el puesto"
            );
        }

        String nombre = normalizarMayusculasOpcional(request.getNombre());
        String descripcion = normalizarMayusculasOpcional(
                request.getDescripcion());
        boolean empresaSolicitada = request.getEmpresa() != null;
        boolean caracteristicasSolicitadas =
                request.getCaracteristicasPuesto() != null;

        if (nombre == null
                && descripcion == null
                && !empresaSolicitada
                && !caracteristicasSolicitadas) {
            throw errorSolicitud(
                    "Debe enviar al menos un campo con valor para modificar"
            );
        }
        Puesto puesto = buscarPorId(id);

        if (nombre != null) {
            puesto.setNombre(nombre);
        }

        if (descripcion != null) {
            puesto.setDescripcion(descripcion);
        }

        if (empresaSolicitada) {
            puesto.setEmpresa(empresaResuelta);
        }

        if (caracteristicasSolicitadas) {
            caracteristicasPuestoRepository.eliminarPorPuestoId(id);

            for (CaracteristicasPuesto recibida : caracteristicasResueltas) {
                CaracteristicasPuesto nueva = new CaracteristicasPuesto();
                nueva.setPonderacion(recibida.getPonderacion());
                nueva.setCompetencia(recibida.getCompetencia());
                nueva.setPuesto(puesto);
                caracteristicasPuestoRepository.save(nueva);
            }
        }

        return puestoRepository.save(puesto);
    }
    public Puesto reactivarPuesto(Long id) {
        Puesto puesto = buscarPorId(id);
        puesto.setEstaActiva(true);
        return puestoRepository.save(puesto);
    }

}
