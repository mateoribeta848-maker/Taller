import { Injectable } from '@angular/core';
import { PERSONAL_ROLES, Personal, PersonalRole } from '../models/personal.model';

@Injectable({ providedIn: 'root' })
export class PersonalService {
  private readonly storageKey = 'demoncar-personal';

  listar(): Personal[] {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed) || !parsed.every(this.esPersonal)) {
      throw new Error('Los datos guardados del personal tienen un formato inválido.');
    }
    return parsed;
  }

  guardar(persona: Omit<Personal, 'id'>, id?: string): void {
    const actual = this.listar();
    const registro: Personal = { ...persona, id: id ?? crypto.randomUUID() };
    const actualizados = id
      ? actual.map((item) => item.id === id ? registro : item)
      : [registro, ...actual];
    this.persistir(actualizados);
  }

  eliminar(id: string): void {
    this.persistir(this.listar().filter((persona) => persona.id !== id));
  }

  private persistir(personal: Personal[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(personal));
  }

  private esPersonal(value: unknown): value is Personal {
    if (!value || typeof value !== 'object') return false;
    const persona = value as Record<string, unknown>;
    return typeof persona['id'] === 'string'
      && typeof persona['nombre'] === 'string'
      && typeof persona['apellido'] === 'string'
      && typeof persona['carnet'] === 'string'
      && typeof persona['telefono'] === 'string'
      && PERSONAL_ROLES.includes(persona['rol'] as PersonalRole)
      && (typeof persona['foto'] === 'string' || persona['foto'] === null);
  }
}
