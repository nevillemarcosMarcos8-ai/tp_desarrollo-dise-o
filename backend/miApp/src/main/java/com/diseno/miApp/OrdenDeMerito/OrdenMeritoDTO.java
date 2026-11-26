package com.diseno.miApp.OrdenDeMerito;

import com.diseno.miApp.Candidato.Candidato;
import com.diseno.miApp.Cuestionario.Cuestionario;

import java.time.LocalDateTime;

public class OrdenMeritoDTO {

    private final Long idCuestionario;
    private final Long idCandidato;
    private final String nombre;
    private final String apellido;
    private final String tipoDocumento;
    private final String numeroDocumento;
    private final Float puntajeObtenido;
    private Integer ordenMerito;
    private final LocalDateTime fechaInicio;
    private final LocalDateTime fechaFin;
    private final LocalDateTime ultimoIngreso;
    private final Integer cantidadAccesos;

    public OrdenMeritoDTO(Cuestionario cuestionario, Float puntajeObtenido) {
        Candidato candidato = cuestionario.getCandidato();

        this.idCuestionario = cuestionario.getId();
        this.idCandidato = candidato == null ? null : candidato.getId();
        this.nombre = candidato == null ? null : candidato.getNombre();
        this.apellido = candidato == null ? null : candidato.getApellido();
        this.tipoDocumento = candidato == null || candidato.getTipoDocumento() == null
                ? null : candidato.getTipoDocumento().name();
        this.numeroDocumento = candidato == null
                ? null : candidato.getNumeroDocumento();
        this.puntajeObtenido = puntajeObtenido;
        this.fechaInicio = cuestionario.getFechaInicio();
        this.fechaFin = cuestionario.getFechaRealizacion();
        this.ultimoIngreso = cuestionario.getUltimoIngreso();
        this.cantidadAccesos = cuestionario.getCantidadAccesos();
    }

    public Long getIdCuestionario() {
        return idCuestionario;
    }

    public Long getIdCandidato() {
        return idCandidato;
    }

    public String getNombre() {
        return nombre;
    }

    public String getApellido() {
        return apellido;
    }

    public String getTipoDocumento() {
        return tipoDocumento;
    }

    public String getNumeroDocumento() {
        return numeroDocumento;
    }

    public Float getPuntajeObtenido() {
        return puntajeObtenido;
    }

    public Integer getOrdenMerito() {
        return ordenMerito;
    }

    public void setOrdenMerito(Integer ordenMerito) {
        this.ordenMerito = ordenMerito;
    }

    public LocalDateTime getFechaInicio() {
        return fechaInicio;
    }

    public LocalDateTime getFechaFin() {
        return fechaFin;
    }

    public LocalDateTime getUltimoIngreso() {
        return ultimoIngreso;
    }

    public Integer getCantidadAccesos() {
        return cantidadAccesos;
    }
}
