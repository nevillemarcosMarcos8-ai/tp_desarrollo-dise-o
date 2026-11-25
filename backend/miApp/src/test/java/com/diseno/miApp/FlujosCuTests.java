package com.diseno.miApp;

import com.diseno.miApp.Candidato.Candidato;
import com.diseno.miApp.Cuestionario.CompletarCuestionarioService;
import com.diseno.miApp.Cuestionario.Cuestionario;
import com.diseno.miApp.Cuestionario.CuestionarioCreado;
import com.diseno.miApp.Cuestionario.CuestionarioDTO;
import com.diseno.miApp.Cuestionario.CuestionarioRepository;
import com.diseno.miApp.Cuestionario.CuestionarioServices;
import com.diseno.miApp.Cuestionario.GuardarRespuestasRequest;
import com.diseno.miApp.Cuestionario.RespuestaMarcadaRequest;
import com.diseno.miApp.EstadoCuestionario.EstadoCuestionario;
import com.diseno.miApp.ModeloCuestionario.ModeloCompetencia;
import com.diseno.miApp.ModeloCuestionario.ModeloCuestionario;
import com.diseno.miApp.ModeloCuestionario.ModeloOpcion;
import com.diseno.miApp.ModeloCuestionario.ModeloOpcionRepository;
import com.diseno.miApp.ModeloCuestionario.ModeloPregunta;
import com.diseno.miApp.ModeloCuestionario.ModeloPreguntaRepository;
import com.diseno.miApp.OrdenDeMerito.OrdenMeritoGrupoDTO;
import com.diseno.miApp.Puesto.Puesto;
import com.diseno.miApp.Puesto.PuestoService;
import com.diseno.miApp.Reporte.EvaluacionPuestoDTO;
import com.diseno.miApp.Reporte.ReporteServices;
import com.diseno.miApp.RespuestaPreguntaCuestionario.RespuestaPreguntaCuestionario;
import com.diseno.miApp.RespuestaPreguntaCuestionario.RespuestaPreguntaCuestionarioService;
import com.diseno.miApp.helpers.CalculoPuntajeHelper;
import com.diseno.miApp.tipoDocumento.TipoDocumento;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class FlujosCuTests {

    @Test
    void clavesGeneradasTienenOchoCaracteresMayusculasYDigitos() {
        CuestionarioRepository repo = mock(CuestionarioRepository.class);
        when(repo.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        PasswordEncoder encoder = new BCryptPasswordEncoder(4);
        CuestionarioServices service = new CuestionarioServices(repo, encoder, Duration.ofHours(24));

        Candidato candidato = new Candidato();
        candidato.setId(1L);
        Puesto puesto = new Puesto();
        puesto.setId(1L);
        ModeloCuestionario modelo = new ModeloCuestionario();
        modelo.setId(1L);

        for (int i = 0; i < 50; i++) {
            List<CuestionarioCreado> creados = service.crearCuestionarios(List.of(candidato), puesto, modelo);
            String clave = creados.getFirst().claveIngreso();
            assertEquals(8, clave.length());
            assertEquals(clave.toUpperCase(), clave);
            assertTrue(clave.chars().anyMatch(Character::isLetter), "La clave debe incluir letras: " + clave);
            assertTrue(clave.chars().anyMatch(Character::isDigit), "La clave debe incluir dígitos: " + clave);
        }
    }

    @Test
    void completarCuestionarioMuestraInstruccionesLuegoIniciaYValidaFaltantes() {
        CuestionarioRepository repo = mock(CuestionarioRepository.class);
        ModeloPreguntaRepository preguntaRepo = mock(ModeloPreguntaRepository.class);
        ModeloOpcionRepository opcionRepo = mock(ModeloOpcionRepository.class);
        RespuestaPreguntaCuestionarioService respuestaService = mock(RespuestaPreguntaCuestionarioService.class);
        PasswordEncoder encoder = new BCryptPasswordEncoder(4);
        CalculoPuntajeHelper puntajeHelper = new CalculoPuntajeHelper();

        CompletarCuestionarioService service = new CompletarCuestionarioService(
                repo, encoder, preguntaRepo, opcionRepo, respuestaService, puntajeHelper,
                Duration.ofHours(2), 5, "Instrucciones de prueba");

        Candidato candidato = new Candidato();
        candidato.setId(10L);
        ModeloCuestionario modelo = new ModeloCuestionario();
        modelo.setId(20L);
        ModeloCompetencia comp = new ModeloCompetencia();
        comp.setIdCompetenciaOriginal(1L);
        comp.setNombreCompetencia("LIDERAZGO");
        comp.setPonderacionMinima(5);
        modelo.agregarCompetencia(comp);

        ModeloPregunta p1 = new ModeloPregunta();
        p1.setId(101L);
        p1.setBloque(1);
        p1.setOrden(1);
        p1.setIdCompetenciaOriginal(1L);
        p1.setIdFactorOriginal(10L);
        p1.setTexto("PREGUNTA 1");
        ModeloOpcion op1 = new ModeloOpcion();
        op1.setId(201L);
        op1.setDescripcion("SIEMPRE");
        op1.setOrdenVisualizacion(1);
        op1.setPonderacion(8);
        p1.agregarOpcion(op1);

        Cuestionario cuestionario = new Cuestionario();
        cuestionario.setId(99L);
        cuestionario.setCandidato(candidato);
        cuestionario.setModelo(modelo);
        cuestionario.setEstadoCuestionario(EstadoCuestionario.ACTIVO);
        cuestionario.setClaveIngreso(encoder.encode("AB12CD34"));
        cuestionario.setFechaLimiteActivo(LocalDateTime.now().plusHours(24));
        cuestionario.setCantidadAccesos(0);

        when(repo.findFirstByCandidato_IdAndEstadoCuestionarioIn(any(), anyList()))
                .thenReturn(Optional.of(cuestionario));
        when(repo.findById(99L)).thenReturn(Optional.of(cuestionario));
        when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(preguntaRepo.findByModelo_IdOrderByBloqueAscOrdenAsc(20L)).thenReturn(List.of(p1));
        when(respuestaService.obtenerPorCuestionario(99L)).thenReturn(List.of());
        when(opcionRepo.findByIdAndPregunta_Id(201L, 101L)).thenReturn(Optional.of(op1));

        // Paso 1: acceder devuelve estado ACTIVO con instrucciones sin pasar aún a EN_PROCESO
        CuestionarioDTO pasoInstrucciones = service.accederCuestionario(10L, "ab12cd34");
        assertEquals(EstadoCuestionario.ACTIVO, pasoInstrucciones.estado());
        assertEquals("Instrucciones de prueba", pasoInstrucciones.instrucciones());
        assertEquals(1, cuestionario.getCantidadAccesos());

        // Paso 2-4: aceptar instrucciones pasa a EN_PROCESO y devuelve bloque 1
        CuestionarioDTO enProceso = service.iniciarCuestionario(10L, 99L);
        assertEquals(EstadoCuestionario.EN_PROCESO, enProceso.estado());
        assertEquals(1, enProceso.bloque());
        assertEquals(1, enProceso.preguntas().size());

        // Paso 6.A: finalizar sin responder arroja error legible indicando Pregunta 1
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.finalizarBloque(10L, 99L, new GuardarRespuestasRequest(List.of())));
        assertTrue(ex.getReason() != null && ex.getReason().contains("Pregunta 1"));

        // Paso 8: responder y finalizar último bloque pasa a COMPLETO
        RespuestaPreguntaCuestionario guardada = new RespuestaPreguntaCuestionario();
        guardada.setCuestionario(cuestionario);
        guardada.setPregunta(p1);
        guardada.setOpcionSeleccionada(op1);
        when(respuestaService.obtenerPorCuestionario(99L))
                .thenReturn(List.of(), List.of(), List.of(guardada), List.of(guardada));

        CuestionarioDTO completo = service.finalizarBloque(
                10L, 99L, new GuardarRespuestasRequest(List.of(new RespuestaMarcadaRequest(101L, 201L))));
        assertEquals(EstadoCuestionario.COMPLETO, completo.estado());
        assertEquals(8.0f, completo.puntajeFinal());
        assertTrue(completo.cumplePonderacionMinima());
    }

    @Test
    void ordenDeMeritoFiltraPorEvaluacionEIncluyeDocumento() {
        CuestionarioServices cuestionarioServices = mock(CuestionarioServices.class);
        PuestoService puestoService = mock(PuestoService.class);
        RespuestaPreguntaCuestionarioService respuestaService = mock(RespuestaPreguntaCuestionarioService.class);
        CalculoPuntajeHelper puntajeHelper = new CalculoPuntajeHelper();
        ReporteServices reporteServices = new ReporteServices(
                cuestionarioServices, puestoService, respuestaService, puntajeHelper);

        Puesto puesto = new Puesto();
        puesto.setId(5L);
        when(puestoService.buscarPorId(5L)).thenReturn(puesto);

        ModeloCuestionario eval1 = new ModeloCuestionario();
        eval1.setId(100L);
        eval1.setFechaCreacion(LocalDateTime.now().minusDays(1));
        ModeloCuestionario eval2 = new ModeloCuestionario();
        eval2.setId(200L);
        eval2.setFechaCreacion(LocalDateTime.now());

        Candidato cand1 = new Candidato();
        cand1.setId(1L);
        cand1.setNombre("ANA");
        cand1.setApellido("GOMEZ");
        cand1.setTipoDocumento(TipoDocumento.DNI);
        cand1.setNumeroDocumento("40111222");

        Candidato cand2 = new Candidato();
        cand2.setId(2L);
        cand2.setNombre("LUIS");
        cand2.setApellido("PEREZ");
        cand2.setTipoDocumento(TipoDocumento.DNI);
        cand2.setNumeroDocumento("40333444");

        Cuestionario c1 = new Cuestionario();
        c1.setId(10L);
        c1.setCandidato(cand1);
        c1.setPuesto(puesto);
        c1.setModelo(eval1);
        c1.setEstadoCuestionario(EstadoCuestionario.ACTIVO);

        Cuestionario c2 = new Cuestionario();
        c2.setId(20L);
        c2.setCandidato(cand2);
        c2.setPuesto(puesto);
        c2.setModelo(eval2);
        c2.setEstadoCuestionario(EstadoCuestionario.INCOMPLETO);

        when(cuestionarioServices.buscarTodosPorPuesto(5L)).thenReturn(List.of(c1, c2));

        List<EvaluacionPuestoDTO> evaluaciones = reporteServices.obtenerEvaluacionesPorPuesto(5L);
        assertEquals(2, evaluaciones.size());

        List<OrdenMeritoGrupoDTO> filtrado = reporteServices.emitirOrdenMerito(5L, List.of(100L));
        OrdenMeritoGrupoDTO activos = filtrado.stream()
                .filter(g -> "ACTIVO".equals(g.getEstado()))
                .findFirst().orElseThrow();
        assertEquals(1, activos.getCandidatos().size());
        assertEquals("DNI", activos.getCandidatos().getFirst().getTipoDocumento());
        assertEquals("40111222", activos.getCandidatos().getFirst().getNumeroDocumento());

        OrdenMeritoGrupoDTO incompletos = filtrado.stream()
                .filter(g -> "INCOMPLETO".equals(g.getEstado()))
                .findFirst().orElseThrow();
        assertTrue(incompletos.getCandidatos().isEmpty());
    }
}
