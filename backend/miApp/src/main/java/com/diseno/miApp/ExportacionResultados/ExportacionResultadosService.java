package com.diseno.miApp.ExportacionResultados;

import com.diseno.miApp.Candidato.Candidato;
import com.diseno.miApp.Competencia.CompetenciaRepository;
import com.diseno.miApp.Cuestionario.Cuestionario;
import com.diseno.miApp.Cuestionario.CuestionarioRepository;
import com.diseno.miApp.EstadoCuestionario.EstadoCuestionario;
import com.diseno.miApp.ModeloCuestionario.ModeloCompetencia;
import com.diseno.miApp.ModeloCuestionario.ModeloCuestionario;
import com.diseno.miApp.Puesto.Puesto;
import com.diseno.miApp.Puesto.PuestoService;
import com.diseno.miApp.RespuestaPreguntaCuestionario.RespuestaPreguntaCuestionario;
import com.diseno.miApp.RespuestaPreguntaCuestionario.RespuestaPreguntaCuestionarioService;
import com.diseno.miApp.helpers.CalculoPuntajeHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Pattern;

import static com.diseno.miApp.helpers.ManejoErroresHelper.errorNoEncontrado;
import static com.diseno.miApp.helpers.ManejoErroresHelper.errorSolicitud;
import static com.diseno.miApp.helpers.ValidacionesHelper.normalizarMayusculasOpcional;
import static com.diseno.miApp.helpers.ValidacionesHelper.validarAlMenosUnCriterio;
import static com.diseno.miApp.helpers.ValidacionesHelper.validarIdPositivo;

@Service
public class ExportacionResultadosService {

    private static final DateTimeFormatter FECHA_ARCHIVO =
            DateTimeFormatter.ofPattern("yyyy-MM-dd-HH-mm");
    private static final DateTimeFormatter FECHA_CSV =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final Pattern CARACTERES_INVALIDOS_ARCHIVO =
            Pattern.compile("[\\\\/:*?\"<>|\\p{Cntrl}]");

    private static final List<String> ENCABEZADOS = List.of(
            "Nro candidato",
            "Apellido",
            "Nombre",
            "Tipo documento",
            "Nro documento",
            "Código Competencia",
            "Resultado",
            "Nombre puesto",
            "Código puesto",
            "Fecha finalización cuestionario");

    private final CuestionarioRepository cuestionarioRepository;
    private final CompetenciaRepository competenciaRepository;
    private final PuestoService puestoService;
    private final RespuestaPreguntaCuestionarioService respuestaService;
    private final CalculoPuntajeHelper calculoPuntajeHelper;

    public ExportacionResultadosService(
            CuestionarioRepository cuestionarioRepository,
            CompetenciaRepository competenciaRepository,
            PuestoService puestoService,
            RespuestaPreguntaCuestionarioService respuestaService,
            CalculoPuntajeHelper calculoPuntajeHelper) {
        this.cuestionarioRepository = cuestionarioRepository;
        this.competenciaRepository = competenciaRepository;
        this.puestoService = puestoService;
        this.respuestaService = respuestaService;
        this.calculoPuntajeHelper = calculoPuntajeHelper;
    }

    @Transactional(readOnly = true)
    public List<PuestoExportacionResponse> buscarPuestos(
            BuscarPuestosExportacionRequest request) {
        if (request == null) {
            throw errorSolicitud("Debe enviar los filtros de búsqueda");
        }
        String nombre = normalizarMayusculasOpcional(request.nombre());
        String empresa = normalizarMayusculasOpcional(request.empresa());
        validarFechas(request.desde(), request.hasta());
        validarAlMenosUnCriterio(
                "Complete al menos un filtro para buscar puestos",
                nombre, empresa, request.desde(), request.hasta());

        RangoFechas rango = crearRango(request.desde(), request.hasta());
        return cuestionarioRepository.buscarPuestosConResultadosCompletos(
                        EstadoCuestionario.COMPLETO,
                        nombre,
                        empresa,
                        rango.desde(),
                        rango.hastaExclusivo())
                .stream()
                .map(puesto -> new PuestoExportacionResponse(
                        puesto.getId(),
                        puesto.getCodigo(),
                        puesto.getNombre(),
                        puesto.getEmpresa() == null
                                ? null : puesto.getEmpresa().getNombre()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CandidatoExportacionResponse> listarCandidatos(
            Long idPuesto,
            LocalDate desde,
            LocalDate hasta) {
        List<Cuestionario> cuestionarios =
                buscarCuestionariosCompletos(idPuesto, desde, hasta);
        return cuestionarios.stream()
                .map(this::aCandidatoResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ArchivoCsv generarCsv(
            Long idPuesto,
            LocalDate desde,
            LocalDate hasta) {
        Puesto puesto = puestoService.buscarPorId(idPuesto);
        List<Cuestionario> cuestionarios =
                buscarCuestionariosCompletos(idPuesto, desde, hasta);
        if (cuestionarios.isEmpty()) {
            throw errorNoEncontrado(
                    "No hay candidatos con cuestionarios completos en ese período");
        }

        StringBuilder csv = new StringBuilder("\uFEFF");
        agregarFila(csv, ENCABEZADOS);
        for (Cuestionario cuestionario : cuestionarios) {
            agregarFilasCandidato(csv, cuestionario, puesto);
        }

        String empresa = puesto.getEmpresa() == null
                ? "Empresa" : puesto.getEmpresa().getNombre();
        String nombreArchivo = FECHA_ARCHIVO.format(LocalDateTime.now())
                + "-" + parteNombreArchivo(empresa)
                + "-" + parteNombreArchivo(puesto.getNombre())
                + ".csv";
        return new ArchivoCsv(nombreArchivo,
                csv.toString().getBytes(StandardCharsets.UTF_8));
    }

    private List<Cuestionario> buscarCuestionariosCompletos(
            Long idPuesto,
            LocalDate desde,
            LocalDate hasta) {
        validarIdPositivo(idPuesto, "El ID del puesto debe ser positivo");
        validarFechas(desde, hasta);
        puestoService.buscarPorId(idPuesto);
        RangoFechas rango = crearRango(desde, hasta);
        return cuestionarioRepository.buscarEvaluacionesCompletasParaExportar(
                idPuesto,
                EstadoCuestionario.COMPLETO,
                rango.desde(),
                rango.hastaExclusivo());
    }

    private void agregarFilasCandidato(
            StringBuilder csv,
            Cuestionario cuestionario,
            Puesto puesto) {
        Candidato candidato = cuestionario.getCandidato();
        ModeloCuestionario modelo = cuestionario.getModelo();
        if (candidato == null || cuestionario.getFechaRealizacion() == null) {
            throw errorSolicitud(
                    "Un cuestionario completo no tiene candidato o fecha de finalización");
        }
        if (modelo == null || modelo.getCompetencias() == null
                || modelo.getCompetencias().isEmpty()) {
            throw errorSolicitud(
                    "El cuestionario completo no tiene competencias congeladas");
        }

        List<RespuestaPreguntaCuestionario> respuestas =
                respuestaService.obtenerPorCuestionario(cuestionario.getId());
        CalculoPuntajeHelper.ResultadoPuntaje resultado =
                calculoPuntajeHelper.calcularResultado(
                        respuestas, modelo.getCompetencias());
        Map<Long, Double> puntajes = resultado.puntajesPorCompetencia();

        for (ModeloCompetencia competencia : modelo.getCompetencias()) {
            Long idCompetencia = competencia.getIdCompetenciaOriginal();
            String codigoCompetencia = codigoCompetencia(competencia);
            Double puntaje = idCompetencia == null
                    ? null : puntajes.get(idCompetencia);
            if (codigoCompetencia == null || codigoCompetencia.isBlank()
                    || puntaje == null) {
                throw errorSolicitud(
                        "El modelo congelado no tiene el código o el resultado de una competencia");
            }

            agregarFila(csv, List.of(
                    Objects.toString(candidato.getNumeroCandidato(), ""),
                    Objects.toString(candidato.getApellido(), ""),
                    Objects.toString(candidato.getNombre(), ""),
                    candidato.getTipoDocumento() == null
                            ? "" : candidato.getTipoDocumento().name(),
                    Objects.toString(candidato.getNumeroDocumento(), ""),
                    codigoCompetencia,
                    String.format(Locale.ROOT, "%.2f", puntaje),
                    Objects.toString(puesto.getNombre(), ""),
                    Objects.toString(puesto.getCodigo(), ""),
                    FECHA_CSV.format(cuestionario.getFechaRealizacion())));
        }
    }

    private CandidatoExportacionResponse aCandidatoResponse(
            Cuestionario cuestionario) {
        Candidato candidato = cuestionario.getCandidato();
        if (candidato == null || cuestionario.getFechaRealizacion() == null) {
            throw errorSolicitud(
                    "Un cuestionario completo no tiene candidato o fecha de finalización");
        }
        return new CandidatoExportacionResponse(
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

    private String codigoCompetencia(ModeloCompetencia modeloCompetencia) {
        if (modeloCompetencia.getCodigoCompetencia() != null
                && !modeloCompetencia.getCodigoCompetencia().isBlank()) {
            return modeloCompetencia.getCodigoCompetencia();
        }
        if (modeloCompetencia.getIdCompetenciaOriginal() == null) {
            return null;
        }
        // Compatibilidad con cuestionarios creados antes de guardar la copia.
        return competenciaRepository.findById(
                        modeloCompetencia.getIdCompetenciaOriginal())
                .map(competencia -> competencia.getCodigo())
                .orElse(null);
    }

    private void agregarFila(StringBuilder csv, List<String> valores) {
        for (int i = 0; i < valores.size(); i++) {
            if (i > 0) {
                csv.append(';');
            }
            csv.append(escaparCampo(valores.get(i)));
        }
        csv.append("\r\n");
    }

    private String escaparCampo(String valor) {
        String seguro = Objects.toString(valor, "");
        if (seguro.contains(";") || seguro.contains("\"")
                || seguro.contains("\r") || seguro.contains("\n")) {
            return "\"" + seguro.replace("\"", "\"\"") + "\"";
        }
        return seguro;
    }

    private String parteNombreArchivo(String valor) {
        String seguro = CARACTERES_INVALIDOS_ARCHIVO.matcher(
                Objects.toString(valor, "")).replaceAll("-").trim();
        seguro = seguro.replaceAll("\\s+", "-");
        return seguro.isBlank() ? "SinNombre" : seguro;
    }

    private void validarFechas(LocalDate desde, LocalDate hasta) {
        if (desde != null && hasta != null && desde.isAfter(hasta)) {
            throw errorSolicitud(
                    "La fecha desde no puede ser posterior a la fecha hasta");
        }
    }

    private RangoFechas crearRango(LocalDate desde, LocalDate hasta) {
        return new RangoFechas(
                desde == null ? null : desde.atStartOfDay(),
                hasta == null ? null : hasta.plusDays(1).atStartOfDay());
    }

    private record RangoFechas(
            LocalDateTime desde,
            LocalDateTime hastaExclusivo) {
    }

    public record ArchivoCsv(String nombre, byte[] contenido) {
    }
}
