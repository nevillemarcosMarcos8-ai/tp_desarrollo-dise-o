package com.diseno.miApp.Cuestionario;

import com.diseno.miApp.Candidato.Candidato;
import com.diseno.miApp.EstadoCuestionario.EstadoCuestionario;
import com.diseno.miApp.Puesto.Puesto;
import com.diseno.miApp.ModeloCuestionario.ModeloCuestionario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.StringJoiner;
import java.util.stream.IntStream;

import static com.diseno.miApp.helpers.ManejoErroresHelper.errorConflicto;
import static com.diseno.miApp.helpers.ManejoErroresHelper.errorNoEncontrado;
import static com.diseno.miApp.helpers.ManejoErroresHelper.errorSolicitud;
import static com.diseno.miApp.helpers.ValidacionesHelper.validarIdPositivo;

@Service
public class CuestionarioServices {

    private static final List<EstadoCuestionario> ESTADOS_ABIERTOS = List.of(
            EstadoCuestionario.ACTIVO,
            EstadoCuestionario.EN_PROCESO
    );
    private static final char[] LETRAS_CLAVE =
            "ABCDEFGHJKLMNPQRSTUVWXYZ".toCharArray();
    private static final char[] DIGITOS_CLAVE =
            "0123456789".toCharArray();
    private static final char[] CARACTERES_CLAVE =
            "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789".toCharArray();
    private static final int LONGITUD_CLAVE = 8;

    private final CuestionarioRepository cuestionarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final Duration plazoActivo;
    private final SecureRandom random = new SecureRandom();

    public CuestionarioServices(
            CuestionarioRepository cuestionarioRepository,
            PasswordEncoder passwordEncoder,
            @Value("${cuestionario.plazo-activo}") Duration plazoActivo) {
        this.cuestionarioRepository = cuestionarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.plazoActivo = plazoActivo;
    }


    public List<Cuestionario> buscarTodosPorPuesto(Long idPuesto) {
        return cuestionarioRepository.findByPuesto_Id(idPuesto);
    }

    @Transactional(readOnly = true)
    public List<Cuestionario> buscarCompletosPorPuesto(Long idPuesto) {
        validarIdPositivo(idPuesto, "El ID del puesto debe ser positivo");
        return cuestionarioRepository.findByPuesto_IdAndEstadoCuestionario(
                idPuesto, EstadoCuestionario.COMPLETO);
    }

    @Transactional(readOnly = true)
    public Cuestionario buscarPorId(Long idCuestionario) {
        validarIdPositivo(idCuestionario,
                "El ID del cuestionario debe ser positivo");
        return cuestionarioRepository.findById(idCuestionario)
                .orElseThrow(() -> errorNoEncontrado("Cuestionario no encontrado"));
    }

    public void validarSinCuestionarioActivoOEnProceso(
            List<Long> idsCandidatos) {
        if (idsCandidatos == null || idsCandidatos.isEmpty()) {
            throw errorSolicitud("Debe seleccionar al menos un candidato");
        }

        StringJoiner candidatosOcupados = new StringJoiner(", ");

        for (Long idCandidato : idsCandidatos) {
            cuestionarioRepository
                    .findFirstByCandidato_IdAndEstadoCuestionarioIn(
                            idCandidato,
                            ESTADOS_ABIERTOS)
                    .ifPresent(cuestionario -> {
                        Candidato candidato = cuestionario.getCandidato();
                        String nombre = candidato == null
                                ? "ID " + idCandidato
                                : candidato.getApellido() + ", "
                                        + candidato.getNombre()
                                        + " (ID " + idCandidato + ")";
                        candidatosOcupados.add(nombre);
                    });
        }

        if (candidatosOcupados.length() > 0) {
            throw errorConflicto(
                    "No se pueden volver a evaluar estos candidatos porque " +
                            "ya tienen un cuestionario activo o en proceso: " +
                            candidatosOcupados);
        }
    }

    @Transactional
    public List<CuestionarioCreado> crearCuestionarios(
            List<Candidato> candidatos,
            Puesto puesto,
            ModeloCuestionario modelo) {
        if (candidatos == null || candidatos.isEmpty()) {
            throw errorSolicitud("Debe seleccionar al menos un candidato");
        }
        if (puesto == null || puesto.getId() == null) {
            throw errorSolicitud("Debe indicar el puesto de la evaluación");
        }
        if (modelo == null || modelo.getId() == null) {
            throw errorSolicitud("Debe indicar el modelo congelado de la evaluación");
        }

        LocalDateTime ahora = LocalDateTime.now();
        List<Cuestionario> nuevos = new ArrayList<>();
        List<String> clavesEnClaro = new ArrayList<>();

        for (Candidato candidato : candidatos) {
            Cuestionario cuestionario = new Cuestionario();
            cuestionario.setCandidato(candidato);
            cuestionario.setPuesto(puesto);
            cuestionario.setModelo(modelo);
            cuestionario.setEstadoCuestionario(EstadoCuestionario.ACTIVO);
            String claveEnClaro = generarClaveIngreso();
            clavesEnClaro.add(claveEnClaro);
            cuestionario.setClaveIngreso(passwordEncoder.encode(claveEnClaro));
            cuestionario.setFechaCreacion(ahora);
            cuestionario.setFechaLimiteActivo(ahora.plus(plazoActivo));
            cuestionario.setFechaCambioEstado(ahora);
            cuestionario.setCantidadAccesos(0);
            nuevos.add(cuestionario);
        }

        // uk_cuestionario_candidato_abierto es la última defensa ante
        // solicitudes simultáneas. Si falla una inserción, la transacción
        // revierte la creación del lote completo.
        List<Cuestionario> guardados = cuestionarioRepository.saveAll(nuevos);
        return IntStream.range(0, guardados.size())
                .mapToObj(indice -> new CuestionarioCreado(
                        guardados.get(indice), clavesEnClaro.get(indice)))
                .toList();
    }

    private String generarClaveIngreso() {
        char[] chars = new char[LONGITUD_CLAVE];
        chars[0] = LETRAS_CLAVE[random.nextInt(LETRAS_CLAVE.length)];
        chars[1] = DIGITOS_CLAVE[random.nextInt(DIGITOS_CLAVE.length)];
        for (int i = 2; i < LONGITUD_CLAVE; i++) {
            chars[i] = CARACTERES_CLAVE[random.nextInt(CARACTERES_CLAVE.length)];
        }
        for (int i = chars.length - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            char tmp = chars[i];
            chars[i] = chars[j];
            chars[j] = tmp;
        }
        return new String(chars);
    }

    public List<CandidatoPorPuestoProjection> buscarCandidatosPorPuestoCuestionario(
            List<Long> idsPuestos) {
        validarIdsPuestos(idsPuestos);

        if (idsPuestos.isEmpty()) {
            return List.of();
        }

        return cuestionarioRepository
                .buscarCandidatosPorPuestoCuestionario(idsPuestos);
    }

    public List<EvaluacionesCompletasPorPuestoProjection>
    contarCuestionariosCompletosPorPuestos(List<Long> idsPuestos) {
        validarIdsPuestos(idsPuestos);

        if (idsPuestos.isEmpty()) {
            return List.of();
        }

        return cuestionarioRepository.contarEvaluacionesCompletasPorPuestos(
                idsPuestos,
                EstadoCuestionario.COMPLETO
        );
    }

    private void validarIdsPuestos(List<Long> idsPuestos) {
        if (idsPuestos == null
                || idsPuestos.stream().anyMatch(id -> id == null || id <= 0)) {
            throw errorSolicitud("Los IDs de puesto deben ser positivos");
        }
    }

}
