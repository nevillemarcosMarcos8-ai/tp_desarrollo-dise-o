package com.diseno.miApp.CaracteristicasPuesto;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CaracteristicasPuestoRepository extends JpaRepository<CaracteristicasPuesto,Long> {
    List<CaracteristicasPuesto> findByPuesto_Id(Long idPuesto);

    boolean existsByCompetencia_Id(Long idCompetencia);

    @Modifying
    @Query("DELETE FROM CaracteristicasPuesto c WHERE c.puesto.id = :idPuesto")
    void eliminarPorPuestoId(@Param("idPuesto") Long idPuesto);
}
