import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InformeService } from '../../core/services/informe.service';
import { InformeCompleto, ChecklistItem } from '../../core/models/informe.model';

@Component({
  selector: 'app-informe-servicio',
  imports: [CommonModule, FormsModule],
  templateUrl: './informe-servicio.component.html',
  styleUrl: './informe-servicio.component.css',
})
export class InformeServicioComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private informeService = inject(InformeService);

  // ⚠️ IMPORTANTE: las constantes van PRIMERO
  itemsChecklistDefault = [
    'Nivel de aceite de motor',
    'Nivel de líquido de frenos',
    'Nivel de líquido refrigerante',
    'Nivel de líquido limpiaparabrisas',
    'Presión de neumáticos',
    'Luces (delanteras, traseras, freno)',
    'Estado de limpiaparabrisas',
    'Estado de batería',
    'Estado de frenos',
    'Estado general del vehículo',
  ];

  // Luego el resto de propiedades
  trabajoId = 0;
  informe = signal<InformeCompleto | null>(null);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);

  form: any = this.limpiarFormulario();
  checklist: ChecklistItem[] = this.checklistPorDefecto();
  modoEdicion = signal<boolean>(true);

  ngOnInit(): void {
    this.trabajoId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.trabajoId) {
      this.error.set('ID de trabajo no válido');
      this.cargando.set(false);
      return;
    }
    this.cargarInforme();
  }

  limpiarFormulario() {
    return {
      kilometraje: 0,
      nivel_combustible: '1/2',
      hallazgos: '',
      recomendaciones: '',
      proximo_servicio_km: 0,
      proximo_servicio_fecha: '',
      firma_tecnico: '',
      firma_cliente: '',
      observaciones_entrega: '',
      garantia_dias: 30,
    };
  }

  checklistPorDefecto(): ChecklistItem[] {
    return this.itemsChecklistDefault.map((item) => ({
      item,
      estado: 'ok',
      observacion: '',
    }));
  }

  cargarInforme() {
    this.cargando.set(true);
    this.error.set(null);

    this.informeService.obtenerPorTrabajo(this.trabajoId).subscribe({
      next: (data) => {
        this.informe.set(data);

        if (data.informe) {
          this.form = {
            kilometraje: data.informe.kilometraje || 0,
            nivel_combustible: data.informe.nivel_combustible || '1/2',
            hallazgos: data.informe.hallazgos || '',
            recomendaciones: data.informe.recomendaciones || '',
            proximo_servicio_km: data.informe.proximo_servicio_km || 0,
            proximo_servicio_fecha: data.informe.proximo_servicio_fecha || '',
            firma_tecnico: data.informe.firma_tecnico || '',
            firma_cliente: data.informe.firma_cliente || '',
            observaciones_entrega: data.informe.observaciones_entrega || '',
            garantia_dias: data.informe.garantia_dias || 30,
          };

          if (data.checklist && data.checklist.length > 0) {
            this.checklist = data.checklist;
          }

          // Si ya tiene id, modo vista
          if (data.informe.id) {
            this.modoEdicion.set(false);
          }
        }
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set('Error: ' + (err.error?.error || err.message));
        this.cargando.set(false);
      },
    });
  }

  agregarItemChecklist() {
    this.checklist.push({ item: '', estado: 'ok', observacion: '' });
  }

  eliminarItemChecklist(index: number) {
    this.checklist.splice(index, 1);
  }

  formatearBs(valor: number | string | undefined): string {
    const num = Number(valor) || 0;
    return `Bs ${num.toLocaleString('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  formatearFecha(fecha: string | undefined | null): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  nivelCombustibleTexto(nivel: string): string {
    const niveles: any = {
      'vacio': 'Vacío',
      '1/4': '1/4',
      '1/2': '1/2',
      '3/4': '3/4',
      'lleno': 'Lleno',
    };
    return niveles[nivel] || nivel;
  }

  guardar() {
    if (!this.form.kilometraje || this.form.kilometraje <= 0) {
      alert('⚠️ Ingresa el kilometraje del vehículo');
      return;
    }
    if (!this.form.firma_tecnico) {
      alert('⚠️ Falta la firma del técnico');
      return;
    }

    const payload = {
      ...this.form,
      checklist: this.checklist,
    };

    this.informeService.crearOActualizar(this.trabajoId, payload).subscribe({
      next: () => {
        alert('✅ Informe guardado correctamente');
        this.modoEdicion.set(false);
        this.cargarInforme();
      },
      error: (err) => alert('Error: ' + (err.error?.error || err.message)),
    });
  }

  imprimir() {
    window.print();
  }

  volver() {
    this.router.navigate(['/trabajos']);
  }

  activarEdicion() {
    this.modoEdicion.set(true);
  }
}