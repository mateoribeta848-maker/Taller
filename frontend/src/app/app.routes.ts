import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './layout/login/login.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./pages/clientes/clientes.component').then(m => m.ClientesComponent),
      },
      {
        path: 'repuestos',
        loadComponent: () =>
          import('./pages/repuestos/repuestos.component').then(m => m.RepuestosComponent),
      },
      {
        path: 'carros',
        loadComponent: () =>
          import('./pages/carros/carros.component').then(m => m.CarrosComponent),
      },
      {
        path: 'mantenimiento',
        loadComponent: () =>
          import('./pages/mantenimiento/mantenimiento.component').then(m => m.MantenimientoComponent),
      },
      {
        path: 'tipos-trabajos',
        loadComponent: () =>
          import('./pages/tipos-trabajos/tipos-trabajos.component').then(m => m.TiposTrabajosComponent),
      },
      {
        path: 'trabajos',
        loadComponent: () =>
          import('./pages/trabajos/trabajos.component').then(m => m.TrabajosComponent),
      },
      {
        path: 'trabajos/:id/factura',
        loadComponent: () =>
          import('./pages/factura-detalle/factura-detalle.component').then(m => m.FacturaDetalleComponent),
      },
      {
        path: 'trabajos/:id/informe',
        loadComponent: () =>
          import('./pages/informe-servicio/informe-servicio.component').then(m => m.InformeServicioComponent),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];