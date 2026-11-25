package com.diseno.miApp.Reporte;
import java.util.ArrayList;
import java.util.List;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Comparator;
import java.util.stream.Collectors;
import java.util.Objects;

import com.diseno.miApp.Cuestionario.Cuestionario;
import com.diseno.miApp.Cuestionario.CuestionarioServices;
import com.diseno.miApp.Cuestionario.CandidatoPorPuestoProjection;
import com.diseno.miApp.Cuestionario.EvaluacionesCompletasPorPuestoProjection;
import com.diseno.miApp.Cuestionario.ResumenCuestionariosPuesto;
import com.diseno.miApp.Candidato.CandidatoResumenDTO;
import com.diseno.miApp.Candidato.Candidato;
import com.diseno.miApp.EstadoCuestionario.EstadoCuestionario;
import com.diseno.miApp.OrdenDeMerito.OrdenMeritoDTO;
import com.diseno.miApp.OrdenDeMerito.OrdenMeritoGrupoDTO;
import com.diseno.miApp.Puesto.*;
import com.diseno.miApp.RespuestaPreguntaCuestionario.*;
import com.diseno.miApp.ModeloCuestionario.ModeloCuestionario;
import com.diseno.miApp.helpers.CalculoPuntajeHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.diseno.miApp.helpers.ManejoErroresHelper.ejecutarConMensajeDeError;
import static com.diseno.miApp.helpers.ManejoErroresHelper.errorNoEncontrado;
import static com.diseno.miApp.helpers.ManejoErroresHelper.errorSolicitud;
import static com.diseno.miApp.helpers.ValidacionesHelper.validarIdPositivo;

@Service
public class ReporteServices {

    private static final String COMPLETO_CUMPLE_MINIMO =
            "COMPLETO_SI_CUMPLE_PONDERACION_MINIMA";
    private static final String COMPLETO_NO_CUMPLE_MINIMO =
            "COMPLETO_NO_CUMPLE_PONDERACION_MINIMA";

    private final CuestionarioServices cuestionarioServices;
    private final PuestoService puestoServices;
    private final RespuestaPreguntaCuestionarioService respuestaCuestionarioService;
    private final CalculoPuntajeHelper calculoPuntajeHelper;

    public ReporteServices(
            CuestionarioServices cuestionarioServices,
            PuestoService puestoServices,
            RespuestaPreguntaCuestionarioService respuestaCuestionarioService,
            CalculoPuntajeHelper calculoPuntajeHelper) {

        this.cuestionarioServices = cuestionarioServices;
        this.puestoServices = puestoServices;
        this.respuestaCuestionarioService = respuestaCuestionarioService;
        this.calculoPuntajeHelper = calculoPuntajeHelper;
    }


    public List<PuestoResponse> obtenerResumenesPorPuesto(
            PuestoRequest request) {
        List<Puesto> puestos = ejecutarConMensajeDeError(
                "No se pudieron buscar los puestos para el orden de mérito",
                () -> puestoServices.buscarPuestos(request)
        );

        if (puestos.isEmpty()) {
            return List.of();
        }

        List<Long> idsPuestos = puestos.stream()
                .map(Puesto::getId)
                .toList();

        Map<Long, ResumenCuestionariosPuesto> resumenesPorPuesto =
                obtenerResumenesPorIds(idsPuestos);

        return puestos.stream()
                .map(puesto -> new PuestoResponse(
                        puesto,
                        resumenesPorPuesto.get(puesto.getId())
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CandidatoComparativoResponse> obtenerCandidatosCompletos(
            Long idPuesto) {
        validarIdPositivo(idPuesto, "El ID del puesto debe ser positivo");
        puestoServices.buscarPorId(idPuesto);

        return cuestionarioServices.buscarCompletosPorPuesto(idPuesto).stream()
                .filter(cuestionario -> cuestionario.getCandidato() != null)
                .sorted(Comparator.comparing(
                        Cuestionario::getFechaRealizacion,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::aCandidatoComparativoResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ReporteComparativoResponse emitirReporteComparativo(
            Long idPuesto,
            Long idCuestionario) {
        validarIdPositivo(idPuesto, "El ID del puesto debe ser positivo");
        validarIdPositivo(idCuestionario,
                "El ID del cuestionario debe ser positivo");

        Puesto puesto = puestoServices.buscarPorId(idPuesto);
        Cuestionario cuestionario = cuestionarioServices.buscarPorId(idCuestionario);
        if (cuestionario.getEstadoCuestionario() != EstadoCuestionario.COMPLETO) {
            throw errorSolicitud("El cuestionario todavía no está completo");
        }
        if (cuestionario.getPuesto() == null
                || !Objects.equals(cuestionario.getPuesto().getId(), idPuesto)) {
            throw errorNoEncontrado(
                    "El cuestionario no pertenece al puesto indicado");
        }
        ModeloCuestionario modelo = cuestionario.getModelo();
        if (modelo == null) {
            throw errorSolicitud(
                    "El cuestionario completo no tiene un modelo congelado");
        }

        List<RespuestaPreguntaCuestionario> respuestas =
                respuestaCuestionarioService.obtenerPorCuestionario(idCuestionario);
        CalculoPuntajeHelper.ResultadoPuntaje resultado =
                calculoPuntajeHelper.calcularResultado(
                        respuestas, modelo.getCompetencias());

        List<CompetenciaComparadaResponse> competencias =
                modelo.getCompetencias().stream()
                        .map(competencia -> {
                            Long idCompetencia = competencia.getIdCompetenciaOriginal();
                            if (idCompetencia == null
                                    || competencia.getNombreCompetencia() == null
                                    || competencia.getPonderacionMinima() == null) {
                                throw errorSolicitud(
                                        "El modelo congelado tiene una competencia incompleta");
                            }
                            Double obtenido = resultado.puntajesPorCompetencia()
                                    .get(idCompetencia);
                            if (obtenido == null) {
                                throw errorSolicitud(
                                        "Faltan respuestas para calcular la competencia "
                                                + competencia.getNombreCompetencia());
                            }
                            return new CompetenciaComparadaResponse(
                                    idCompetencia,
                                    competencia.getNombreCompetencia(),
                                    competencia.getPonderacionMinima().doubleValue(),
                                    obtenido);
                        })
                        .toList();

        return new ReporteComparativoResponse(
                puesto.getId(),
                puesto.getCodigo(),
                puesto.getNombre(),
                puesto.getEmpresa() == null ? null : puesto.getEmpresa().getNombre(),
                aCandidatoComparativoResponse(cuestionario),
                competencias);
    }

    private CandidatoComparativoResponse aCandidatoComparativoResponse(
            Cuestionario cuestionario) {
        Candidato candidato = cuestionario.getCandidato();
        if (candidato == null || cuestionario.getFechaRealizacion() == null) {
            throw errorSolicitud(
                    "El cuestionario completo no tiene candidato o fecha de finalización");
        }
        return new CandidatoComparativoResponse(
                cuestionario.getId(),
                candidato.getId(),
                candidato.getNombre(),
                candidato.getApellido(),
                candidato.getTipoDocumento() == null
                        ? null : candidato.getTipoDocumento().name(),
                candidato.getNumeroDocumento(),
                candidato.getNumeroCandidato(),
                cuestionario.getFechaRealizacion());
    }

    private Map<Long, ResumenCuestionariosPuesto> obtenerResumenesPorIds(
            List<Long> idsPuestos) {
        Map<Long, List<CandidatoResumenDTO>> candidatosPorPuesto =
                new HashMap<>();

        List<CandidatoPorPuestoProjection> candidatos =
                ejecutarConMensajeDeError(
                        "No se pudieron consultar los candidatos de los puestos",
                        () -> cuestionarioServices
                                .buscarCandidatosPorPuestoCuestionario(idsPuestos)
                );

        for (CandidatoPorPuestoProjection resultado : candidatos) {
            candidatosPorPuesto
                    .computeIfAbsent(resultado.getPuestoId(), id -> new ArrayList<>())
                    .add(new CandidatoResumenDTO(resultado.getCandidato()));
        }

        Map<Long, Long> cantidadesCompletasPorPuesto = new HashMap<>();

        List<EvaluacionesCompletasPorPuestoProjection> evaluacionesCompletas =
                ejecutarConMensajeDeError(
                        "No se pudieron contar los cuestionarios completos de los puestos",
                        () -> cuestionarioServices
                                .contarCuestionariosCompletosPorPuestos(idsPuestos)
                );

        for (EvaluacionesCompletasPorPuestoProjection resultado
                : evaluacionesCompletas) {
            cantidadesCompletasPorPuesto.put(
                    resultado.getPuestoId(),
                    resultado.getCantidad()
            );
        }

        Map<Long, ResumenCuestionariosPuesto> resumenesPorPuesto =
                new HashMap<>();
        for (Long idPuesto : idsPuestos) {
            resumenesPorPuesto.put(
                    idPuesto,
                    new ResumenCuestionariosPuesto(
                            candidatosPorPuesto.getOrDefault(idPuesto, List.of()),
                            cantidadesCompletasPorPuesto.getOrDefault(idPuesto, 0L)
                    )
            );
        }
        return resumenesPorPuesto;
    }

    @Transactional(readOnly = true)
    public List<OrdenMeritoGrupoDTO> emitirOrdenMerito(Long idPuesto) {
        validarIdPositivo(idPuesto, "El ID del puesto debe ser positivo");
        puestoServices.buscarPorId(idPuesto);
        List<Cuestionario> cuestionarios =
                cuestionarioServices.buscarTodosPorPuesto(idPuesto);

        if (cuestionarios.isEmpty()) {
            throw errorNoEncontrado(
                    "El puesto no tiene cuestionarios asociados"
            );
        }

        Map<String, List<OrdenMeritoDTO>> matriz = crearGruposPorEstado();

        for (Cuestionario cuestionario : cuestionarios) {
            String estadoGrupo =
                    cuestionario.getEstadoCuestionario().name();
            Float puntaje = null;

            if (cuestionario.getEstadoCuestionario()
                    == EstadoCuestionario.COMPLETO) {
                List<RespuestaPreguntaCuestionario> respuestas =
                        respuestaCuestionarioService.obtenerPorCuestionario(
                                cuestionario.getId()
                        );

                if (cuestionario.getModelo() == null) {
                    throw errorSolicitud(
                            "El cuestionario completo no tiene un modelo congelado"
                    );
                }

                CalculoPuntajeHelper.ResultadoPuntaje resultado =
                        calculoPuntajeHelper.calcularResultado(
                                respuestas,
                                cuestionario.getModelo().getCompetencias()
                        );

                puntaje = resultado.puntajeFinal();
                estadoGrupo = resultado.cumpleMinimo()
                        ? COMPLETO_CUMPLE_MINIMO
                        : COMPLETO_NO_CUMPLE_MINIMO;
            }

            matriz.get(estadoGrupo).add(
                    crearRegistroMerito(cuestionario, puntaje)
            );
        }

        ordenarPorPuntaje(matriz);
        asignarOrdenMerito(matriz.get(COMPLETO_CUMPLE_MINIMO));

        return generarOrdenMerito(matriz);
    }

    private Map<String, List<OrdenMeritoDTO>> crearGruposPorEstado() {
        Map<String, List<OrdenMeritoDTO>> grupos = new LinkedHashMap<>();
        grupos.put(COMPLETO_CUMPLE_MINIMO, new ArrayList<>());
        grupos.put(COMPLETO_NO_CUMPLE_MINIMO, new ArrayList<>());

        for (EstadoCuestionario estado : EstadoCuestionario.values()) {
            if (estado != EstadoCuestionario.COMPLETO) {
                grupos.put(estado.name(), new ArrayList<>());
            }
        }

        return grupos;
    }

    private OrdenMeritoDTO crearRegistroMerito(
            Cuestionario cuestionario,
            Float puntajeFinal) {
        return new OrdenMeritoDTO(cuestionario, puntajeFinal);
    }

    private void ordenarPorPuntaje(
            Map<String, List<OrdenMeritoDTO>> grupos) {
        Comparator<OrdenMeritoDTO> comparador =
                Comparator.comparing(
                        OrdenMeritoDTO::getPuntajeObtenido,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ).thenComparing(
                        OrdenMeritoDTO::getApellido,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)
                ).thenComparing(
                        OrdenMeritoDTO::getNombre,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)
                );

        grupos.values().forEach(grupo -> grupo.sort(comparador));
    }

    private void asignarOrdenMerito(List<OrdenMeritoDTO> candidatos) {
        for (int i = 0; i < candidatos.size(); i++) {
            candidatos.get(i).setOrdenMerito(i + 1);
        }
    }

    private List<OrdenMeritoGrupoDTO> generarOrdenMerito(
            Map<String, List<OrdenMeritoDTO>> grupos) {
        return grupos.entrySet()
                .stream()
                .map(entrada -> new OrdenMeritoGrupoDTO(
                        entrada.getKey(),
                        entrada.getValue()
                ))
                .collect(Collectors.toList());
    }
}
