export const PERSONAL_ROLES = [
  'Encargado de taller',
  'Mecánico',
  'Almacén',
  'Gerente',
  'Pasante',
] as const;

export type PersonalRole = (typeof PERSONAL_ROLES)[number];

export interface Personal {
  id: string;
  nombre: string;
  apellido: string;
  carnet: string;
  telefono: string;
  rol: PersonalRole;
  foto: string | null;
}
