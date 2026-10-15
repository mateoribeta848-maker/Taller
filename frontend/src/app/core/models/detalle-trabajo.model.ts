export interface DetalleTrabajo {
  id?: number;
  trabajo_id: number;
  tipo_trabajo_id: number;
  descripcion: string;
  precio: number;
  completado: boolean;
  // Join
  tipo_nombre?: string;
  categoria?: string;
}