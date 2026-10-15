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
    'Cambio de pastillas',
    'Cambio de discos',
    'Cambio de líquido',
    'Revisión general',
    'Cambio de tambores',
    'Purgado de frenos',
    'Revisión de ABS',
    'Cambio de mangueras',
  ];

  ngOnInit(): void {
    this.cargar();
    this.cargarCarros();
  }

  // ============================================
  // FORMULARIO
  // ============================================
  limpiarForm(): Mantenimiento {
    return {
      tipo_carro_id: 0,
      tipo_servicio: 'Cambio de pastillas',
      kilometros: 10000,
      meses: 6,
      descripcion: '',
    };
  }

  // ============================================
  // CARGAR DATOS
  // ============================================
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

  // ============================================
  // GETTERS
  // ============================================
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

  // ============================================
  // MODAL
  // ============================================
  abrirCrear() {
    this.mantenimientoForm = this.limpiarForm();
    // Por defecto, selecciona el primer carro si hay
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

  // ============================================
  // GUARDAR
  // ============================================
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
        next: () => {
          this.cargar();
          this.cerrarModal();
        },
        error: (err) => alert(this.traducirError(err)),
      });
    } else {
      this.service.crear(this.mantenimientoForm).subscribe({
        next: () => {
          this.cargar();
          this.cerrarModal();
        },
        error: (err) => alert(this.traducirError(err)),
      });
    }
  }

  // ============================================
  // ELIMINAR
  // ============================================
  eliminar(m: Mantenimiento) {
    if (!m.id) return;
    if (!confirm(`¿Eliminar la frecuencia "${m.tipo_servicio}"?`)) return;

    this.service.eliminar(m.id).subscribe({
      next: () => this.cargar(),
      error: (err) => alert(this.traducirError(err)),
    });
  }

  // ============================================
  // TRADUCTOR DE ERRORES
  // ============================================
  private traducirError(err: any): string {
    const msg = err.error?.error || err.message || 'Error desconocido';

    if (msg.includes('duplicate key') || msg.includes('llave duplicada')) {
      return '⚠️ Ya existe un registro con esos datos.';
    }
    if (msg.includes('violates not-null') || msg.includes('null value')) {
      return '⚠️ Faltan campos obligatorios.';
    }
    if (msg.includes('foreign key') || msg.includes('violates foreign')) {
      return '⚠️ El tipo de carro seleccionado no existe.';
    }
    if (msg.includes('does not exist')) {
      return '⚠️ Error: la tabla no existe en la base de datos.';
    }
    if (msg.includes('ECONNREFUSED') || msg.includes('Network')) {
      return '⚠️ No se puede conectar al servidor.';
    }
    if (msg.includes('Token')) {
      return '⚠️ Tu sesión expiró. Vuelve a iniciar sesión.';
    }

    return 'Error: ' + msg;
  }

  // ============================================
  // UTILIDADES
  // ============================================
  getNombreCarro(carroId: number): string {
    const c = this.carros().find((x) => x.id === carroId);
    return c ? `${c.marca} ${c.modelo}` : `Carro #${carroId}`;
  }
}