import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrdenTrabajo, OrdenDetalle } from '../models/orden.model';

@Injectable({ providedIn: 'root' })
export class OrdenService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/ordenes';

  listar(): Observable<OrdenTrabajo[]> {
    return this.http.get<OrdenTrabajo[]>(this.apiUrl);
  }

  obtener(id: number): Observable<OrdenDetalle> {
    return this.http.get<OrdenDetalle>(`${this.apiUrl}/${id}`);
  }

  crear(orden: any): Observable<OrdenTrabajo> {
    return this.http.post<OrdenTrabajo>(this.apiUrl, orden);
  }

  actualizar(id: number, orden: any): Observable<OrdenTrabajo> {
    return this.http.put<OrdenTrabajo>(`${this.apiUrl}/${id}`, orden);
  }

  actualizarEstado(id: number, estado: string): Observable<OrdenTrabajo> {
    return this.http.put<OrdenTrabajo>(`${this.apiUrl}/${id}/estado`, { estado });
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}