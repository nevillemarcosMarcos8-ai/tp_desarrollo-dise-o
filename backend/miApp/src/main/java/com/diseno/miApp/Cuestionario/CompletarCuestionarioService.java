package com.diseno.miApp.Cuestionario;

import com.diseno.miApp.EstadoCuestionario.EstadoCuestionario;
import com.diseno.miApp.ModeloCuestionario.ModeloCompetencia;
import com.diseno.miApp.ModeloCuestionario.ModeloOpcion;
import com.diseno.miApp.ModeloCuestionario.ModeloPregunta;
import com.diseno.miApp.ModeloCuestionario.ModeloPreguntaRepository;
import com.diseno.miApp.ModeloCuestionario.ModeloOpcionRepository;
import com.diseno.miApp.RespuestaPreguntaCuestionario.RespuestaPreguntaCuestionario;
import com.diseno.miApp.RespuestaPreguntaCuestionario.RespuestaPreguntaCuestionarioService;
import com.diseno.miApp.helpers.CalculoPuntajeHelper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.diseno.miApp.helpers.ManejoErroresHelper.errorConflicto;
import static com.diseno.miApp.helpers.ManejoErroresHelper.errorNoEncontrado;
import static com.diseno.miApp.helpers.ManejoErroresHelper.errorSolicitud;
import static com.diseno.miApp.helpers.ValidacionesHelper.validarIdPositivo;

@Service
public class CompletarCuestionarioService {
    private final CuestionarioRepository cuestionarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final ModeloPreguntaRepository preguntaRepository;
    private final ModeloOpcionRepository opcionRepository;
    private final RespuestaPreguntaCuestionarioService respuestaService;
    private final CalculoPuntajeHelper calculoPuntajeHelper;
    private final java.time.Duration plazoCompletar;
    private final int maximoAccesos;
    private final String instrucciones;

    public CompletarCuestionarioService(
            CuestionarioRepository cuestionarioRepository,
            PasswordEncoder passwordEncoder,
            ModeloPreguntaRepository preguntaRepository,
            ModeloOpcionRepository opcionRepository,
            RespuestaPreguntaCuestionarioService respuestaService,
            CalculoPuntajeHelper calculoPuntajeHelper,
            @Value("${cuestionario.plazo-completar}")
            java.time.Duration plazoCompletar,
            @Value("${cuestionario.maximo-accesos:5}") int maximoAccesos,
            @Value("${cuestionario.instrucciones:Lea atentamente cada pregunta antes de responder. Debe contestar todas las preguntas de cada bloque para avanzar al siguiente paso.}")
            String instrucciones) {
        this.cuestionarioRepository = cuestionarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.preguntaRepository = preguntaRepository;
        this.opcionRepository = opcionRepository;
        this.respuestaService = respuestaService;
        this.calculoPuntajeHelper = calculoPuntajeHelper;
        this.plazoCompletar = plazoCompletar;
        this.maximoAccesos = maximoAccesos;
        this.instrucciones = instrucciones;
    }

    @Transactional(noRollbackFor = CuestionarioVencidoException.class)
    public CuestionarioDTO accederCuestionario(
            Long idCandidato,
            String claveIngreso) {
        validarIdPositivo(idCandidato, "El ID del candidato debe ser positivo");
        if (claveIngreso == null || claveIngreso.isBlank()) {
            throw errorSolicitud("Ingresá la clave de ingreso del cuestionario");
        }

        Cuestionario cuestionario = cuestionarioRepository
                .findFirstByCandidato_IdAndEstadoCuestionarioIn(
                        idCandidato,
                        List.of(EstadoCuestionario.ACTIVO,
                                EstadoCuestionario.EN_PROCESO))
                .orElseThrow(() -> errorNoEncontrado(
                        "No tenés un cuestionario activo o en proceso"));

        String claveNormalizada = claveIngreso.trim();
        if (!passwordEncoder.matches(
                claveNormalizada, cuestionario.getClaveIngreso())
                && !passwordEncoder.matches(
                        claveNormalizada.toUpperCase(java.util.Locale.ROOT),
                        cuestionario.getClaveIngreso())) {
            throw errorConflicto("La clave de ingreso no es válida");
        }
        if (cuestionario.getModelo() == null) {
            throw errorConflicto(
                    "Este cuestionario es anterior al modelo congelado; el consultor debe generar una evaluación nueva");
        }

        validarPlazos(cuestionario);
        if (maximoAccesos <= 0) {
            throw errorSolicitud("El máximo de accesos debe ser positivo");
        }
        if (cuestionario.getCantidadAccesos() != null
                && cuestionario.getCantidadAccesos() >= maximoAccesos) {
            vencer(cuestionario, EstadoCuestionario.INCOMPLETO,
                    "Se superó la cantidad máxima de accesos permitidos. El cuestionario quedó en estado Incompleto.");
        }

        LocalDateTime ahora = LocalDateTime.now();
        registrarAcceso(cuestionario, ahora);
        cuestionarioRepository.save(cuestionario);
        if (cuestionario.getEstadoCuestionario() == EstadoCuestionario.ACTIVO) {
            return construirInstruccionesDTO(cuestionario);
        }
        return construirBloquePendiente(cuestionario);
    }

    @Transactional(noRollbackFor = CuestionarioVencidoException.class)
    public CuestionarioDTO iniciarCuestionario(
            Long idCandidato,
            Long idCuestionario) {
        validarIdPositivo(idCandidato, "El ID del candidato debe ser positivo");
        validarIdPositivo(idCuestionario,
                "El ID del cuestionario debe ser positivo");
        Cuestionario cuestionario = cuestionarioRepository.findById(idCuestionario)
                .orElseThrow(() -> errorNoEncontrado("El cuestionario no existe"));
        if (cuestionario.getCandidato() == null
                || !idCandidato.equals(cuestionario.getCandidato().getId())) {
            throw errorNoEncontrado("El cuestionario no pertenece al candidato");
        }
        if (cuestionario.getModelo() == null) {
            throw errorConflicto(
                    "Este cuestionario no tiene un modelo de preguntas disponible");
        }

        validarPlazos(cuestionario);
        if (cuestionario.getEstadoCuestionario() == EstadoCuestionario.EN_PROCESO) {
            return construirBloquePendiente(cuestionario);
        }
        if (cuestionario.getEstadoCuestionario() != EstadoCuestionario.ACTIVO) {
            throw errorConflicto(
                    "El cuestionario no está disponible para iniciarse");
        }

        LocalDateTime ahora = LocalDateTime.now();
        cuestionario.setEstadoCuestionario(EstadoCuestionario.EN_PROCESO);
        cuestionario.setFechaInicio(ahora);
        cuestionario.setFechaLimiteFinalizacion(ahora.plus(plazoCompletar));
        cuestionario.setFechaCambioEstado(ahora);
        cuestionarioRepository.save(cuestionario);
        return construirBloquePendiente(cuestionario);
    }

    @Transactional(noRollbackFor = CuestionarioVencidoException.class)
    public CuestionarioDTO guardarRespuestasParciales(
            Long idCandidato,
            Long idCuestionario,
            GuardarRespuestasRequest request) {
        Cuestionario cuestionario = buscarEnProcesoDelCandidato(
                idCandidato, idCuestionario);
        validarPlazos(cuestionario);
        List<ModeloPregunta> bloque = obtenerBloquePendiente(cuestionario);
        if (request == null || request.respuestas() == null
                || request.respuestas().isEmpty()) {
            throw errorSolicitud("Debe enviar al menos una respuesta parcial");
        }
        respuestaService.guardarOActualizar(cuestionario,
                validarYConstruirRespuestas(cuestionario, bloque, request));
        return construirDTO(cuestionario, bloque,
                respuestasDelBloque(cuestionario.getId(), bloque), null);
    }

    @Transactional(noRollbackFor = CuestionarioVencidoException.class)
    public CuestionarioDTO finalizarBloque(
            Long idCandidato,
            Long idCuestionario,
            GuardarRespuestasRequest request) {
        Cuestionario cuestionario = buscarEnProcesoDelCandidato(
                idCandidato, idCuestionario);
        validarPlazos(cuestionario);
        List<ModeloPregunta> bloque = obtenerBloquePendiente(cuestionario);
        List<RespuestaPreguntaCuestionario> nuevas =
                validarYConstruirRespuestas(cuestionario, bloque, request);

        Set<Long> contestadas = respuestasDelBloque(
                cuestionario.getId(), bloque).stream()
                .map(r -> r.getPregunta().getId())
                .collect(Collectors.toSet());
        nuevas.stream().map(r -> r.getPregunta().getId())
                .forEach(contestadas::add);
        List<String> faltantes = bloque.stream()
                .filter(p -> !contestadas.contains(p.getId()))
                .map(p -> "Pregunta " + p.getOrden())
                .toList();
        if (!faltantes.isEmpty()) {
            throw errorSolicitud(
                    "Debés responder todas las preguntas del bloque. Faltan responder: "
                            + String.join(", ", faltantes));
        }
        if (!nuevas.isEmpty()) {
            respuestaService.guardarOActualizar(cuestionario, nuevas);
        }

        if (esUltimoBloque(bloque, cuestionario)) {
            List<RespuestaPreguntaCuestionario> todas =
                    respuestaService.obtenerPorCuestionario(cuestionario.getId());
            CalculoPuntajeHelper.ResultadoPuntaje resultado =
                    calculoPuntajeHelper.calcularResultado(
                            todas, cuestionario.getModelo().getCompetencias());
            cuestionario.setEstadoCuestionario(EstadoCuestionario.COMPLETO);
            cuestionario.setFechaRealizacion(LocalDateTime.now());
            cuestionario.setFechaCambioEstado(LocalDateTime.now());
            cuestionarioRepository.save(cuestionario);
            return construirDTO(cuestionario, bloque,
                    respuestasDelBloque(cuestionario.getId(), bloque), resultado);
        }
        return construirBloquePendiente(cuestionario);
    }

    private Cuestionario buscarEnProcesoDelCandidato(
            Long idCandidato, Long idCuestionario) {
        validarIdPositivo(idCandidato, "El ID del candidato debe ser positivo");
        validarIdPositivo(idCuestionario,
                "El ID del cuestionario debe ser positivo");
        Cuestionario cuestionario = cuestionarioRepository.findById(idCuestionario)
                .orElseThrow(() -> errorNoEncontrado("El cuestionario no existe"));
        if (cuestionario.getCandidato() == null
                || !idCandidato.equals(cuestionario.getCandidato().getId())) {
            throw errorNoEncontrado("El cuestionario no pertenece al candidato");
        }
        if (cuestionario.getModelo() == null) {
            throw errorConflicto(
                    "Este cuestionario no tiene un modelo de preguntas disponible");
        }
        if (cuestionario.getEstadoCuestionario()
                != EstadoCuestionario.EN_PROCESO) {
            throw errorConflicto("El cuestionario no está en proceso");
        }
        return cuestionario;
    }

    private void validarPlazos(Cuestionario cuestionario) {
        LocalDateTime ahora = LocalDateTime.now();
        if (cuestionario.getEstadoCuestionario() == EstadoCuestionario.ACTIVO
                && cuestionario.getFechaLimiteActivo() != null
                && ahora.isAfter(cuestionario.getFechaLimiteActivo())) {
            vencer(cuestionario, EstadoCuestionario.SIN_CONTESTAR,
                    "Venció el plazo para iniciar el cuestionario");
        }
        if (cuestionario.getEstadoCuestionario() == EstadoCuestionario.EN_PROCESO
                && cuestionario.getFechaLimiteFinalizacion() != null
                && ahora.isAfter(cuestionario.getFechaLimiteFinalizacion())) {
            vencer(cuestionario, EstadoCuestionario.INCOMPLETO,
                    "Venció el plazo para completar el cuestionario");
        }
    }

    private void vencer(Cuestionario cuestionario,
                        EstadoCuestionario estado, String mensaje) {
        cuestionario.setEstadoCuestionario(estado);
        cuestionario.setFechaCambioEstado(LocalDateTime.now());
        cuestionarioRepository.save(cuestionario);
        throw new CuestionarioVencidoException(mensaje);
    }

    private List<ModeloPregunta> preguntasDelModelo(Cuestionario c) {
        return preguntaRepository.findByModelo_IdOrderByBloqueAscOrdenAsc(
                c.getModelo().getId());
    }

    private List<ModeloPregunta> obtenerBloquePendiente(Cuestionario c) {
        List<ModeloPregunta> todas = preguntasDelModelo(c);
        Set<Long> respondidas = respuestaService.obtenerPorCuestionario(c.getId())
                .stream().map(r -> r.getPregunta().getId())
                .collect(Collectors.toSet());
        Integer numero = todas.stream()
                .filter(p -> !respondidas.contains(p.getId()))
                .map(ModeloPregunta::getBloque)
                .min(Comparator.naturalOrder())
                .orElseThrow(() -> errorConflicto(
                        "No hay bloques pendientes para este cuestionario"));
        return todas.stream().filter(p -> p.getBloque().equals(numero))
                .sorted(Comparator.comparing(ModeloPregunta::getOrden)).toList();
    }

    private CuestionarioDTO construirBloquePendiente(Cuestionario c) {
        List<ModeloPregunta> bloque = obtenerBloquePendiente(c);
        return construirDTO(c, bloque,
                respuestasDelBloque(c.getId(), bloque), null);
    }

    private List<RespuestaPreguntaCuestionario> validarYConstruirRespuestas(
            Cuestionario c, List<ModeloPregunta> bloque,
            GuardarRespuestasRequest request) {
        if (request == null || request.respuestas() == null) {
            return List.of();
        }
        Set<Long> permitidas = bloque.stream().map(ModeloPregunta::getId)
                .collect(Collectors.toSet());
        Set<Long> recibidas = new HashSet<>();
        return request.respuestas().stream().map(item -> {
            if (item == null || item.idPreguntaModelo() == null
                    || item.idOpcionModelo() == null) {
                throw errorSolicitud(
                        "Cada respuesta requiere la pregunta y opción del cuestionario");
            }
            if (!permitidas.contains(item.idPreguntaModelo())) {
                throw errorSolicitud(
                        "La pregunta no pertenece al bloque pendiente");
            }
            if (!recibidas.add(item.idPreguntaModelo())) {
                throw errorSolicitud("La pregunta está repetida en la solicitud");
            }
            ModeloPregunta pregunta = bloque.stream()
                    .filter(p -> p.getId().equals(item.idPreguntaModelo()))
                    .findFirst().orElseThrow();
            ModeloOpcion opcion = opcionRepository
                    .findByIdAndPregunta_Id(item.idOpcionModelo(), pregunta.getId())
                    .orElseThrow(() -> errorSolicitud(
                            "La opción no corresponde a esa pregunta"));
            RespuestaPreguntaCuestionario respuesta =
                    new RespuestaPreguntaCuestionario();
            respuesta.setCuestionario(c);
            respuesta.setPregunta(pregunta);
            respuesta.setOpcionSeleccionada(opcion);
            respuesta.setFechaRespuesta(java.time.LocalDate.now());
            return respuesta;
        }).toList();
    }

    private List<RespuestaPreguntaCuestionario> respuestasDelBloque(
            Long idCuestionario, List<ModeloPregunta> bloque) {
        Set<Long> ids = bloque.stream().map(ModeloPregunta::getId)
                .collect(Collectors.toSet());
        return respuestaService.obtenerPorCuestionario(idCuestionario).stream()
                .filter(r -> ids.contains(r.getPregunta().getId())).toList();
    }

    private boolean esUltimoBloque(List<ModeloPregunta> bloque,
                                   Cuestionario cuestionario) {
        Integer actual = bloque.getFirst().getBloque();
        Integer maximo = preguntasDelModelo(cuestionario).stream()
                .map(ModeloPregunta::getBloque)
                .max(Comparator.naturalOrder())
                .orElseThrow(() -> errorConflicto(
                        "El modelo no tiene preguntas asignadas"));
        return actual.equals(maximo);
    }

    private Integer calcularTotalBloques(Cuestionario cuestionario) {
        return preguntasDelModelo(cuestionario).stream()
                .map(ModeloPregunta::getBloque)
                .max(Comparator.naturalOrder())
                .orElse(0);
    }

    private CuestionarioDTO construirInstruccionesDTO(Cuestionario c) {
        return new CuestionarioDTO(
                c.getId(),
                c.getEstadoCuestionario(),
                null,
                calcularTotalBloques(c),
                instrucciones,
                List.of(),
                List.of(),
                null,
                null,
                java.util.Map.of()
        );
    }

    private CuestionarioDTO construirDTO(
            Cuestionario c, List<ModeloPregunta> bloque,
            List<RespuestaPreguntaCuestionario> respuestas,
            CalculoPuntajeHelper.ResultadoPuntaje resultado) {
        List<CuestionarioDTO.PreguntaDTO> preguntas = bloque.stream()
                .sorted(Comparator.comparing(ModeloPregunta::getOrden))
                .map(p -> new CuestionarioDTO.PreguntaDTO(
                        p.getId(), p.getTexto(), p.getDescripcion(), p.getOrden(),
                        p.getOpciones().stream()
                                .sorted(Comparator.comparing(
                                        ModeloOpcion::getOrdenVisualizacion))
                                .map(o -> new CuestionarioDTO.DetalleRespuestaDTO(
                                        o.getId(), o.getDescripcion(),
                                        o.getOrdenVisualizacion()))
                                .toList()))
                .toList();
        List<CuestionarioDTO.RespuestaDTO> respuestasDTO = respuestas.stream()
                .map(r -> new CuestionarioDTO.RespuestaDTO(
                        r.getPregunta().getId(),
                        r.getOpcionSeleccionada().getId()))
                .toList();
        Integer numeroBloque = bloque.isEmpty() ? null
                : bloque.getFirst().getBloque();
        return new CuestionarioDTO(
                c.getId(), c.getEstadoCuestionario(), numeroBloque,
                calcularTotalBloques(c), instrucciones,
                preguntas, respuestasDTO,
                resultado == null ? null : resultado.puntajeFinal(),
                resultado == null ? null : resultado.cumpleMinimo(),
                resultado == null ? java.util.Map.of()
                        : resultado.puntajesPorCompetencia());
    }

    private void registrarAcceso(Cuestionario c, LocalDateTime ahora) {
        c.setUltimoIngreso(ahora);
        c.setCantidadAccesos(c.getCantidadAccesos() == null
                ? 1 : c.getCantidadAccesos() + 1);
    }
}
