import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PERSONAL_ROLES, Personal, PersonalRole } from '../../core/models/personal.model';
import { PersonalService } from '../../core/services/personal.service';

interface PersonalForm {
  nombre: string;
  apellido: string;
  carnet: string;
  telefono: string;
  rol: PersonalRole;
  foto: string | null;
}

@Component({
  selector: 'app-personal-encargados',
  imports: [CommonModule, FormsModule],
  templateUrl: './personal-encargados.component.html',
  styleUrl: './personal-encargados.component.css',
})
export class PersonalEncargadosComponent implements OnInit {
  private readonly service = inject(PersonalService);

  readonly roles = PERSONAL_ROLES;
  readonly personal = signal<Personal[]>([]);
  readonly busqueda = signal('');
  readonly error = signal<string | null>(null);
  readonly mostrarFormulario = signal(false);
  readonly editandoId = signal<string | null>(null);
  readonly soloVistaPrevia = signal(false);
  formulario = this.formularioVacio();

  ngOnInit(): void {
    this.cargar();
  }

  get personalFiltrado(): Personal[] {
    const termino = this.busqueda().trim().toLocaleLowerCase();
    if (!termino) return this.personal();
    return this.personal().filter((persona) =>
      [persona.nombre, persona.apellido, persona.carnet, persona.telefono, persona.rol]
        .some((valor) => valor.toLocaleLowerCase().includes(termino)),
    );
  }

  abrirNuevo(): void {
    this.formulario = this.formularioVacio();
    this.editandoId.set(null);
    this.soloVistaPrevia.set(false);
    this.error.set(null);
    this.mostrarFormulario.set(true);
  }

  editar(persona: Personal): void {
    this.formulario = { ...persona };
    this.editandoId.set(persona.id);
    this.soloVistaPrevia.set(false);
    this.error.set(null);
    this.mostrarFormulario.set(true);
  }

  previsualizar(persona: Personal): void {
    this.formulario = { ...persona };
    this.editandoId.set(null);
    this.soloVistaPrevia.set(true);
    this.error.set(null);
    this.mostrarFormulario.set(true);
  }

  cerrarFormulario(): void {
    this.mostrarFormulario.set(false);
    this.error.set(null);
  }

  seleccionarFoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;
    input.value = '';

    if (!archivo.type.startsWith('image/')) {
      this.error.set('Selecciona un archivo de imagen válido.');
      return;
    }
    if (archivo.size > 1024 * 1024) {
      this.error.set('La foto debe pesar menos de 1 MB.');
      return;
    }

    const lector = new FileReader();
    lector.onload = () => {
      if (typeof lector.result !== 'string') {
        this.error.set('No se pudo leer la foto seleccionada.');
        return;
      }
      this.formulario.foto = lector.result;
      this.error.set(null);
    };
    lector.onerror = () => this.error.set('No se pudo leer la foto seleccionada.');
    lector.readAsDataURL(archivo);
  }

  quitarFoto(): void {
    this.formulario.foto = null;
  }

  guardar(): void {
    const { nombre, apellido, carnet, telefono, rol, foto } = this.formulario;
    if (![nombre, apellido, carnet, telefono].every((valor) => valor.trim())) {
      this.error.set('Completa nombres, apellidos, número de carnet y teléfono.');
      return;
    }

    try {
      this.service.guardar({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        carnet: carnet.trim(),
        telefono: telefono.trim(),
        rol,
        foto,
      }, this.editandoId() ?? undefined);
      this.cargar();
      this.mostrarFormulario.set(false);
      this.error.set(null);
    } catch (error) {
      this.error.set(this.mensajeError(error, 'No se pudo guardar el registro.'));
    }
  }

  eliminar(persona: Personal): void {
    if (!confirm(`¿Eliminar a ${persona.nombre} ${persona.apellido}?`)) return;
    try {
      this.service.eliminar(persona.id);
      this.cargar();
      this.error.set(null);
    } catch (error) {
      this.error.set(this.mensajeError(error, 'No se pudo eliminar el registro.'));
    }
  }

  imprimirCredencial(): void {
    document.body.classList.add('printing-personal-credential');
    window.addEventListener('afterprint', () => {
      document.body.classList.remove('printing-personal-credential');
    }, { once: true });
    window.print();
  }

  iniciales(nombre: string, apellido: string): string {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toLocaleUpperCase();
  }

  private cargar(): void {
    try {
      this.personal.set(this.service.listar());
    } catch (error) {
      this.error.set(this.mensajeError(error, 'No se pudieron cargar los registros.'));
    }
  }

  private formularioVacio(): PersonalForm {
    return {
      nombre: '',
      apellido: '',
      carnet: '',
      telefono: '',
      rol: 'Mecánico',
      foto: null,
    };
  }

  private mensajeError(error: unknown, predeterminado: string): string {
    return error instanceof Error ? `${predeterminado} ${error.message}` : predeterminado;
  }
}
