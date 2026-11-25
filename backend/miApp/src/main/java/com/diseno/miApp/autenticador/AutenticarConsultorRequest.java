package com.diseno.miApp.autenticador;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AutenticarConsultorRequest(
        @NotBlank(message = "Ingresá tu nombre")
        @Size(max = 100, message = "El nombre no puede superar 100 caracteres")
        String nombre) {
}
