package com.diseno.miApp.Pregunta;

import com.diseno.miApp.RegistroAuditoria.GestionBajasService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/Pregunta")
public class PreguntaController {

    private final PreguntaService preguntaService;
    private final GestionPreguntaService gestionPreguntaService;
    private final GestionBajasService gestionBajasService;

    public PreguntaController(
            PreguntaService preguntaService,
            GestionPreguntaService gestionPreguntaService,
            GestionBajasService gestionBajasService) {
        this.preguntaService = preguntaService;
        this.gestionPreguntaService = gestionPreguntaService;
        this.gestionBajasService = gestionBajasService;
    }

    @GetMapping
    public ResponseEntity<List<Pregunta>> listarPreguntas() {
        return ResponseEntity.ok(preguntaService.listarTodas());
    }

    @PostMapping("/buscar")
    public ResponseEntity<List<Pregunta>> buscar(
            @RequestBody PreguntaBuscarRequest request) {
        return ResponseEntity.ok(preguntaService.buscarConteniendo(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pregunta> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(preguntaService.buscarPorId(id));
    }

    @PatchMapping("/{id}/reactivar")
    public ResponseEntity<Pregunta> reactivarPregunta(
            @PathVariable Long id) {
        return ResponseEntity.ok(preguntaService.reactivarPregunta(id));
    }

    @PostMapping("/crear")
    public ResponseEntity<Pregunta> crearPregunta(
            @Valid @RequestBody PreguntaCrearRequest request) {

        Pregunta pregunta = gestionPreguntaService.crearPregunta(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(pregunta);
    }

    @PatchMapping("/modificar/{id}")
    public ResponseEntity<Pregunta> modificarPregunta(
            @PathVariable Long id,
            @Valid @RequestBody PreguntaModificarRequest request) {

        Pregunta pregunta = gestionPreguntaService.modificarPregunta(id, request);

        return ResponseEntity.ok(pregunta);
    }

    @DeleteMapping("/eliminar/{id}")
    public ResponseEntity<Void> eliminarPregunta(
            @PathVariable Long id,
            HttpSession session) {

        gestionBajasService.darBajaPregunta(id, session);

        return ResponseEntity.noContent().build();
    }
}
