package com.diseno.miApp.Reporte;

import com.diseno.miApp.Cuestionario.Cuestionario;

import java.time.LocalDateTime;

public class EvaluacionOrdenMeritoResponse {

    private final Long idCuestionario;
    private final Long idCandidato;
    private final String apellido;
    private final String nombre;
    private final String tipoDocumento;
    private final String numeroDocumento;
    private final String estado;
    private final LocalDateTime fechaCreacion;

    public EvaluacionOrdenMeritoResponse(Cuestionario cuestionario) {
        var candidato = cuestionario.getCandidato();
        this.idCuestionario = cuestionario.getId();
        this.idCandidato = candidato == null ? null : candidato.getId();
        this.apellido = candidato == null ? null : candidato.getApellido();
        this.nombre = candidato == null ? null : candidato.getNombre();
        this.tipoDocumento = candidato == null || candidato.getTipoDocumento() == null
                ? null : candidato.getTipoDocumento().name();
        this.numeroDocumento = candidato == null ? null : candidato.getNumeroDocumento();
        this.estado = cuestionario.getEstadoCuestionario() == null
                ? null : cuestionario.getEstadoCuestionario().name();
        this.fechaCreacion = cuestionario.getFechaCreacion();
    }

    public Long getIdCuestionario() { return idCuestionario; }
    public Long getIdCandidato() { return idCandidato; }
    public String getApellido() { return apellido; }
    public String getNombre() { return nombre; }
    public String getTipoDocumento() { return tipoDocumento; }
    public String getNumeroDocumento() { return numeroDocumento; }
    public String getEstado() { return estado; }
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
}
