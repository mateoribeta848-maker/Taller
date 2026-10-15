import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ClienteService } from '../../core/services/cliente.service';
import { Cliente } from '../../core/models/cliente.model';

@Component({
  selector: 'app-clientes',
  imports: [FormsModule, CommonModule],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.css',
})
export class ClientesComponent implements OnInit {
  private service = inject(ClienteService);

  clientes = signal<Cliente[]>([]);
  busqueda = signal<string>('');
  cargando = signal<boolean>(false);
  error = signal<string | null>(null);

  // Modal
  mostrarModal = signal<boolean>(false);
  editando = signal<boolean>(false);

  clienteForm: Cliente = this.limpiarForm();

  ngOnInit(): void {
    this.cargar();
  }

  // ============================================
  // FORMULARIO
  // ============================================
  limpiarForm(): Cliente {
    return {
      nombre: '',
      apellido: '',
      cedula: '',
      telefono: '',
      email: '',
      direccion: '',
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
        this.clientes.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar clientes: ' + (err.error?.error || err.message));
        this.cargando.set(false);
      },
    });
  }

  // ============================================
  // GETTERS
  // ============================================
  get clientesFiltrados(): Cliente[] {
    const term = this.busqueda().toLowerCase().trim();
    if (!term) return this.clientes();

    return this.clientes().filter(
      (c) =>
        c.nombre?.toLowerCase().includes(term) ||
        c.apellido?.toLowerCase().includes(term) ||
        c.cedula?.toLowerCase().includes(term) ||
        c.telefono?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term)
    );
  }

  // ============================================
  // MODAL
  // ============================================
  abrirCrear() {
    this.clienteForm = this.limpiarForm();
    this.editando.set(false);
    this.mostrarModal.set(true);
  }

  abrirEditar(c: Cliente) {
    this.clienteForm = { ...c };
    this.editando.set(true);
    this.mostrarModal.set(true);
  }

  cerrarModal() {
    this.mostrarModal.set(false);
    this.clienteForm = this.limpiarForm();
  }

  // ============================================
  // GUARDAR
  // ============================================
  guardar() {
    if (!this.clienteForm.nombre || !this.clienteForm.apellido) {
      alert('⚠️ Nombre y apellido son obligatorios');
      return;
    }

    if (this.editando() && this.clienteForm.id) {
      this.service.actualizar(this.clienteForm.id, this.clienteForm).subscribe({
        next: () => {
          this.cargar();
          this.cerrarModal();
        },
        error: (err) => alert(this.traducirError(err)),
      });
    } else {
      this.service.crear(this.clienteForm).subscribe({
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
  eliminar(c: Cliente) {
    if (!c.id) return;
    if (!confirm(`¿Eliminar a ${c.nombre} ${c.apellido}?`)) return;

    this.service.eliminar(c.id).subscribe({
      next: () => this.cargar(),
      error: (err) => alert(this.traducirError(err)),
    });
  }

  // ============================================
  // TRADUCTOR DE ERRORES
  // Convierte los errores técnicos de PostgreSQL
  // en mensajes amigables para el usuario
  // ============================================
  private traducirError(err: any): string {
    const msg = err.error?.error || err.message || 'Error desconocido';

    // Cédula duplicada
    if (
      msg.includes('clientes_cedula_key') ||
      msg.includes('duplicate key') ||
      msg.includes('llave duplicada') ||
      msg.includes('viola restricción de unicidad')
    ) {
      return '⚠️ Ya existe un cliente con esa cédula.\n\nPor favor, usa una cédula diferente.';
    }

    // Email duplicado
    if (msg.includes('clientes_email_key')) {
      return '⚠️ Ya existe un cliente con ese email.';
    }

    // Campos obligatorios
    if (msg.includes('violates not-null') || msg.includes('null value')) {
      return '⚠️ Faltan campos obligatorios. Verifica los datos.';
    }

    // Tabla no existe
    if (msg.includes('does not exist')) {
      return '⚠️ Error: la tabla no existe en la base de datos.';
    }

    // Conexión
    if (msg.includes('ECONNREFUSED') || msg.includes('Network')) {
      return '⚠️ No se puede conectar al servidor. Verifica que el backend esté corriendo.';
    }

    // Token expirado
    if (msg.includes('Token')) {
      return '⚠️ Tu sesión expiró. Vuelve a iniciar sesión.';
    }

    // Error genérico
    return 'Error: ' + msg;
  }
}