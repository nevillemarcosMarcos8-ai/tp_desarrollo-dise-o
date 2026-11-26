package com.diseno.miApp.RegistroAuditoria;

import com.diseno.miApp.Consultor.Consultor;

/** Evento publicado por el backend tras aplicar una baja lógica permitida. */
public record BajaLogicaRealizada(
        Consultor consultor,
        TipoEntidadAuditoria tipoEntidad,
        Long idEntidad,
        String nombreEntidad) {
}
