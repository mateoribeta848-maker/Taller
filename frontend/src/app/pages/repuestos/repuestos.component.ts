import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RepuestoService } from '../../core/services/repuesto.service';
import { CategoriaRepuestoService } from '../../core/services/categoria-repuesto.service';
import { Repuesto } from '../../core/models/repuesto.model';
import { CategoriaRepuesto } from '../../core/models/categoria-repuesto.model';

@Component({
  selector: 'app-repuestos',
  imports: [FormsModule, CommonModule],
  templateUrl: './repuestos.component.html',
  styleUrl: './repuestos.component.css',
})
export class RepuestosComponent implements OnInit {
  private service = inject(RepuestoService);
  private categoriaService = inject(CategoriaRepuestoService);

  repuestos = signal<Repuesto[]>([]);
  categorias = signal<CategoriaRepuesto[]>([]);
  busqueda = signal<string>('');
  filtroCategoria = signal<string>('todas');
  cargando = signal<boolean>(false);
  error = signal<string | null>(null);

  mostrarModal = signal<boolean>(false);
  editando = signal<boolean>(false);

  repuestoForm: Repuesto = this.limpiarForm();

  ngOnInit(): void {
    console.log('🟢 ngOnInit ejecutado');
    this.cargar();
    this.cargarCategorias();
  }

  limpiarForm(): Repuesto {
    return {
      codigo: '',
      nombre: '',
      descripcion: '',
      categoria: '',
      stock: 0,
      stock_minimo: 5,
      precio_compra: 0,
      precio_venta: 0,
    };
  }

  cargar() {
    this.cargando.set(true);
    this.error.set(null);

    this.service.listar().subscribe({
      next: (data) => {
        this.repuestos.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar: ' + (err.error?.error || err.message));
        this.cargando.set(false);
      },
    });
  }

  cargarCategorias() {
    console.log('🟢 Cargando categorías...');
    this.categoriaService.listar().subscribe({
      next: (data) => {
        console.log('✅ Categorías recibidas:', data.length, data);
        this.categorias.set(data);
        if (!this.repuestoForm.categoria && data.length > 0) {
          this.repuestoForm.categoria = data[0].nombre;
        }
      },
      error: (err) => {
        console.error('❌ Error categorías:', err);
      },
    });
  }

  get repuestosFiltrados(): Repuesto[] {
    const term = this.busqueda().toLowerCase().trim();
    const cat = this.filtroCategoria();

    return this.repuestos().filter((r) => {
      const coincideBusqueda =
        !term ||
        r.codigo?.toLowerCase().includes(term) ||
        r.nombre?.toLowerCase().includes(term) ||
        r.descripcion?.toLowerCase().includes(term);

      const coincideCategoria = cat === 'todas' || r.categoria === cat;

      return coincideBusqueda && coincideCategoria;
    });
  }

  get categoriasUnicas(): string[] {
    const cats = new Set(this.repuestos().map((r) => r.categoria).filter(Boolean));
    return Array.from(cats).sort();
  }

  get repuestosConStockBajo(): Repuesto[] {
    return this.repuestos().filter((r) => this.stockBajo(r));
  }

  abrirCrear() {
    this.repuestoForm = this.limpiarForm();
    if (this.categorias().length > 0) {
      this.repuestoForm.categoria = this.categorias()[0].nombre;
    }
    this.editando.set(false);
    this.mostrarModal.set(true);
  }

  abrirEditar(r: Repuesto) {
    this.repuestoForm = { ...r };
    this.editando.set(true);
    this.mostrarModal.set(true);
  }

  cerrarModal() {
    this.mostrarModal.set(false);
    this.repuestoForm = this.limpiarForm();
  }

  guardar() {
    if (!this.repuestoForm.codigo || !this.repuestoForm.nombre) {
      alert('⚠️ Código y nombre son obligatorios');
      return;
    }
    if (!this.repuestoForm.categoria) {
      alert('⚠️ Selecciona una categoría');
      return;
    }

    if (this.editando() && this.repuestoForm.id) {
      this.service.actualizar(this.repuestoForm.id, this.repuestoForm).subscribe({
        next: () => { this.cargar(); this.cerrarModal(); },
        error: (err) => alert('Error: ' + (err.error?.error || err.message)),
      });
    } else {
      this.service.crear(this.repuestoForm).subscribe({
        next: () => { this.cargar(); this.cerrarModal(); },
        error: (err) => alert('Error: ' + (err.error?.error || err.message)),
      });
    }
  }

  eliminar(r: Repuesto) {
    if (!r.id) return;
    if (!confirm(`¿Eliminar "${r.nombre}"?`)) return;

    this.service.eliminar(r.id).subscribe({
      next: () => this.cargar(),
      error: (err) => alert('Error: ' + (err.error?.error || err.message)),
    });
  }

  stockBajo(r: Repuesto): boolean {
    return r.stock <= r.stock_minimo;
  }

  formatearBs(valor: number | string | undefined): string {
    const num = Number(valor) || 0;
    return `Bs ${num.toLocaleString('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}