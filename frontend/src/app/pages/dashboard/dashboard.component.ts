import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { Estadisticas } from '../../core/models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  authService = inject(AuthService);

  estadisticas = signal<Estadisticas | null>(null);
  ultimosTrabajos = signal<any[]>([]);
  repuestosBajoStock = signal<any[]>([]);
  cargando = signal<boolean>(true);

  hoy = new Date();

  ngOnInit(): void {
    this.cargar();
  }

  // ============================================
  // CARGAR DATOS
  // ============================================
  cargar() {
    this.cargando.set(true);

    // Estadísticas generales
    this.dashboardService.estadisticas().subscribe({
      next: (data) => this.estadisticas.set(data),
      error: (err) => console.error('Error estadísticas:', err),
    });

    // Últimos 5 trabajos
    this.dashboardService.ultimosTrabajos().subscribe({
      next: (data) => {
        this.ultimosTrabajos.set(data.slice(0, 5));
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error trabajos:', err);
        this.cargando.set(false);
      },
    });

    // Repuestos con bajo stock (top 5)
    this.dashboardService.repuestosBajoStock().subscribe({
      next: (data) => this.repuestosBajoStock.set(data.slice(0, 5)),
      error: (err) => console.error('Error bajo stock:', err),
    });
  }

  // ============================================
  // UTILIDADES
  // ============================================
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
}