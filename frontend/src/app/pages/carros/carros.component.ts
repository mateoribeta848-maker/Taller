import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CarroService } from '../../core/services/carro.service';
import { Carro } from '../../core/models/carro.model';

@Component({
  selector: 'app-carros',
  imports: [FormsModule, CommonModule],
  templateUrl: './carros.component.html',
  styleUrl: './carros.component.css',
})
export class CarrosComponent implements OnInit {
  private service = inject(CarroService);

  carros = signal<Carro[]>([]);
  busqueda = signal<string>('');
  filtroFreno = signal<string>('todos');
  cargando = signal<boolean>(false);
  error = signal<string | null>(null);

  mostrarModal = signal<boolean>(false);
  editando = signal<boolean>(false);

  carroForm: Carro = this.limpiarForm();

  tiposFreno = ['Disco', 'Tambor', 'ABS', 'Mixto'];

  ngOnInit(): void {
    this.cargar();
  }

  // ============================================
  // FORMULARIO
  // ============================================
  limpiarForm(): Carro {
    return {
      marca: '',
      modelo: '',
      anio: new Date().getFullYear(),
      tipo_freno: 'Disco',
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
        this.carros.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar: ' + (err.error?.error || err.message));
        this.cargando.set(false);
      },
    });
  }

  // ============================================
  // GETTERS
  // ============================================
  get carrosFiltrados(): Carro[] {
    const term = this.busqueda().toLowerCase().trim();
    const freno = this.filtroFreno();

    return this.carros().filter((c) => {
      const coincideBusqueda =
        !term ||
        c.marca?.toLowerCase().includes(term) ||
        c.modelo?.toLowerCase().includes(term) ||
        c.anio?.toString().includes(term);

      const coincideFreno = freno === 'todos' || c.tipo_freno === freno;

      return coincideBusqueda && coincideFreno;
    });
  }

  get marcasUnicas(): string[] {
    const marcas = new Set(this.carros().map((c) => c.marca).filter(Boolean));
    return Array.from(marcas).sort();
  }

  // ============================================
  // MODAL
  // ============================================
  abrirCrear() {
    this.carroForm = this.limpiarForm();
    this.editando.set(false);
    this.mostrarModal.set(true);
  }

  abrirEditar(c: Carro) {
    this.carroForm = { ...c };
    this.editando.set(true);
    this.mostrarModal.set(true);
  }

  cerrarModal() {
    this.mostrarModal.set(false);
    this.carroForm = this.limpiarForm();
  }

  // ============================================
  // GUARDAR
  // ============================================
  guardar() {
    if (!this.carroForm.marca || !this.carroForm.modelo) {
      alert('⚠️ Marca y modelo son obligatorios');
      return;
    }

    if (this.editando() && this.carroForm.id) {
      this.service.actualizar(this.carroForm.id, this.carroForm).subscribe({
        next: () => {
          this.cargar();
          this.cerrarModal();
        },
        error: (err) => alert(this.traducirError(err)),
      });
    } else {
      this.service.crear(this.carroForm).subscribe({
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
  eliminar(c: Carro) {
    if (!c.id) return;
    if (!confirm(`¿Eliminar ${c.marca} ${c.modelo}?`)) return;

    this.service.eliminar(c.id).subscribe({
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
  colorFreno(tipo: string): string {
    switch (tipo) {
      case 'Disco':  return 'badge-info';
      case 'Tambor': return 'badge-warning';
      case 'ABS':    return 'badge-success';
      case 'Mixto':  return 'badge-secondary';
      default:       return 'badge-secondary';
    }
  }
}