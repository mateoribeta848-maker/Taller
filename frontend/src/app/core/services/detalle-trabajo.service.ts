import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DetalleTrabajo } from '../models/detalle-trabajo.model';

@Injectable({ providedIn: 'root' })
export class DetalleTrabajoService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/detalle-trabajos';

  listarPorTrabajo(trabajoId: number): Observable<DetalleTrabajo[]> {
    return this.http.get<DetalleTrabajo[]>(`${this.apiUrl}/trabajo/${trabajoId}`);
  }

  crear(d: DetalleTrabajo): Observable<DetalleTrabajo> {
    return this.http.post<DetalleTrabajo>(this.apiUrl, d);
  }

  actualizar(id: number, d: DetalleTrabajo): Observable<DetalleTrabajo> {
    return this.http.put<DetalleTrabajo>(`${this.apiUrl}/${id}`, d);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}