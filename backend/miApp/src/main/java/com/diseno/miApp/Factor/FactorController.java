package com.diseno.miApp.Factor;

import com.diseno.miApp.Competencia.FactorModificarRequest;
import com.diseno.miApp.RegistroAuditoria.GestionBajasService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/factor")
public class FactorController {

    private final FactorService factorService;
    private final GestionFactorService gestionFactorService;
    private final GestionBajasService gestionBajasService;

    public FactorController(
            FactorService factorService,
            GestionFactorService gestionFactorService,
            GestionBajasService gestionBajasService) {
        this.factorService = factorService;
        this.gestionFactorService = gestionFactorService;
        this.gestionBajasService = gestionBajasService;
    }

    @GetMapping
    public ResponseEntity<List<FactorResponse>> listarFactores() {
        return ResponseEntity.ok(factorService.listarTodos().stream()
                .map(FactorResponse::desde).toList());
    }

    @PostMapping("/buscar")
    public ResponseEntity<List<FactorResponse>> buscar(
            @RequestBody FactorBuscarRequest request) {
        return ResponseEntity.ok(factorService.buscarConteniendo(request)
                .stream().map(FactorResponse::desde).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FactorResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(FactorResponse.desde(factorService.buscarPorId(id)));
    }

    @GetMapping("/competencia/{idCompetencia}")
    public ResponseEntity<List<FactorResponse>> listarPorCompetencia(
            @PathVariable Long idCompetencia) {
        return ResponseEntity.ok(
                gestionFactorService.listarPorCompetencia(idCompetencia)
        );
    }

    @PatchMapping("/{id}/reactivar")
    public ResponseEntity<FactorResponse> reactivarFactor(@PathVariable Long id) {
        return ResponseEntity.ok(FactorResponse.desde(factorService.reactivarFactor(id)));
    }

    @PostMapping
    public ResponseEntity<FactorResponse> crearFactor(
            @RequestBody FactorCrearRequest request) {

        FactorResponse response = gestionFactorService.crearFactor(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    @PatchMapping("/{id}")
    public ResponseEntity<FactorResponse> modificarFactor(
            @PathVariable Long id,
            @RequestBody FactorModificarRequest request) {

        FactorResponse response =
                gestionFactorService.modificarFactor(id, request);

        return ResponseEntity.ok(response);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarFactor(
            @PathVariable Long id,
            HttpSession session) {

        gestionBajasService.darBajaFactor(id, session);

        return ResponseEntity.noContent().build();
    }

}
