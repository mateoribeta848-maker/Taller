export interface Mantenimiento {
  id?: number;
  tipo_carro_id: number;
  tipo_servicio: string;
  kilometros: number;
  meses: number;
  descripcion: string;
  // Campos de join (vienen del backend)
  marca?: string;
  modelo?: string;
}