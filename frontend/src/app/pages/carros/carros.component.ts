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
  cargando = signal<boolean>(false);
  error = signal<string | null>(null);

  mostrarModal = signal<boolean>(false);
  editando = signal<boolean>(false);

  carroForm: Carro = this.limpiarForm();

  nivelesCombustible = ['vacio', '1/4', '1/2', '3/4', 'lleno'];

  ngOnInit(): void {
    this.cargar();
  }

  limpiarForm(): Carro {
    return {
      marca: '',
      modelo: '',
      anio: new Date().getFullYear(),
      placa: '',
      kilometraje: 0,
      nivel_combustible: '1/2',
      tiene_abolladuras: false,
      descripcion_abolladuras: '',
    };
  }

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

  get carrosFiltrados(): Carro[] {
    const term = this.busqueda().toLowerCase().trim();
    if (!term) return this.carros();

    return this.carros().filter(
      (c) =>
        c.marca?.toLowerCase().includes(term) ||
        c.modelo?.toLowerCase().includes(term) ||
        c.placa?.toLowerCase().includes(term) ||
        c.anio?.toString().includes(term)
    );
  }

  get marcasUnicas(): string[] {
    const marcas = new Set(this.carros().map((c) => c.marca).filter(Boolean));
    return Array.from(marcas).sort();
  }

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

  guardar() {
    if (!this.carroForm.marca || !this.carroForm.modelo) {
      alert('⚠️ Marca y modelo son obligatorios');
      return;
    }
    if (!this.carroForm.placa) {
      alert('⚠️ La placa es obligatoria');
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

  eliminar(c: Carro) {
    if (!c.id) return;
    if (!confirm(`¿Eliminar ${c.marca} ${c.modelo} (${c.placa})?`)) return;

    this.service.eliminar(c.id).subscribe({
      next: () => this.cargar(),
      error: (err) => alert(this.traducirError(err)),
    });
  }

  private traducirError(err: any): string {
    const msg = err.error?.error || err.message || 'Error desconocido';
    if (msg.includes('duplicate key')) return '⚠️ Ya existe un registro con esos datos.';
    if (msg.includes('violates not-null')) return '⚠️ Faltan campos obligatorios.';
    if (msg.includes('ECONNREFUSED') || msg.includes('Network')) return '⚠️ No se puede conectar al servidor.';
    if (msg.includes('Token')) return '⚠️ Tu sesión expiró. Vuelve a iniciar sesión.';
    return 'Error: ' + msg;
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

  colorCombustible(nivel: string): string {
    switch (nivel) {
      case 'vacio': return 'badge-danger';
      case '1/4':   return 'badge-warning';
      case '1/2':   return 'badge-info';
      case '3/4':   return 'badge-success';
      case 'lleno': return 'badge-success';
      default:      return 'badge-secondary';
    }
  }
}