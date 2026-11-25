package com.diseno.miApp.Consultor;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ConsultorRepository extends JpaRepository<Consultor, Long> {
    Optional<Consultor> findByNombre(String nombre);
}
