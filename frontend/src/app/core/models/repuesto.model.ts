export interface Repuesto {
  id?: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  stock: number;
  stock_minimo: number;
  precio_compra: number;
  precio_venta: number;
  created_at?: string;
}