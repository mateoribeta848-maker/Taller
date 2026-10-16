export type MetodoPago = 'efectivo' | 'tarjeta' | 'qr';

export interface PagoTrabajo {
  pago_id?: number;
  id?: number;
  trabajo_id: number;
  metodo_pago: MetodoPago;
  monto?: number | string;
  monto_pagado?: number | string;
  referencia: string | null;
  ultimos_digitos: string | null;
  numero_recibo: string | null;
  fecha_pago: string;
  numero_factura: string;
  cliente_nombre: string;
}

export interface TrabajoFinanciero {
  trabajo_id: number;
  numero_factura: string;
  total: number | string;
  estado_trabajo: string;
  fecha_entrada: string;
  cliente_nombre: string;
  carro: string;
  pago_id: number | null;
  metodo_pago: MetodoPago | null;
  monto_pagado: number | string | null;
  referencia: string | null;
  ultimos_digitos: string | null;
  numero_recibo: string | null;
  fecha_pago: string | null;
}
