package com.diseno.miApp.Cuestionario;

import com.diseno.miApp.EstadoCuestionario.EstadoCuestionario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;
import com.diseno.miApp.Puesto.Puesto;

@Repository
public interface CuestionarioRepository extends JpaRepository<Cuestionario,Long> {
    @Query("""
            SELECT DISTINCT new com.diseno.miApp.Cuestionario.CandidatoPorPuestoProjection(
                c.puesto.id,
                c.candidato
            )
            FROM Cuestionario c
            WHERE c.puesto.id IN :idsPuestos
              AND c.candidato IS NOT NULL
            """)
    List<CandidatoPorPuestoProjection> buscarCandidatosPorPuestoCuestionario(
            @Param("idsPuestos") List<Long> idsPuestos
    );

    @Query("""
            SELECT new com.diseno.miApp.Cuestionario.EvaluacionesCompletasPorPuestoProjection(
                c.puesto.id,
                COUNT(c)
            )
            FROM Cuestionario c
            WHERE c.puesto.id IN :idsPuestos
              AND c.estadoCuestionario = :estado
            GROUP BY c.puesto.id
            """)
    List<EvaluacionesCompletasPorPuestoProjection> contarEvaluacionesCompletasPorPuestos(
            @Param("idsPuestos") List<Long> idsPuestos,
            @Param("estado") EstadoCuestionario estado
    );

    List<Cuestionario> findByPuesto_IdAndEstadoCuestionario(
            Long puestoId,
            EstadoCuestionario estadoCuestionario
    );

    List<Cuestionario> findByPuesto_Id(Long puestoId);

    boolean existsByPuesto_Id(Long puestoId);

    Optional<Cuestionario> findFirstByCandidato_IdAndEstadoCuestionarioIn(
            Long candidatoId,
            List<EstadoCuestionario> estados
    );

    @Query("""
            SELECT DISTINCT c.puesto
            FROM Cuestionario c
            JOIN c.puesto p
            LEFT JOIN p.empresa e
            WHERE c.estadoCuestionario = :estado
              AND c.fechaRealizacion IS NOT NULL
              AND (:desde IS NULL OR c.fechaRealizacion >= :desde)
              AND (:hastaExclusivo IS NULL OR c.fechaRealizacion < :hastaExclusivo)
              AND (:nombre IS NULL OR p.nombre LIKE CONCAT('%', :nombre, '%'))
              AND (:empresa IS NULL OR e.nombre LIKE CONCAT('%', :empresa, '%'))
            ORDER BY p.nombre
            """)
    List<Puesto> buscarPuestosConResultadosCompletos(
            @Param("estado") EstadoCuestionario estado,
            @Param("nombre") String nombre,
            @Param("empresa") String empresa,
            @Param("desde") LocalDateTime desde,
            @Param("hastaExclusivo") LocalDateTime hastaExclusivo);

    @Query("""
            SELECT c
            FROM Cuestionario c
            JOIN FETCH c.candidato
            JOIN FETCH c.puesto
            LEFT JOIN FETCH c.modelo
            WHERE c.puesto.id = :idPuesto
              AND c.estadoCuestionario = :estado
              AND c.fechaRealizacion IS NOT NULL
              AND (:desde IS NULL OR c.fechaRealizacion >= :desde)
              AND (:hastaExclusivo IS NULL OR c.fechaRealizacion < :hastaExclusivo)
            ORDER BY c.fechaRealizacion DESC, c.id
            """)
    List<Cuestionario> buscarEvaluacionesCompletasParaExportar(
            @Param("idPuesto") Long idPuesto,
            @Param("estado") EstadoCuestionario estado,
            @Param("desde") LocalDateTime desde,
            @Param("hastaExclusivo") LocalDateTime hastaExclusivo);
}
