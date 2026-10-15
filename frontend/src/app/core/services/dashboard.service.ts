import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Estadisticas } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  estadisticas(): Observable<Estadisticas> {
    return this.http.get<Estadisticas>(`${this.apiUrl}/trabajos/estadisticas`);
  }

  ultimosTrabajos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/trabajos`);
  }

  repuestosBajoStock(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/repuestos/bajo-stock`);
  }
}