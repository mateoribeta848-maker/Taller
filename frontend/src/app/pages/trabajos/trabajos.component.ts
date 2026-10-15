import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TrabajoService } from '../../core/services/trabajo.service';
import { ClienteService } from '../../core/services/cliente.service';
import { CarroService } from '../../core/services/carro.service';
import { RepuestoService } from '../../core/services/repuesto.service';
import { Trabajo, RepuestoUsado } from '../../core/models/trabajo.model';
import { Cliente } from '../../core/models/cliente.model';
import { Carro } from '../../core/models/carro.model';
import { Repuesto } from '../../core/models/repuesto.model';

@Component({
  selector: 'app-trabajos',
  imports: [FormsModule, CommonModule],
  templateUrl: './trabajos.component.html',
  styleUrl: './trabajos.component.css',
})
export class TrabajosComponent implements OnInit {
  // ============================================
  // SERVICIOS
  // ============================================
  private trabajoService = inject(TrabajoService);
  private clienteService = inject(ClienteService);
  private carroService = inject(CarroService);
  private repuestoService = inject(RepuestoService);
  private router = inject(Router);

  // ============================================
  // LISTAS
  // ============================================
  trabajos = signal<Trabajo[]>([]);
  clientes = signal<Cliente[]>([]);
  carros = signal<Carro[]>([]);
  repuestosDisponibles = signal<Repuesto[]>([]);

  // ============================================
  // ESTADOS
  // ============================================
  busqueda = signal<string>('');
  filtroEstado = signal<string>('todos');
  cargando = signal<boolean>(false);
  error = signal<string | null>(null);

  // ============================================
  // MODAL
  // ============================================
  mostrarModal = signal<boolean>(false);

  // ============================================
  // FORMULARIO
  // ============================================
  trabajoForm: Trabajo = this.limpiarForm();
  repuestosSeleccionados: RepuestoUsado[] = [];

  // ============================================
  // FOTOS
  // ============================================
  fotoClientePreview = signal<string | null>(null);
  fotoCarroPreview = signal<string | null>(null);

  estados = ['pendiente', 'en_proceso', 'finalizado'];

  ngOnInit(): void {
    this.cargar();
    this.cargarCatalogos();
  }

  // ============================================
  // FORMULARIO
  // ============================================
  limpiarForm(): Trabajo {
    return {
      cliente_id: 0,
      tipo_carro_id: 0,
      descripcion: '',
      costo_mano_obra: 0,
      descuento: 0,
      estado: 'pendiente',
      observaciones: '',
      foto_cliente: null,
      foto_carro: null,
    };
  }

  // ============================================
  // CARGAR DATOS
  // ============================================
  cargar() {
    this.cargando.set(true);
    this.error.set(null);

    this.trabajoService.listar().subscribe({
      next: (data) => {
        this.trabajos.set(data);
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
      next: (data) => this.clientes.set(data),
    });
    this.carroService.listar().subscribe({
      next: (data) => this.carros.set(data),
    });
    this.repuestoService.listar().subscribe({
      next: (data) => this.repuestosDisponibles.set(data),
    });
  }

  // ============================================
  // GETTERS
  // ============================================
  get trabajosFiltrados(): Trabajo[] {
    const term = this.busqueda().toLowerCase().trim();
    const estado = this.filtroEstado();

    return this.trabajos().filter((t) => {
      const coincideBusqueda =
        !term ||
        t.numero_factura?.toLowerCase().includes(term) ||
        t.cliente_nombre?.toLowerCase().includes(term) ||
        t.carro?.toLowerCase().includes(term) ||
        t.descripcion?.toLowerCase().includes(term);

      const coincideEstado = estado === 'todos' || t.estado === estado;

      return coincideBusqueda && coincideEstado;
    });
  }

  get costoRepuestosCalculado(): number {
    return this.repuestosSeleccionados.reduce(
      (sum, r) => sum + (r.precio_unitario || 0) * r.cantidad,
      0
    );
  }

  get subtotalCalculado(): number {
    return (
      Number(this.trabajoForm.costo_mano_obra || 0) +
      this.costoRepuestosCalculado -
      Number(this.trabajoForm.descuento || 0)
    );
  }

  get ivaCalculado(): number {
    return this.subtotalCalculado * 0.13;
  }

  get totalCalculado(): number {
    return this.subtotalCalculado + this.ivaCalculado;
  }

  // ============================================
  // MODAL
  // ============================================
  abrirCrear() {
    this.trabajoForm = this.limpiarForm();
    this.repuestosSeleccionados = [];
    this.fotoClientePreview.set(null);
    this.fotoCarroPreview.set(null);

    if (this.clientes().length > 0) {
      this.trabajoForm.cliente_id = this.clientes()[0].id!;
    }
    if (this.carros().length > 0) {
      this.trabajoForm.tipo_carro_id = this.carros()[0].id!;
    }

    this.mostrarModal.set(true);
  }

  cerrarModal() {
    this.mostrarModal.set(false);
    this.trabajoForm = this.limpiarForm();
    this.repuestosSeleccionados = [];
    this.fotoClientePreview.set(null);
    this.fotoCarroPreview.set(null);
  }

  // ============================================
  // FOTOS
  // ============================================
  onFotoClienteSeleccionada(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('⚠️ La imagen no debe superar 2 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.fotoClientePreview.set(e.target.result);
      this.trabajoForm.foto_cliente = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  onFotoCarroSeleccionada(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('⚠️ La imagen no debe superar 2 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.fotoCarroPreview.set(e.target.result);
      this.trabajoForm.foto_carro = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  eliminarFotoCliente() {
    this.fotoClientePreview.set(null);
    this.trabajoForm.foto_cliente = null;
  }

  eliminarFotoCarro() {
    this.fotoCarroPreview.set(null);
    this.trabajoForm.foto_carro = null;
  }

  // ============================================
  // REPUESTOS
  // ============================================
  agregarRepuesto() {
    if (this.repuestosDisponibles().length === 0) {
      alert('⚠️ No hay repuestos disponibles');
      return;
    }

    const primero = this.repuestosDisponibles()[0];
    this.repuestosSeleccionados.push({
      repuesto_id: primero.id!,
      cantidad: 1,
      precio_unitario: Number(primero.precio_venta),
    });
  }

  eliminarRepuesto(index: number) {
    this.repuestosSeleccionados.splice(index, 1);
  }

  cambiarRepuesto(index: number) {
    const item = this.repuestosSeleccionados[index];
    const rep = this.repuestosDisponibles().find((r) => r.id === item.repuesto_id);
    if (rep) {
      item.precio_unitario = Number(rep.precio_venta);
    }
  }

  getNombreRepuesto(id: number): string {
    const r = this.repuestosDisponibles().find((x) => x.id === id);
    return r ? `${r.codigo} - ${r.nombre}` : 'Desconocido';
  }

  getStockRepuesto(id: number): number {
    const r = this.repuestosDisponibles().find((x) => x.id === id);
    return r ? r.stock : 0;
  }

  // ============================================
  // GUARDAR
  // ============================================
  guardar() {
    if (!this.trabajoForm.cliente_id || this.trabajoForm.cliente_id === 0) {
      alert('⚠️ Selecciona un cliente');
      return;
    }
    if (!this.trabajoForm.tipo_carro_id || this.trabajoForm.tipo_carro_id === 0) {
      alert('⚠️ Selecciona un tipo de carro');
      return;
    }
    if (!this.trabajoForm.descripcion) {
      alert('⚠️ La descripción es obligatoria');
      return;
    }

    const payload = {
      ...this.trabajoForm,
      repuestos: this.repuestosSeleccionados.map((r) => ({
        repuesto_id: r.repuesto_id,
        cantidad: r.cantidad,
      })),
    };

    this.trabajoService.crear(payload).subscribe({
      next: () => {
        this.cargar();
        this.cerrarModal();
        alert('✅ Trabajo registrado correctamente');
      },
      error: (err) => alert(this.traducirError(err)),
    });
  }

  // ============================================
  // VER FACTURA
  // ============================================
  verDetalle(t: Trabajo) {
    if (!t.id) return;
    this.router.navigate(['/trabajos', t.id, 'factura']);
  }

  // ============================================
  // VER INFORME DE SERVICIO ← NUEVO
  // ============================================
  verInforme(t: Trabajo) {
    if (!t.id) return;
    this.router.navigate(['/trabajos', t.id, 'informe']);
  }

  // ============================================
  // ELIMINAR
  // ============================================
  eliminar(t: Trabajo) {
    if (!t.id) return;
    if (!confirm(`¿Eliminar el trabajo ${t.numero_factura}?\n\nEl stock de los repuestos será restaurado.`)) return;

    this.trabajoService.eliminar(t.id).subscribe({
      next: () => {
        this.cargar();
        this.cargarCatalogos();
      },
      error: (err) => alert(this.traducirError(err)),
    });
  }

  // ============================================
  // TRADUCTOR DE ERRORES
  // ============================================
  private traducirError(err: any): string {
    const msg = err.error?.error || err.message || 'Error desconocido';

    if (msg.includes('Stock insuficiente')) return '⚠️ ' + msg;
    if (msg.includes('no existe')) return '⚠️ ' + msg;
    if (msg.includes('violates not-null')) return '⚠️ Faltan campos obligatorios.';
    if (msg.includes('ECONNREFUSED') || msg.includes('Network')) {
      return '⚠️ No se puede conectar al servidor.';
    }
    if (msg.includes('Token')) return '⚠️ Tu sesión expiró. Vuelve a iniciar sesión.';

    return 'Error: ' + msg;
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