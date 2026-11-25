package com.diseno.miApp.Cuestionario;

import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/cuestionario")
public class CompletarCuestionarioController {
    private final CompletarCuestionarioService service;

    public CompletarCuestionarioController(CompletarCuestionarioService service) {
        this.service = service;
    }

    @PostMapping("/acceder")
    public CuestionarioDTO acceder(
            Authentication authentication,
            @Valid @RequestBody ClaveIngresoRequest request) {
        return service.accederCuestionario(
                obtenerIdCandidato(authentication), request.claveIngreso());
    }

    @PostMapping("/{idCuestionario}/iniciar")
    public CuestionarioDTO iniciar(
            Authentication authentication,
            @PathVariable Long idCuestionario) {
        return service.iniciarCuestionario(
                obtenerIdCandidato(authentication), idCuestionario);
    }

    @PatchMapping("/{idCuestionario}/respuestas")
    public CuestionarioDTO guardarParcial(
            Authentication authentication,
            @PathVariable Long idCuestionario,
            @RequestBody GuardarRespuestasRequest request) {
        return service.guardarRespuestasParciales(
                obtenerIdCandidato(authentication), idCuestionario, request);
    }

    @PostMapping("/{idCuestionario}/finalizar-bloque")
    public CuestionarioDTO finalizarBloque(
            Authentication authentication,
            @PathVariable Long idCuestionario,
            @RequestBody(required = false) GuardarRespuestasRequest request) {
        return service.finalizarBloque(
                obtenerIdCandidato(authentication), idCuestionario, request);
    }

    private Long obtenerIdCandidato(Authentication authentication) {
        return Long.valueOf(authentication.getName());
    }
}
