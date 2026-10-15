export interface TipoTrabajo {
  id?: number;
  nombre: string;
  categoria: string;
  descripcion: string;
  precio_base: number;
  tiempo_estimado_horas: number;
  activo?: boolean;
  created_at?: string;
}