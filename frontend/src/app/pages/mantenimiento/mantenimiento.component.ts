import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MantenimientoService } from '../../core/services/mantenimiento.service';
import { CarroService } from '../../core/services/carro.service';
import { Mantenimiento } from '../../core/models/mantenimiento.model';
import { Carro } from '../../core/models/carro.model';

@Component({
  selector: 'app-mantenimiento',
  imports: [FormsModule, CommonModule],
  templateUrl: './mantenimiento.component.html',
  styleUrl: './mantenimiento.component.css',
})
export class MantenimientoComponent implements OnInit {
  private service = inject(MantenimientoService);
  private carroService = inject(CarroService);

  mantenimientos = signal<Mantenimiento[]>([]);
  carros = signal<Carro[]>([]);
  busqueda = signal<string>('');
  cargando = signal<boolean>(false);
  error = signal<string | null>(null);

  mostrarModal = signal<boolean>(false);
  editando = signal<boolean>(false);

  mantenimientoForm: Mantenimiento = this.limpiarForm();

  tiposServicio = [
    // Mantenimiento preventivo
    'Cambio de aceite de motor',
    'Cambio de filtro de aire',
    'Cambio de filtro de combustible',
    'Cambio de filtro de cabina',
    'Cambio de bujías',
    'Cambio de correa de accesorios',
    'Purgado y cambio de líquido de frenos',
    'Cambio de líquido refrigerante',
    'Cambio de líquido de dirección',
    'Cambio de aceite de transmisión',
    'Cambio de aceite de diferencial',

    // Frenos
    'Revisión completa de frenos',
    'Cambio de pastillas delanteras',
    'Cambio de pastillas traseras',
    'Cambio de discos de freno',
    'Cambio de tambores de freno',
    'Reparación de sistema ABS',

    // Suspensión y dirección
    'Alineación de dirección',
    'Balanceo de ruedas',
    'Alineación y balanceo',
    'Cambio de amortiguadores delanteros',
    'Cambio de amortiguadores traseros',
    'Cambio de rótulas',
    'Cambio de terminales de dirección',
    'Cambio de bujes de suspensión',

    // Motor
    'Diagnóstico por computadora',
    'Cambio de correa de distribución',
    'Cambio de bomba de agua',
    'Cambio de termostato',
    'Reparación de culata',
    'Cambio de empaque de tapa de válvulas',
    'Reparación de motor completa',

    // Transmisión
    'Cambio de kit de embrague',
    'Reparación de caja de cambios',
    'Cambio de homocinéticas',

    // Eléctrico
    'Diagnóstico eléctrico',
    'Cambio de batería',
    'Reparación de alternador',
    'Cambio de motor de arranque',
    'Reparación de luces',

    // Aire acondicionado
    'Recarga de gas A/C',
    'Reparación de compresor A/C',
    'Limpieza de sistema A/C',
    'Cambio de evaporador A/C',

    // Inyección y combustible
    'Limpieza de inyectores',
    'Cambio de bomba de combustible',

    // Carrocería y otros
    'Cambio de parabrisas',
    'Reparación de abolladuras',
    'Pintura completa',
    'Polarizado de vidrios',
    'Instalación de alarma',
    'Instalación de radio',

    // Revisiones
    'Revisión pre-compra',
    'Revisión para viaje',
    'Revisión general',
    'Revisión técnica vehicular',
  ];

  ngOnInit(): void {
    this.cargar();
    this.cargarCarros();
  }

  limpiarForm(): Mantenimiento {
    return {
      tipo_carro_id: 0,
      tipo_servicio: 'Cambio de aceite de motor',
      kilometros: 10000,
      meses: 6,
      descripcion: '',
    };
  }

  cargar() {
    this.cargando.set(true);
    this.error.set(null);

    this.service.listar().subscribe({
      next: (data) => {
        this.mantenimientos.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar: ' + (err.error?.error || err.message));
        this.cargando.set(false);
      },
    });
  }

  cargarCarros() {
    this.carroService.listar().subscribe({
      next: (data) => this.carros.set(data),
      error: (err) => console.error('Error cargando carros:', err),
    });
  }

  get mantenimientosFiltrados(): Mantenimiento[] {
    const term = this.busqueda().toLowerCase().trim();
    if (!term) return this.mantenimientos();

    return this.mantenimientos().filter(
      (m) =>
        m.tipo_servicio?.toLowerCase().includes(term) ||
        m.descripcion?.toLowerCase().includes(term) ||
        m.marca?.toLowerCase().includes(term) ||
        m.modelo?.toLowerCase().includes(term)
    );
  }

  abrirCrear() {
    this.mantenimientoForm = this.limpiarForm();
    if (this.carros().length > 0) {
      this.mantenimientoForm.tipo_carro_id = this.carros()[0].id!;
    }
    this.editando.set(false);
    this.mostrarModal.set(true);
  }

  abrirEditar(m: Mantenimiento) {
    this.mantenimientoForm = { ...m };
    this.editando.set(true);
    this.mostrarModal.set(true);
  }

  cerrarModal() {
    this.mostrarModal.set(false);
    this.mantenimientoForm = this.limpiarForm();
  }

  guardar() {
    if (!this.mantenimientoForm.tipo_carro_id || this.mantenimientoForm.tipo_carro_id === 0) {
      alert('⚠️ Debes seleccionar un tipo de carro');
      return;
    }
    if (!this.mantenimientoForm.tipo_servicio) {
      alert('⚠️ El tipo de servicio es obligatorio');
      return;
    }

    if (this.editando() && this.mantenimientoForm.id) {
      this.service.actualizar(this.mantenimientoForm.id, this.mantenimientoForm).subscribe({
        next: () => { this.cargar(); this.cerrarModal(); },
        error: (err) => alert(this.traducirError(err)),
      });
    } else {
      this.service.crear(this.mantenimientoForm).subscribe({
        next: () => { this.cargar(); this.cerrarModal(); },
        error: (err) => alert(this.traducirError(err)),
      });
    }
  }

  eliminar(m: Mantenimiento) {
    if (!m.id) return;
    if (!confirm(`¿Eliminar la frecuencia "${m.tipo_servicio}"?`)) return;

    this.service.eliminar(m.id).subscribe({
      next: () => this.cargar(),
      error: (err) => alert(this.traducirError(err)),
    });
  }

  private traducirError(err: any): string {
    const msg = err.error?.error || err.message || 'Error desconocido';
    if (msg.includes('duplicate key')) return '⚠️ Ya existe un registro con esos datos.';
    if (msg.includes('violates not-null')) return '⚠️ Faltan campos obligatorios.';
    if (msg.includes('foreign key')) return '⚠️ El tipo de carro seleccionado no existe.';
    if (msg.includes('ECONNREFUSED') || msg.includes('Network')) return '⚠️ No se puede conectar al servidor.';
    if (msg.includes('Token')) return '⚠️ Tu sesión expiró. Vuelve a iniciar sesión.';
    return 'Error: ' + msg;
  }

  getNombreCarro(carroId: number): string {
    const c = this.carros().find((x) => x.id === carroId);
    return c ? `${c.marca} ${c.modelo}` : `Carro #${carroId}`;
  }
}