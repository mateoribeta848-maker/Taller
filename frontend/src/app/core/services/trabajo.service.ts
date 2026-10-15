import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Trabajo, TrabajoDetalle } from '../models/trabajo.model';

@Injectable({ providedIn: 'root' })
export class TrabajoService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/trabajos';

  listar(): Observable<Trabajo[]> {
    return this.http.get<Trabajo[]>(this.apiUrl);
  }

  obtener(id: number): Observable<TrabajoDetalle> {
    return this.http.get<TrabajoDetalle>(`${this.apiUrl}/${id}`);
  }

  crear(trabajo: Trabajo): Observable<Trabajo> {
    return this.http.post<Trabajo>(this.apiUrl, trabajo);
  }

  actualizarEstado(id: number, estado: string): Observable<Trabajo> {
    return this.http.put<Trabajo>(`${this.apiUrl}/${id}/estado`, { estado });
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  estadisticas(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/estadisticas`);
  }
}