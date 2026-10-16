import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OrdenService } from '../../core/services/orden.service';
import { ClienteService } from '../../core/services/cliente.service';
import { CarroService } from '../../core/services/carro.service';
import { TipoTrabajoService } from '../../core/services/tipo-trabajo.service';
import { OrdenTrabajo, ServicioOrden } from '../../core/models/orden.model';
import { Cliente } from '../../core/models/cliente.model';
import { Carro } from '../../core/models/carro.model';
import { TipoTrabajo } from '../../core/models/tipo-trabajo.model';

@Component({
  selector: 'app-ordenes',
  imports: [FormsModule, CommonModule],
  templateUrl: './ordenes.component.html',
  styleUrl: './ordenes.component.css',
})
export class OrdenesComponent implements OnInit {
  private service = inject(OrdenService);
  private clienteService = inject(ClienteService);
  private carroService = inject(CarroService);
  private tipoService = inject(TipoTrabajoService);

  ordenes = signal<OrdenTrabajo[]>([]);
  clientes = signal<Cliente[]>([]);
  carros = signal<Carro[]>([]);
  tiposTrabajos = signal<TipoTrabajo[]>([]);

  busqueda = signal<string>('');
  filtroEstado = signal<string>('todos');
  cargando = signal<boolean>(false);
  error = signal<string | null>(null);

  mostrarModal = signal<boolean>(false);
  editando = signal<boolean>(false);

  ordenForm: OrdenTrabajo = this.limpiarForm();
  serviciosSeleccionados: ServicioOrden[] = [];

  estados = ['pendiente', 'en_proceso', 'finalizado', 'cancelado'];

  ngOnInit(): void {
    this.cargar();
    this.cargarCatalogos();
  }

  limpiarForm(): OrdenTrabajo {
    return {
      cliente_id: 0,
      tipo_carro_id: 0,
      placa: '',
      mecanico_asignado: '',
      estado: 'pendiente',
      observaciones: '',
    };
  }

  cargar() {
    this.cargando.set(true);
    this.error.set(null);

    this.service.listar().subscribe({
      next: (data) => {
        this.ordenes.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar: ' + (err.error?.error || err.message));
        this.cargando.set(false);
      },
    });
  }

  cargarCatalogos() {
    this.clienteService.listar().subscribe({
      next: (d) => this.clientes.set(d),
    });
    this.carroService.listar().subscribe({
      next: (d) => this.carros.set(d),
    });
    this.tipoService.listar().subscribe({
      next: (d) => this.tiposTrabajos.set(d),
    });
  }

  get ordenesFiltradas(): OrdenTrabajo[] {
    const term = this.busqueda().toLowerCase().trim();
    const estado = this.filtroEstado();

    return this.ordenes().filter((o) => {
      const coincideBusqueda =
        !term ||
        o.numero_orden?.toLowerCase().includes(term) ||
        o.cliente_nombre?.toLowerCase().includes(term) ||
        o.vehiculo?.toLowerCase().includes(term) ||
        o.placa?.toLowerCase().includes(term) ||
        o.mecanico_asignado?.toLowerCase().includes(term);

      const coincideEstado = estado === 'todos' || o.estado === estado;

      return coincideBusqueda && coincideEstado;
    });
  }

  get totalServicios(): number {
    return this.serviciosSeleccionados.reduce((sum, s) => sum + (Number(s.precio) || 0), 0);
  }

  // ============================================
  // MODAL
  // ============================================
  abrirCrear() {
    this.ordenForm = this.limpiarForm();
    this.serviciosSeleccionados = [];

    if (this.clientes().length > 0) {
      this.ordenForm.cliente_id = this.clientes()[0].id!;
    }
    if (this.carros().length > 0) {
      this.ordenForm.tipo_carro_id = this.carros()[0].id!;
    }

    this.editando.set(false);
    this.mostrarModal.set(true);
  }

  abrirEditar(o: OrdenTrabajo) {
    if (!o.id) return;

    this.service.obtener(o.id).subscribe({
      next: (data) => {
        this.ordenForm = { ...data.orden };
        this.serviciosSeleccionados = data.detalle.map((s) => ({
          tipo_trabajo_id: s.tipo_trabajo_id,
          descripcion: s.descripcion,
          precio: Number(s.precio),
          completado: s.completado,
        }));
        this.editando.set(true);
        this.mostrarModal.set(true);
      },
      error: (err) => alert('Error al cargar: ' + (err.error?.error || err.message)),
    });
  }

  cerrarModal() {
    this.mostrarModal.set(false);
    this.ordenForm = this.limpiarForm();
    this.serviciosSeleccionados = [];
  }

  // ============================================
  // SERVICIOS
  // ============================================
  agregarServicio() {
    if (this.tiposTrabajos().length === 0) {
      alert('⚠️ No hay tipos de trabajo disponibles');
      return;
    }

    const primero = this.tiposTrabajos()[0];
    this.serviciosSeleccionados.push({
      tipo_trabajo_id: primero.id!,
      descripcion: '',
      precio: Number(primero.precio_base),
      completado: false,
    });
  }

  eliminarServicio(index: number) {
    this.serviciosSeleccionados.splice(index, 1);
  }

  cambiarServicio(index: number) {
    const item = this.serviciosSeleccionados[index];
    const tipo = this.tiposTrabajos().find((t) => t.id === item.tipo_trabajo_id);
    if (tipo) {
      item.precio = Number(tipo.precio_base);
    }
  }

  // ============================================
  // GUARDAR
  // ============================================
  guardar() {
    if (!this.ordenForm.cliente_id || this.ordenForm.cliente_id === 0) {
      alert('⚠️ Selecciona un cliente');
      return;
    }
    if (!this.ordenForm.tipo_carro_id || this.ordenForm.tipo_carro_id === 0) {
      alert('⚠️ Selecciona un vehículo');
      return;
    }
    if (!this.ordenForm.mecanico_asignado) {
      alert('⚠️ Ingresa el mecánico asignado');
      return;
    }

    const payload = {
      ...this.ordenForm,
      servicios: this.serviciosSeleccionados,
    };

    if (this.editando() && this.ordenForm.id) {
      this.service.actualizar(this.ordenForm.id, payload).subscribe({
        next: () => {
          this.cargar();
          this.cerrarModal();
        },
        error: (err) => alert('Error: ' + (err.error?.error || err.message)),
      });
    } else {
      this.service.crear(payload).subscribe({
        next: () => {
          this.cargar();
          this.cerrarModal();
        },
        error: (err) => alert('Error: ' + (err.error?.error || err.message)),
      });
    }
  }

  // ============================================
  // ELIMINAR
  // ============================================
  eliminar(o: OrdenTrabajo) {
    if (!o.id) return;
    if (!confirm(`¿Eliminar la orden ${o.numero_orden}?`)) return;

    this.service.eliminar(o.id).subscribe({
      next: () => this.cargar(),
      error: (err) => alert('Error: ' + (err.error?.error || err.message)),
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

  formatearFecha(fecha: string | undefined): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  colorEstado(estado: string): string {
    switch (estado) {
      case 'pendiente':  return 'badge-pendiente';
      case 'en_proceso': return 'badge-en_proceso';
      case 'finalizado': return 'badge-finalizado';
      case 'cancelado':  return 'badge-secondary';
      default:            return 'badge-secondary';
    }
  }

  textoEstado(estado: string): string {
    switch (estado) {
      case 'pendiente':  return 'PENDIENTE';
      case 'en_proceso': return 'EN PROCESO';
      case 'finalizado': return 'FINALIZADO';
      case 'cancelado':  return 'CANCELADO';
      default:            return estado.toUpperCase();
    }
  }
}