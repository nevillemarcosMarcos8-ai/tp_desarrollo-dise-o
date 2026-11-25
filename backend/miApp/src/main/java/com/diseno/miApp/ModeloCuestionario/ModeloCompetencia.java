package com.diseno.miApp.ModeloCuestionario;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class ModeloCompetencia {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "modelo_cuestionario_id", nullable = false)
    private ModeloCuestionario modelo;

    private Long idCompetenciaOriginal;
    @Column(name = "codigo_competencia", length = 50)
    private String codigoCompetencia;
    private String nombreCompetencia;
    private Integer ponderacionMinima;
}
