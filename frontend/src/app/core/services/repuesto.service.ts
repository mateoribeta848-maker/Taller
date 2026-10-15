import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Repuesto } from '../models/repuesto.model';

@Injectable({ providedIn: 'root' })
export class RepuestoService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/repuestos';

  listar(): Observable<Repuesto[]> {
    return this.http.get<Repuesto[]>(this.apiUrl);
  }

  bajoStock(): Observable<Repuesto[]> {
    return this.http.get<Repuesto[]>(`${this.apiUrl}/bajo-stock`);
  }

  obtener(id: number): Observable<Repuesto> {
    return this.http.get<Repuesto>(`${this.apiUrl}/${id}`);
  }

  crear(repuesto: Repuesto): Observable<Repuesto> {
    return this.http.post<Repuesto>(this.apiUrl, repuesto);
  }

  actualizar(id: number, repuesto: Repuesto): Observable<Repuesto> {
    return this.http.put<Repuesto>(`${this.apiUrl}/${id}`, repuesto);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}