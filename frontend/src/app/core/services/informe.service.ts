import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InformeCompleto, InformeServicio } from '../models/informe.model';

@Injectable({ providedIn: 'root' })
export class InformeService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/informes';

  obtenerPorTrabajo(trabajoId: number): Observable<InformeCompleto> {
    return this.http.get<InformeCompleto>(`${this.apiUrl}/trabajo/${trabajoId}`);
  }

  crearOActualizar(trabajoId: number, informe: any): Observable<InformeServicio> {
    return this.http.post<InformeServicio>(`${this.apiUrl}/trabajo/${trabajoId}`, informe);
  }

  eliminar(trabajoId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/trabajo/${trabajoId}`);
  }
}