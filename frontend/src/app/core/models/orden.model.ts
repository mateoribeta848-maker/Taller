export interface ServicioOrden {
  id?: number;
  orden_id?: number;
  tipo_trabajo_id: number;
  descripcion: string;
  precio: number;
  completado: boolean;
  // Campos de join
  tipo_nombre?: string;
  categoria?: string;
}

export interface OrdenTrabajo {
  id?: number;
  numero_orden?: string;
  fecha_ingreso?: string;
  fecha_entrega?: string;
  cliente_id: number;
  tipo_carro_id: number;
  placa: string;
  mecanico_asignado: string;
  estado: string;
  observaciones: string;
  // Campos de join
  cliente_nombre?: string;
  cliente_cedula?: string;
  cliente_telefono?: string;
  vehiculo?: string;
  vehiculo_anio?: number;
  total_servicios?: number;
  total_precio?: number;
}

export interface OrdenDetalle {
  orden: OrdenTrabajo;
  detalle: ServicioOrden[];
}