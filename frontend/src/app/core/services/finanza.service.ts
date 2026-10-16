import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PagoTrabajo, TrabajoFinanciero } from '../models/finanza.model';

@Injectable({ providedIn: 'root' })
export class FinanzaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/finanzas';

  listar(): Observable<TrabajoFinanciero[]> {
    return this.http.get<TrabajoFinanciero[]>(this.apiUrl);
  }

  registrarPago(
    trabajoId: number,
    pago: { metodo: 'efectivo' | 'tarjeta' | 'qr'; referencia?: string; ultimos_digitos?: string },
  ): Observable<PagoTrabajo> {
    return this.http.post<PagoTrabajo>(`${this.apiUrl}/trabajos/${trabajoId}/pagos`, pago);
  }
}
