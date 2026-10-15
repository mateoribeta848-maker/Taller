export interface Cliente {
  id?: number;
  nombre: string;
  apellido: string;
  cedula: string;
  telefono: string;
  email: string;
  direccion: string;
  created_at?: string;
}