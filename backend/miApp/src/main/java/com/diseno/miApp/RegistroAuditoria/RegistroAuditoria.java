package com.diseno.miApp.RegistroAuditoria;

import com.diseno.miApp.Consultor.Consultor;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "registro_auditoria")
public class RegistroAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_operacion", nullable = false, length = 30)
    private TipoOperacionAuditoria tipoOperacion;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_entidad", nullable = false, length = 30)
    private TipoEntidadAuditoria tipoEntidad;

    @Column(name = "id_entidad", nullable = false)
    private Long idEntidad;

    @Column(name = "nombre_entidad", nullable = false, length = 255)
    private String nombreEntidad;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "consultor_id", nullable = false)
    private Consultor usuario;

    @Column(name = "fecha_hora", nullable = false)
    private LocalDateTime fechaHora;

    protected RegistroAuditoria() {
    }

    public RegistroAuditoria(
            TipoOperacionAuditoria tipoOperacion,
            TipoEntidadAuditoria tipoEntidad,
            Long idEntidad,
            String nombreEntidad,
            Consultor usuario,
            LocalDateTime fechaHora) {
        this.tipoOperacion = tipoOperacion;
        this.tipoEntidad = tipoEntidad;
        this.idEntidad = idEntidad;
        this.nombreEntidad = nombreEntidad;
        this.usuario = usuario;
        this.fechaHora = fechaHora;
    }

    public Long getId() {
        return id;
    }
}
