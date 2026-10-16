import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as QRCode from 'qrcode';
import { MetodoPago, PagoTrabajo, TrabajoFinanciero } from '../../core/models/finanza.model';
import { FinanzaService } from '../../core/services/finanza.service';

@Component({
  selector: 'app-finanzas',
  imports: [CommonModule, FormsModule],
  templateUrl: './finanzas.component.html',
  styleUrl: './finanzas.component.css',
})
export class FinanzasComponent implements OnInit {
  private readonly service = inject(FinanzaService);

  readonly trabajos = signal<TrabajoFinanciero[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly mensaje = signal<string | null>(null);
  readonly busqueda = signal('');
  readonly trabajoSeleccionado = signal<TrabajoFinanciero | null>(null);
  readonly pagoRecibo = signal<PagoTrabajo | null>(null);
  readonly metodo = signal<MetodoPago>('efectivo');
  readonly ultimosDigitos = signal('');
  readonly referenciaTarjeta = signal('');
  readonly referenciaQr = signal('');
  readonly imagenQr = signal<string | null>(null);
  readonly errorQr = signal<string | null>(null);
  readonly guardando = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  get trabajosFiltrados(): TrabajoFinanciero[] {
    const termino = this.busqueda().trim().toLocaleLowerCase();
    return this.trabajos().filter((trabajo) =>
      !termino
      || trabajo.numero_factura?.toLocaleLowerCase().includes(termino)
      || trabajo.cliente_nombre?.toLocaleLowerCase().includes(termino)
      || trabajo.carro?.toLocaleLowerCase().includes(termino),
    );
  }

  get totalCobrado(): number {
    return this.trabajos().reduce(
      (suma, trabajo) => suma + (trabajo.pago_id ? Number(trabajo.monto_pagado) || 0 : 0),
      0,
    );
  }

  get totalPendiente(): number {
    return this.trabajos().reduce(
      (suma, trabajo) => suma + (trabajo.pago_id ? 0 : Number(trabajo.total) || 0),
      0,
    );
  }

  get cantidadPendiente(): number {
    return this.trabajos().filter((trabajo) => !trabajo.pago_id).length;
  }

  get montoSeleccionado(): number {
    return Number(this.trabajoSeleccionado()?.total) || 0;
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.service.listar().subscribe({
      next: (trabajos) => {
        this.trabajos.set(trabajos);
        this.cargando.set(false);
      },
      error: (error) => {
        this.error.set(`No se pudieron cargar los cobros: ${error.error?.error || error.message}`);
        this.cargando.set(false);
      },
    });
  }

  abrirCobro(trabajo: TrabajoFinanciero): void {
    this.trabajoSeleccionado.set(trabajo);
    this.metodo.set('efectivo');
    this.ultimosDigitos.set('');
    this.referenciaTarjeta.set('');
    this.referenciaQr.set('');
    this.imagenQr.set(null);
    this.errorQr.set(null);
    this.error.set(null);
  }

  cerrarCobro(): void {
    if (this.guardando()) return;
    this.trabajoSeleccionado.set(null);
    this.error.set(null);
  }

  seleccionarMetodo(metodo: MetodoPago): void {
    this.metodo.set(metodo);
    if (metodo === 'qr') this.generarQr();
  }

  actualizarUltimosDigitos(valor: string): void {
    this.ultimosDigitos.set(valor.replace(/\D/g, '').slice(0, 4));
  }

  async generarQr(): Promise<void> {
    const trabajo = this.trabajoSeleccionado();
    if (!trabajo) return;
    this.errorQr.set(null);
    this.imagenQr.set(null);

    try {
      const aleatorio = crypto.randomUUID().replaceAll('-', '').toUpperCase();
      const referencia = `DEMO-${aleatorio}`;
      const contenido = `DEMONCAR-DEMO|FACTURA:${trabajo.numero_factura}|MONTO:${this.montoSeleccionado.toFixed(2)}|REF:${referencia}`;
      const imagen = await QRCode.toDataURL(contenido, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 220,
        color: { dark: '#161616', light: '#ffffff' },
      });
      this.referenciaQr.set(referencia);
      this.imagenQr.set(imagen);
    } catch (error) {
      this.errorQr.set(error instanceof Error ? error.message : 'No se pudo generar el QR.');
    }
  }

  confirmarPago(): void {
    const trabajo = this.trabajoSeleccionado();
    if (!trabajo || this.guardando()) return;
    if (this.metodo() === 'tarjeta' && !/^\d{4}$/.test(this.ultimosDigitos())) {
      this.error.set('Ingresa los últimos 4 dígitos de la tarjeta.');
      return;
    }
    if (this.metodo() === 'qr' && (!this.imagenQr() || !this.referenciaQr())) {
      this.error.set('Genera el QR antes de registrar el pago.');
      return;
    }

    const metodo = this.metodo();
    this.guardando.set(true);
    this.error.set(null);
    this.service.registrarPago(trabajo.trabajo_id, {
      metodo,
      ...(metodo === 'tarjeta'
        ? { ultimos_digitos: this.ultimosDigitos(), referencia: this.referenciaTarjeta().trim() || undefined }
        : {}),
      ...(metodo === 'qr' ? { referencia: this.referenciaQr() } : {}),
    }).subscribe({
      next: (pago) => {
        this.guardando.set(false);
        this.trabajoSeleccionado.set(null);
        this.cargar();
        if (metodo === 'efectivo') {
          this.pagoRecibo.set(pago);
          this.mensaje.set(null);
        } else {
          this.mensaje.set(`Pago de ${this.formatearBs(pago.monto)} registrado para ${pago.numero_factura}.`);
        }
      },
      error: (error) => {
        this.guardando.set(false);
        this.error.set(error.error?.error || error.message || 'No se pudo registrar el pago.');
      },
    });
  }

  cerrarRecibo(): void {
    this.pagoRecibo.set(null);
  }

  imprimirRecibo(): void {
    document.body.classList.add('printing-finance-receipt');
    window.addEventListener('afterprint', () => {
      document.body.classList.remove('printing-finance-receipt');
    }, { once: true });
    window.print();
  }

  abrirRecibo(trabajo: TrabajoFinanciero): void {
    if (!trabajo.pago_id || !trabajo.numero_recibo || !trabajo.fecha_pago) return;
    this.pagoRecibo.set({
      pago_id: trabajo.pago_id,
      trabajo_id: trabajo.trabajo_id,
      metodo_pago: 'efectivo',
      monto_pagado: trabajo.monto_pagado ?? trabajo.total,
      referencia: null,
      ultimos_digitos: null,
      numero_recibo: trabajo.numero_recibo,
      fecha_pago: trabajo.fecha_pago,
      numero_factura: trabajo.numero_factura,
      cliente_nombre: trabajo.cliente_nombre,
    });
  }

  formatearBs(valor: number | string | null | undefined): string {
    return `Bs ${(Number(valor) || 0).toLocaleString('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  metodoTexto(metodo: MetodoPago | null): string {
    switch (metodo) {
      case 'efectivo': return 'Efectivo';
      case 'tarjeta': return 'Tarjeta';
      case 'qr': return 'QR';
      default: return 'Pendiente';
    }
  }

  fechaLegible(fecha: string | null | undefined): string {
    return fecha ? new Date(fecha).toLocaleString('es-BO') : '—';
  }
}
