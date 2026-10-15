import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CategoriaRepuesto } from '../models/categoria-repuesto.model';

@Injectable({ providedIn: 'root' })
export class CategoriaRepuestoService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/categorias-repuestos';

  listar(): Observable<CategoriaRepuesto[]> {
    return this.http.get<CategoriaRepuesto[]>(this.apiUrl);
  }

  crear(c: CategoriaRepuesto): Observable<CategoriaRepuesto> {
    return this.http.post<CategoriaRepuesto>(this.apiUrl, c);
  }

  actualizar(id: number, c: CategoriaRepuesto): Observable<CategoriaRepuesto> {
    return this.http.put<CategoriaRepuesto>(`${this.apiUrl}/${id}`, c);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}