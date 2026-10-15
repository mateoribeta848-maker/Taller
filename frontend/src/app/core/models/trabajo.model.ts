export interface RepuestoUsado {
  repuesto_id: number;
  cantidad: number;
  id?: number;
  repuesto_nombre?: string;
  repuesto_codigo?: string;
  precio_unitario?: number;
  subtotal?: number;
}

export interface Trabajo {
  id?: number;
  numero_factura?: string;
  cliente_id: number;
  tipo_carro_id: number;
  descripcion: string;
  fecha_entrada?: string;
  fecha_salida?: string;
  costo_mano_obra: number;
  costo_repuestos?: number;
  subtotal?: number;
  iva?: number;
  descuento: number;
  total?: number;
  estado: string;
  observaciones: string;
  cliente_nombre?: string;
  cliente_cedula?: string;
  cliente_telefono?: string;
  cliente_direccion?: string;
  carro?: string;
  foto_cliente?: string | null;
  foto_carro?: string | null;
  repuestos?: RepuestoUsado[];
}

export interface TrabajoDetalle {
  trabajo: Trabajo;
  detalle: RepuestoUsado[];
}