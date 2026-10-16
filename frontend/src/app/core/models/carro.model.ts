export interface Carro {
  id?: number;
  marca: string;
  modelo: string;
  anio: number;
  placa: string;
  kilometraje: number;
  nivel_combustible: string;
  tiene_abolladuras: boolean;
  descripcion_abolladuras: string;
  created_at?: string;
}