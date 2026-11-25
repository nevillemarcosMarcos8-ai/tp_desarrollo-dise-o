package com.diseno.miApp.ExportacionResultados;

import java.time.LocalDate;

public record BuscarPuestosExportacionRequest(
        String nombre,
        String empresa,
        LocalDate desde,
        LocalDate hasta) {
}
