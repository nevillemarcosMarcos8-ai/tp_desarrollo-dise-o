package com.diseno.miApp.Factor;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public interface FactorRepository extends JpaRepository<Factor,Long> {
    List<Factor> findByCompetenciaId(Long id);
    boolean existsByCompetencia_Id(Long idCompetencia);
    Optional<Factor> findByCompetenciaIdAndNombre(
            Long id,
            String nombreFactor
    );
    Optional<Factor> findByNombre(
            String nombreFactor
    );

    @Query("""
        SELECT f
        FROM Factor f
        JOIN f.competencia c
        WHERE (:competenciaId IS NULL OR c.id = :competenciaId)
          AND (:competencia IS NULL OR c.nombre LIKE :competencia)
          AND (:codigo IS NULL OR f.codigo LIKE :codigo)
          AND (:factor IS NULL OR f.nombre LIKE :factor)
    """)
    List<Factor> buscarConteniendo(
            @Param("competenciaId") Long competenciaId,
            @Param("competencia") String competencia,
            @Param("codigo") String codigo,
            @Param("factor") String factor
    );
}
