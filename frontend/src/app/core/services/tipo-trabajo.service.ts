import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TipoTrabajo } from '../models/tipo-trabajo.model';

@Injectable({ providedIn: 'root' })
export class TipoTrabajoService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/tipos-trabajos';

  listar(): Observable<TipoTrabajo[]> {
    return this.http.get<TipoTrabajo[]>(this.apiUrl);
  }

  porCategoria(): Observable<{ [key: string]: TipoTrabajo[] }> {
    return this.http.get<{ [key: string]: TipoTrabajo[] }>(`${this.apiUrl}/por-categoria`);
  }

  crear(t: TipoTrabajo): Observable<TipoTrabajo> {
    return this.http.post<TipoTrabajo>(this.apiUrl, t);
  }

  actualizar(id: number, t: TipoTrabajo): Observable<TipoTrabajo> {
    return this.http.put<TipoTrabajo>(`${this.apiUrl}/${id}`, t);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}