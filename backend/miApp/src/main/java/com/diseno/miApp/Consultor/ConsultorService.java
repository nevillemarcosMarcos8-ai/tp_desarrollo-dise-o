package com.diseno.miApp.Consultor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.diseno.miApp.helpers.ManejoErroresHelper.errorNoEncontrado;
import static com.diseno.miApp.helpers.ValidacionesHelper.normalizarMayusculasObligatorio;

@Service
public class ConsultorService {

    private final ConsultorRepository repository;

    public ConsultorService(ConsultorRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public ConsultorSesionResponse obtenerOCrear(String nombreIngresado) {
        String nombre = normalizarMayusculasObligatorio(
                nombreIngresado,
                "Ingresá tu nombre",
                100
        );

        Consultor consultor = repository.findByNombre(nombre)
                .orElseGet(() -> repository.save(new Consultor(nombre)));

        return respuesta(consultor);
    }

    @Transactional(readOnly = true)
    public ConsultorSesionResponse buscarParaSesion(Long idConsultor) {
        Consultor consultor = repository.findById(idConsultor)
                .orElseThrow(() -> errorNoEncontrado(
                        "No se encontró el consultor de la sesión"
                ));
        return respuesta(consultor);
    }

    private ConsultorSesionResponse respuesta(Consultor consultor) {
        return new ConsultorSesionResponse(
                consultor.getId(),
                consultor.getNombre()
        );
    }
}
