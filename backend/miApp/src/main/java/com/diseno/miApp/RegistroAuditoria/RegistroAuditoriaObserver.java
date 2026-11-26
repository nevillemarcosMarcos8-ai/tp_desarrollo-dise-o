package com.diseno.miApp.RegistroAuditoria;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/** Observador que convierte las bajas exitosas en filas de auditoría. */
@Component
public class RegistroAuditoriaObserver {
    private final RegistroAuditoriaService auditoriaService;

    public RegistroAuditoriaObserver(RegistroAuditoriaService auditoriaService) {
        this.auditoriaService = auditoriaService;
    }

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void alRealizarseUnaBaja(BajaLogicaRealizada evento) {
        auditoriaService.registrarBaja(
                evento.consultor(),
                evento.tipoEntidad(),
                evento.idEntidad(),
                evento.nombreEntidad());
    }
}
