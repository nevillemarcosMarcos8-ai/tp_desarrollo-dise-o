package com.diseno.miApp.autenticador;

import com.diseno.miApp.Consultor.ConsultorSesion;
import com.diseno.miApp.Consultor.ConsultorSesionResponse;
import com.diseno.miApp.Consultor.ConsultorService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/login")
public class AutenticarController {
    private final AutenticarService autenticarService;
    private final ConsultorService consultorService;

    public AutenticarController(
            AutenticarService service,
            ConsultorService consultorService) {
        this.autenticarService=service;
        this.consultorService = consultorService;
    }
  @PostMapping("/candidato")
    public AutenticarResponse autenticarCandidato(
            @Valid @RequestBody AutenticarCandidatoRequest request
  ){
      return autenticarService.autenticarCandidato(request);
  }
  @PostMapping("/consultor")
    public ConsultorSesionResponse ingresarConsultor(
            @Valid @RequestBody AutenticarConsultorRequest request,
            HttpSession session
  ){
        ConsultorSesionResponse consultor =
                consultorService.obtenerOCrear(request.nombre());
        session.setAttribute(ConsultorSesion.ID_ATTRIBUTE,
                consultor.idConsultor());
        return consultor;
  }

  @GetMapping("/consultor/sesion")
  public ConsultorSesionResponse obtenerSesionConsultor(
          HttpServletRequest request) {
      HttpSession session = request.getSession(false);
      Object idEnSesion = session == null
              ? null
              : session.getAttribute(ConsultorSesion.ID_ATTRIBUTE);

      if (!(idEnSesion instanceof Long idConsultor)) {
          throw new ResponseStatusException(
                  HttpStatus.UNAUTHORIZED,
                  "No hay una sesión de consultor iniciada"
          );
      }

      return consultorService.buscarParaSesion(idConsultor);
  }

  @PostMapping("/consultor/salir")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void cerrarSesionConsultor(HttpServletRequest request) {
      HttpSession session = request.getSession(false);
      if (session != null) {
          session.invalidate();
      }
  }
}
