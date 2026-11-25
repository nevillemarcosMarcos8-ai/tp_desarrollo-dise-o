package com.diseno.miApp.ExportacionResultados;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/ExportacionResultados")
public class ExportacionResultadosController {

    private final ExportacionResultadosService service;

    public ExportacionResultadosController(ExportacionResultadosService service) {
        this.service = service;
    }

    @PostMapping("/puestos/buscar")
    public ResponseEntity<List<PuestoExportacionResponse>> buscarPuestos(
            @RequestBody BuscarPuestosExportacionRequest request) {
        return ResponseEntity.ok(service.buscarPuestos(request));
    }

    @GetMapping("/puestos/{idPuesto}/candidatos")
    public ResponseEntity<List<CandidatoExportacionResponse>> listarCandidatos(
            @PathVariable Long idPuesto,
            @RequestParam(required = false) LocalDate desde,
            @RequestParam(required = false) LocalDate hasta) {
        return ResponseEntity.ok(service.listarCandidatos(idPuesto, desde, hasta));
    }

    @GetMapping("/puestos/{idPuesto}/csv")
    public ResponseEntity<byte[]> exportarCsv(
            @PathVariable Long idPuesto,
            @RequestParam(required = false) LocalDate desde,
            @RequestParam(required = false) LocalDate hasta) {
        ExportacionResultadosService.ArchivoCsv archivo =
                service.generarCsv(idPuesto, desde, hasta);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename(archivo.nombre(), StandardCharsets.UTF_8)
                .build());
        headers.setContentLength(archivo.contenido().length);
        return ResponseEntity.ok().headers(headers).body(archivo.contenido());
    }
}
