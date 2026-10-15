import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DatePipe],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent {
  authService = inject(AuthService);
  hoy = new Date();

  menuItems = [
  { path: '/dashboard',     icon: 'bi-speedometer2',       label: 'Dashboard' },
  { path: '/clientes',      icon: 'bi-people-fill',        label: 'Clientes' },
  { path: '/repuestos',     icon: 'bi-tools',              label: 'Repuestos' },
  { path: '/carros',        icon: 'bi-car-front-fill',     label: 'Tipos de Carros' },
  { path: '/mantenimiento', icon: 'bi-calendar-check',     label: 'Mantenimiento' },
  { path: '/tipos-trabajos', icon: 'bi-list-check',        label: 'Tipos de Trabajos' },
  { path: '/trabajos',      icon: 'bi-wrench-adjustable',  label: 'Trabajos' },
];
  cerrarSesion() {
    if (confirm('¿Cerrar sesión?')) {
      this.authService.logout();
    }
  }
}