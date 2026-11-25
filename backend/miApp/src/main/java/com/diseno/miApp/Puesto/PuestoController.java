package com.diseno.miApp.Puesto;

import com.diseno.miApp.RegistroAuditoria.GestionBajasService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/Puesto")
public class PuestoController {

    private final PuestoService puestoService;
    private final GestionPuestoService gestionPuestoService;
    private final GestionBajasService gestionBajasService;

    public PuestoController(
            PuestoService puestoService,
            GestionPuestoService gestionPuestoService,
            GestionBajasService gestionBajasService) {
        this.puestoService = puestoService;
        this.gestionPuestoService = gestionPuestoService;
        this.gestionBajasService = gestionBajasService;
    }

    @GetMapping
    public ResponseEntity<List<PuestoSalidaResponse>> listarPuestos() {
        return ResponseEntity.ok(puestoService.listarTodos().stream()
                .map(this::aResponse).toList());
    }

    @GetMapping("/{idPuesto}")
    public ResponseEntity<PuestoSalidaResponse> buscarPorId(@PathVariable Long idPuesto) {
        return ResponseEntity.ok(aResponse(puestoService.buscarPorId(idPuesto)));
    }

    @PatchMapping("/{idPuesto}/reactivar")
    public ResponseEntity<PuestoSalidaResponse> reactivarPuesto(
            @PathVariable Long idPuesto) {
        return ResponseEntity.ok(aResponse(puestoService.reactivarPuesto(idPuesto)));
    }

    // 1. CREAR
    @PostMapping("/crear")
    public ResponseEntity<PuestoSalidaResponse> crearPuesto(
            @Valid @RequestBody PuestoCrearRequest request) {

        Puesto puesto = gestionPuestoService.crear(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(aResponse(puesto));
    }
    @PostMapping("/buscar")
    public ResponseEntity<List<PuestoSalidaResponse>> buscarPuestos(
            @RequestBody PuestoRequest request) {
        return ResponseEntity.ok(puestoService.buscarPuestosConteniendo(request).stream()
                .map(this::aResponse).toList());
    }

    @GetMapping("/{idPuesto}/caracteristicas")
    public ResponseEntity<List<PuestoSalidaResponse.CaracteristicaResponse>> obtenerCaracteristicas(
            @PathVariable Long idPuesto) {
        return ResponseEntity.ok(puestoService.obtenerCaracteristicas(idPuesto)
                .stream().map(caracteristica ->
                        new PuestoSalidaResponse.CaracteristicaResponse(
                                caracteristica.getId(),
                                caracteristica.getPonderacion(),
                                caracteristica.getCompetencia() == null ? null
                                        : caracteristica.getCompetencia().getId(),
                                caracteristica.getCompetencia() == null ? null
                                        : caracteristica.getCompetencia().getNombre()
                        )).toList());
    }
    // 3. MODIFICAR
    @PatchMapping("/modificar/{id}")
    public ResponseEntity<PuestoSalidaResponse> modificarPuesto(
            @PathVariable Long id,
            @RequestBody PuestoModificarRequest request) {

        Puesto puesto = gestionPuestoService.modificar(id, request);

        return ResponseEntity.ok(aResponse(puesto));
    }


    // 4. DAR DE BAJA
    @DeleteMapping("/baja/{id}")
    public ResponseEntity<Void> darBajaPuesto(
            @PathVariable Long id,
            HttpSession session) {

        gestionBajasService.darBajaPuesto(id, session);

        return ResponseEntity.noContent().build();
    }

    private PuestoSalidaResponse aResponse(Puesto puesto) {
        return PuestoSalidaResponse.desde(
                puesto,
                puestoService.obtenerCaracteristicas(puesto.getId())
        );
    }
}
