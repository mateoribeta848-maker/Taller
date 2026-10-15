export interface ChecklistItem {
  id?: number;
  informe_id?: number;
  item: string;
  estado: string; // 'ok', 'revisar', 'no_aplica'
  observacion?: string;
}

export interface InformeServicio {
  id?: number;
  trabajo_id: number;
  kilometraje: number;
  nivel_combustible: string;
  hallazgos: string;
  recomendaciones: string;
  proximo_servicio_km: number;
  proximo_servicio_fecha: string;
  firma_tecnico: string;
  firma_cliente: string;
  observaciones_entrega: string;
  fecha_entrega?: string;
  garantia_dias: number;
  // Datos de join
  numero_factura?: string;
  descripcion_trabajo?: string;
  fecha_entrada?: string;
  total_trabajo?: number;
  foto_cliente?: string;
  foto_carro?: string;
  cliente_nombre?: string;
  cliente_cedula?: string;
  cliente_telefono?: string;
  carro?: string;
}

export interface InformeCompleto {
  informe: InformeServicio;
  checklist: ChecklistItem[];
  detalle: any[];
  repuestos: any[];
}