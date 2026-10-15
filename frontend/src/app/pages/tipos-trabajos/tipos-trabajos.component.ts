import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TipoTrabajoService } from '../../core/services/tipo-trabajo.service';
import { TipoTrabajo } from '../../core/models/tipo-trabajo.model';

@Component({
  selector: 'app-tipos-trabajos',
  imports: [FormsModule, CommonModule],
  templateUrl: './tipos-trabajos.component.html',
  styleUrl: './tipos-trabajos.component.css',
})
export class TiposTrabajosComponent implements OnInit {
  private service = inject(TipoTrabajoService);

  tipos = signal<TipoTrabajo[]>([]);
  busqueda = signal<string>('');
  filtroCategoria = signal<string>('todas');
  cargando = signal<boolean>(false);
  error = signal<string | null>(null);

  mostrarModal = signal<boolean>(false);
  editando = signal<boolean>(false);

  tipoForm: TipoTrabajo = this.limpiarForm();

  categorias = ['Mantenimiento', 'Reparación', 'Diagnóstico'];

  ngOnInit(): void {
    this.cargar();
  }

  limpiarForm(): TipoTrabajo {
    return {
      nombre: '',
      categoria: 'Mantenimiento',
      descripcion: '',
      precio_base: 0,
      tiempo_estimado_horas: 0,
      activo: true,
    };
  }

  cargar() {
    this.cargando.set(true);
    this.error.set(null);

    this.service.listar().subscribe({
      next: (data) => {
        this.tipos.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar: ' + (err.error?.error || err.message));
        this.cargando.set(false);
      },
    });
  }

  get tiposFiltrados(): TipoTrabajo[] {
    const term = this.busqueda().toLowerCase().trim();
    const cat = this.filtroCategoria();

    return this.tipos().filter((t) => {
      const coincideBusqueda =
        !term ||
        t.nombre?.toLowerCase().includes(term) ||
        t.descripcion?.toLowerCase().includes(term);

      const coincideCategoria = cat === 'todas' || t.categoria === cat;

      return coincideBusqueda && coincideCategoria;
    });
  }

  abrirCrear() {
    this.tipoForm = this.limpiarForm();
    this.editando.set(false);
    this.mostrarModal.set(true);
  }

  abrirEditar(t: TipoTrabajo) {
    this.tipoForm = { ...t };
    this.editando.set(true);
    this.mostrarModal.set(true);
  }

  cerrarModal() {
    this.mostrarModal.set(false);
    this.tipoForm = this.limpiarForm();
  }

  guardar() {
    if (!this.tipoForm.nombre) {
      alert('⚠️ El nombre es obligatorio');
      return;
    }

    if (this.editando() && this.tipoForm.id) {
      this.service.actualizar(this.tipoForm.id, this.tipoForm).subscribe({
        next: () => {
          this.cargar();
          this.cerrarModal();
        },
        error: (err) => alert('Error: ' + (err.error?.error || err.message)),
      });
    } else {
      this.service.crear(this.tipoForm).subscribe({
        next: () => {
          this.cargar();
          this.cerrarModal();
        },
        error: (err) => alert('Error: ' + (err.error?.error || err.message)),
      });
    }
  }

  eliminar(t: TipoTrabajo) {
    if (!t.id) return;
    if (!confirm(`¿Eliminar "${t.nombre}"?`)) return;

    this.service.eliminar(t.id).subscribe({
      next: () => this.cargar(),
      error: (err) => alert('Error: ' + (err.error?.error || err.message)),
    });
  }

  formatearBs(valor: number | string | undefined): string {
    const num = Number(valor) || 0;
    return `Bs ${num.toLocaleString('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  colorCategoria(cat: string): string {
    switch (cat) {
      case 'Mantenimiento': return 'badge-info';
      case 'Reparación':    return 'badge-danger';
      case 'Diagnóstico':   return 'badge-warning';
      default:              return 'badge-secondary';
    }
  }
}