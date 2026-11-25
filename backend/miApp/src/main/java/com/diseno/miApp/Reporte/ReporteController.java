package com.diseno.miApp.Reporte;

import com.diseno.miApp.OrdenDeMerito.OrdenMeritoGrupoDTO;
import com.diseno.miApp.Puesto.PuestoRequest;
import com.diseno.miApp.Puesto.PuestoResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/Reporte")
public class ReporteController {

    private final ReporteServices reporteServices;

    public ReporteController(ReporteServices reporteServices) {
        this.reporteServices = reporteServices;
    }

    @PostMapping("/puestos/buscar")
    public ResponseEntity<List<PuestoResponse>> obtenerResumenesPorPuesto(
            @RequestBody PuestoRequest request) {
        return ResponseEntity.ok(
                reporteServices.obtenerResumenesPorPuesto(request)
        );
    }

    @GetMapping("/puestos/{idPuesto}/orden-merito")
    public ResponseEntity<List<OrdenMeritoGrupoDTO>> emitirOrdenMerito(
            @PathVariable Long idPuesto) {
        return ResponseEntity.ok(
                reporteServices.emitirOrdenMerito(idPuesto)
        );
    }

    @GetMapping("/puestos/{idPuesto}/candidatos-completos")
    public ResponseEntity<List<CandidatoComparativoResponse>>
    obtenerCandidatosCompletos(@PathVariable Long idPuesto) {
        return ResponseEntity.ok(
                reporteServices.obtenerCandidatosCompletos(idPuesto));
    }

    @GetMapping("/puestos/{idPuesto}/cuestionarios/{idCuestionario}/comparativo")
    public ResponseEntity<ReporteComparativoResponse> emitirReporteComparativo(
            @PathVariable Long idPuesto,
            @PathVariable Long idCuestionario) {
        return ResponseEntity.ok(
                reporteServices.emitirReporteComparativo(idPuesto, idCuestionario));
    }
}
