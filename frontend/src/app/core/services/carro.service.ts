import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Carro } from '../models/carro.model';

@Injectable({ providedIn: 'root' })
export class CarroService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/carros';

  listar(): Observable<Carro[]> {
    return this.http.get<Carro[]>(this.apiUrl);
  }

  obtener(id: number): Observable<Carro> {
    return this.http.get<Carro>(`${this.apiUrl}/${id}`);
  }

  crear(carro: Carro): Observable<Carro> {
    return this.http.post<Carro>(this.apiUrl, carro);
  }

  actualizar(id: number, carro: Carro): Observable<Carro> {
    return this.http.put<Carro>(`${this.apiUrl}/${id}`, carro);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}