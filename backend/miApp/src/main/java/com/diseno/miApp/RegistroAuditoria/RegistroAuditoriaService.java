package com.diseno.miApp.RegistroAuditoria;

import com.diseno.miApp.Consultor.Consultor;
import com.diseno.miApp.Consultor.ConsultorRepository;
import com.diseno.miApp.Consultor.ConsultorSesion;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
public class RegistroAuditoriaService {

    private final ConsultorRepository consultorRepository;
    private final RegistroAuditoriaRepository auditoriaRepository;

    public RegistroAuditoriaService(
            ConsultorRepository consultorRepository,
            RegistroAuditoriaRepository auditoriaRepository) {
        this.consultorRepository = consultorRepository;
        this.auditoriaRepository = auditoriaRepository;
    }

    public Consultor consultorDeSesion(HttpSession session) {
        Object idEnSesion = session == null
                ? null
                : session.getAttribute(ConsultorSesion.ID_ATTRIBUTE);

        if (!(idEnSesion instanceof Long idConsultor)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Ingresá como consultor antes de realizar esta baja"
            );
        }

        return consultorRepository.findById(idConsultor)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "La sesión de consultor ya no es válida"
                ));
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void registrarBaja(
            Consultor usuario,
            TipoEntidadAuditoria tipoEntidad,
            Long idEntidad,
            String nombreEntidad) {
        RegistroAuditoria registro = new RegistroAuditoria(
                TipoOperacionAuditoria.BAJA_LOGICA,
                tipoEntidad,
                idEntidad,
                nombreEntidad,
                usuario,
                LocalDateTime.now()
        );
        auditoriaRepository.save(registro);
    }
}
