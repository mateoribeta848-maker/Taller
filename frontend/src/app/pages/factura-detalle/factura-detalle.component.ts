import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TrabajoService } from '../../core/services/trabajo.service';
import { TrabajoDetalle } from '../../core/models/trabajo.model';

@Component({
  selector: 'app-factura-detalle',
  imports: [CommonModule],
  templateUrl: './factura-detalle.component.html',
  styleUrl: './factura-detalle.component.css',
})
export class FacturaDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private trabajoService = inject(TrabajoService);

  detalle = signal<TrabajoDetalle | null>(null);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error.set('ID de factura no válido');
      this.cargando.set(false);
      return;
    }

    this.trabajoService.obtener(id).subscribe({
      next: (data) => {
        this.detalle.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set('Error: ' + (err.error?.error || err.message));
        this.cargando.set(false);
      },
    });
  }

  formatearBs(valor: number | string | undefined): string {
    const num = Number(valor) || 0;
    return `Bs ${num.toLocaleString('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  colorEstado(estado: string): string {
    switch (estado) {
      case 'pendiente':  return 'badge-pendiente';
      case 'en_proceso': return 'badge-en_proceso';
      case 'finalizado': return 'badge-finalizado';
      default:            return 'badge-secondary';
    }
  }

  textoEstado(estado: string): string {
    switch (estado) {
      case 'pendiente':  return 'PENDIENTE';
      case 'en_proceso': return 'EN PROCESO';
      case 'finalizado': return 'FINALIZADO';
      default:            return estado.toUpperCase();
    }
  }

  imprimir() {
    window.print();
  }

  volver() {
    this.router.navigate(['/trabajos']);
  }
}