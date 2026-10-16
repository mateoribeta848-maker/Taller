import { Component, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Gota {
  x: number;
  y: number;
  opacity: number;
  size: number;
}

@Component({
  selector: 'app-simulador',
  imports: [CommonModule, FormsModule],
  templateUrl: './simulador.component.html',
  styleUrl: './simulador.component.css',
})
export class SimuladorComponent implements OnInit, OnDestroy {
  // ============================================
  // SEÑALES DE PARÁMETROS
  // ============================================
  altitud = signal<number>(3600);
  calidadGasolina = signal<string>('regular');
  estadoInyector = signal<string>('bueno');
  estadoSensor = signal<string>('ok');
  temperatura = signal<number>(90);
  modoInyector = signal<string>('normal-angosto');

  // Slider manual de AFR (null = automático)
  afrManual = signal<number | null>(null);
  usarAfrManual = signal<boolean>(false);

  // ============================================
  // ANIMACIÓN
  // ============================================
  gotasActivas = signal<Gota[]>([]);
  private intervaloAnimacion: any;

  // ============================================
  // CÁLCULOS FÍSICOS
  // ============================================
  presionAtmosferica = computed(() => {
    const h = this.altitud();
    const P0 = 101.325;
    return P0 * Math.pow(1 - 2.25577e-5 * h, 5.25588);
  });

  oxigenoDisponible = computed(() => {
    const presion = this.presionAtmosferica();
    const presionParcialO2 = presion * 0.209;
    return (presionParcialO2 / (101.325 * 0.209)) * 100;
  });

  densidadAire = computed(() => {
    const p = this.presionAtmosferica() * 1000;
    const T = this.temperatura() + 273.15;
    const R = 287.05;
    return p / (R * T);
  });

  // AFR calculado automáticamente
  private afrCalculado = computed(() => {
    let afrBase = 14.7;

    const correccionAltitud = Math.max(0.75, 1 - (this.altitud() / 5000) * 0.25);
    afrBase *= correccionAltitud;

    if (this.calidadGasolina() === 'premium') afrBase += 0.3;
    if (this.calidadGasolina() === 'mala') afrBase -= 1.5;

    if (this.estadoInyector() === 'sucio') afrBase -= 0.8;
    if (this.estadoInyector() === 'dañado') afrBase -= 2.0;

    if (this.estadoSensor() === 'lento') afrBase -= 0.4;
    if (this.estadoSensor() === 'falla') afrBase -= 1.2;

    if (this.temperatura() < 60) afrBase -= 0.5;
    if (this.temperatura() > 100) afrBase -= 0.3;

    return Math.max(8, Math.min(18, afrBase));
  });

  // AFR final: manual si está activo, si no calculado
  afr = computed(() => {
    if (this.usarAfrManual() && this.afrManual() !== null) {
      return this.afrManual()!;
    }
    return this.afrCalculado();
  });

  // ============================================
  // TIPO DE MEZCLA
  // ============================================
  tipoMezcla = computed<'rica' | 'pobre' | 'ideal'>(() => {
    const afr = this.afr();
    if (afr < 13.5) return 'rica';
    if (afr > 15.2) return 'pobre';
    return 'ideal';
  });

  private cantidadGotas = computed(() => {
    const tipo = this.tipoMezcla();
    if (tipo === 'rica') return 8;
    if (tipo === 'pobre') return 1;
    return 4;
  });

  private tamanoGota = computed(() => {
    const tipo = this.tipoMezcla();
    if (tipo === 'rica') return 8;
    if (tipo === 'pobre') return 2;
    return 4;
  });

  // ============================================
  // POTENCIA Y CONSUMO
  // ============================================
  potencia = computed(() => {
    const oxigeno = this.oxigenoDisponible();
    const afr = this.afr();
    const inyector = this.estadoInyector();
    const sensor = this.estadoSensor();

    let potenciaBase = 150;
    potenciaBase *= (oxigeno / 100) * 0.85 + 0.15;

    const diffAFR = Math.abs(afr - 14.7);
    potenciaBase *= Math.max(0.6, 1 - diffAFR * 0.05);

    if (inyector === 'sucio') potenciaBase *= 0.9;
    if (inyector === 'dañado') potenciaBase *= 0.75;
    if (sensor === 'lento') potenciaBase *= 0.95;
    if (sensor === 'falla') potenciaBase *= 0.85;

    return Math.max(30, potenciaBase);
  });

  consumo = computed(() => {
    const afr = this.afr();
    const pot = this.potencia();
    const altitudVal = this.altitud();

    let consumoBase = 8;
    consumoBase += (altitudVal / 1000) * 0.4;
    if (afr < 14) consumoBase += (14 - afr) * 1.2;
    if (pot < 100) consumoBase += 2;

    return consumoBase;
  });

  duracionInyeccion = computed(() => {
    const afr = this.afr();
    const altitudVal = this.altitud();
    let duracionBase = 3.5;
    if (afr < 14) duracionBase += (14 - afr) * 0.3;
    duracionBase += (altitudVal / 1000) * 0.15;
    return duracionBase;
  });

  volumenCombustible = computed(() => this.duracionInyeccion() * 4.5);
  correccionECU = computed(() => ((14.7 - this.afr()) / 14.7) * 100);
  eficiencia = computed(() => Math.min(100, (this.potencia() / 150) * 100));

  // Posición de la aguja: AFR 8 → 0%, AFR 18 → 100%
  posicionAgujaAFR = computed(() => {
    const afr = this.afr();
    const min = 8;
    const max = 18;
    const valor = Math.max(min, Math.min(max, afr));
    return ((valor - min) / (max - min)) * 100;
  });

  nivelCombustible = computed(() => {
    const tipo = this.tipoMezcla();
    if (tipo === 'rica') return 100;
    if (tipo === 'pobre') return 15;
    return 60;
  });

  textoAfrSlider = computed(() => {
    const afr = this.afr();
    if (afr < 10) return '🔴 EXTREMADAMENTE RICA';
    if (afr < 12) return '🔴 MUY RICA';
    if (afr < 13.5) return '🟠 RICA';
    if (afr <= 15.2) return '🟢 IDEAL';
    if (afr <= 16) return '🟡 POBRE';
    if (afr <= 17) return '🟠 MUY POBRE';
    return '🔴 EXTREMADAMENTE POBRE';
  });

  // ============================================
  // HELPERS
  // ============================================
  iconoModo(): string {
    switch (this.modoInyector()) {
      case 'normal-angosto': return 'bi-check-circle-fill text-success';
      case 'normal-amplio':  return 'bi-check-circle-fill text-success';
      case 'obstruido':      return 'bi-exclamation-triangle-fill text-warning';
      case 'goteo':          return 'bi-x-circle-fill text-danger';
      default:               return 'bi-droplet-fill';
    }
  }

  textoModo(): string {
    switch (this.modoInyector()) {
      case 'normal-angosto': return 'Normal (angosto)';
      case 'normal-amplio':  return 'Normal (amplio)';
      case 'obstruido':      return 'Obstruido';
      case 'goteo':          return 'Goteo';
      default:               return 'Normal';
    }
  }

  textoMezcla(): string {
    const tipo = this.tipoMezcla();
    if (tipo === 'rica') return '🔴 RICA';
    if (tipo === 'pobre') return '🟡 POBRE';
    return '🟢 IDEAL';
  }

  claseMezcla(): string {
    const tipo = this.tipoMezcla();
    if (tipo === 'rica') return 'estado-danger';
    if (tipo === 'pobre') return 'estado-warning';
    return 'estado-ok';
  }

  claseAFR(): string {
    const afr = this.afr();
    if (afr >= 14 && afr <= 15.2) return 'text-success';
    if (afr >= 13 && afr < 14) return 'text-warning';
    if (afr > 15.2 && afr <= 16) return 'text-warning';
    return 'text-danger';
  }

  textoAFR(): string {
    const afr = this.afr();
    if (afr >= 14 && afr <= 15.2) return 'Óptimo';
    if (afr < 14) return 'Rico (exceso combustible)';
    return 'Pobre (exceso aire)';
  }

  clasePotencia(): string {
    const pot = this.potencia();
    if (pot > 120) return 'text-success';
    if (pot > 90) return 'text-warning';
    return 'text-danger';
  }

  textoPotencia(): string {
    const pot = this.potencia();
    if (pot > 120) return 'Motor al máximo';
    if (pot > 90) return 'Funcionamiento aceptable';
    return 'Potencia reducida';
  }

  textoConsumo(): string {
    const c = this.consumo();
    if (c < 10) return 'Consumo eficiente';
    if (c < 13) return 'Consumo elevado';
    return 'Consumo muy alto';
  }

  claseEficiencia(): string {
    const e = this.eficiencia();
    if (e > 75) return 'bg-success';
    if (e > 50) return 'bg-warning';
    return 'bg-danger';
  }

  claseEstadoInyector(): string {
    switch (this.estadoInyector()) {
      case 'bueno':  return 'estado-ok';
      case 'sucio':  return 'estado-warning';
      case 'dañado': return 'estado-danger';
      default:       return 'estado-ok';
    }
  }

  textoEstadoInyector(): string {
    switch (this.estadoInyector()) {
      case 'bueno':  return 'BUENO';
      case 'sucio':  return 'OBSTRUIDO';
      case 'dañado': return 'DAÑADO';
      default:       return 'BUENO';
    }
  }

  // ============================================
  // SLIDER
  // ============================================
  onAfrSliderChange(valor: number) {
    this.usarAfrManual.set(true);
    this.afrManual.set(valor);
  }

  toggleAfrManual() {
    const nuevo = !this.usarAfrManual();
    this.usarAfrManual.set(nuevo);
    if (nuevo && this.afrManual() === null) {
      this.afrManual.set(this.afrCalculado());
    }
  }

  resetearAfrAutomatico() {
    this.usarAfrManual.set(false);
    this.afrManual.set(null);
  }

  // ============================================
  // DIAGNÓSTICOS
  // ============================================
  diagnosticos = computed(() => {
    const lista: any[] = [];
    const altitudVal = this.altitud();
    const afr = this.afr();
    const inyector = this.estadoInyector();
    const sensor = this.estadoSensor();
    const gasolina = this.calidadGasolina();
    const temp = this.temperatura();
    const mezcla = this.tipoMezcla();

    if (mezcla === 'rica') {
      lista.push({
        tipo: 'danger',
        icono: 'droplet-fill',
        titulo: '🔴 MEZCLA RICA',
        descripcion: `AFR ${afr.toFixed(2)}:1 (ideal 14.7:1). El motor recibe DEMASIADO combustible. Causas: inyector goteando, sensor O2 en falla, presión de combustible alta.`,
      });
    }

    if (mezcla === 'pobre') {
      lista.push({
        tipo: 'warning',
        icono: 'wind',
        titulo: '🟡 MEZCLA POBRE',
        descripcion: `AFR ${afr.toFixed(2)}:1 (ideal 14.7:1). El motor recibe POCO combustible. Causas: inyector sucio, baja presión, fuga de aire.`,
      });
    }

    if (altitudVal > 3500) {
      lista.push({
        tipo: 'warning',
        icono: 'geo-alt-fill',
        titulo: 'Altitud crítica',
        descripcion: `A ${altitudVal}m la presión atmosférica es ${this.presionAtmosferica().toFixed(1)} kPa. El motor pierde ~${(100 - this.oxigenoDisponible()).toFixed(0)}% de oxígeno.`,
      });
    }

    if (inyector === 'sucio') {
      lista.push({
        tipo: 'warning',
        icono: 'droplet-fill',
        titulo: 'Inyector obstruido',
        descripcion: 'Pulverización deficiente. Recomendado: limpieza ultrasónica.',
      });
    }
    if (inyector === 'dañado') {
      lista.push({
        tipo: 'danger',
        icono: 'x-octagon-fill',
        titulo: 'Inyector dañado',
        descripcion: 'El inyector gotea combustible. Reemplazo inmediato.',
      });
    }

    if (sensor === 'lento') {
      lista.push({
        tipo: 'warning',
        icono: 'clock-fill',
        titulo: 'Sensor O2 lento',
        descripcion: 'La ECU no ajusta con precisión la mezcla.',
      });
    }
    if (sensor === 'falla') {
      lista.push({
        tipo: 'danger',
        icono: 'x-circle-fill',
        titulo: 'Sensor de oxígeno en falla',
        descripcion: 'La ECU entra en modo emergencia (mezcla rica).',
      });
    }

    if (gasolina === 'mala') {
      lista.push({
        tipo: 'danger',
        icono: 'fuel-pump-fill',
        titulo: 'Combustible de mala calidad',
        descripcion: 'Gasolina con impurezas. Puede dañar inyectores.',
      });
    }

    if (temp < 50) {
      lista.push({
        tipo: 'info',
        icono: 'snow',
        titulo: 'Motor frío',
        descripcion: 'La ECU enriquece la mezcla. Comportamiento normal.',
      });
    }
    if (temp > 105) {
      lista.push({
        tipo: 'danger',
        icono: 'thermometer-high',
        titulo: 'Motor sobrecalentado',
        descripcion: 'Riesgo de daño grave. Verificar refrigeración.',
      });
    }

    return lista;
  });

  recomendaciones = computed(() => {
    const lista: string[] = [];
    const mezcla = this.tipoMezcla();
    const altitudVal = this.altitud();
    const inyector = this.estadoInyector();
    const sensor = this.estadoSensor();

    if (mezcla === 'rica') {
      lista.push('🔴 Verificar presión de combustible: puede estar muy alta.');
      lista.push('🔴 Revisar inyectores: pueden estar goteando.');
      lista.push('🔴 Comprobar sensor de oxígeno y sensor MAP/MAF.');
    }

    if (mezcla === 'pobre') {
      lista.push('🟡 Revisar presión de combustible: puede estar baja.');
      lista.push('🟡 Verificar filtro de combustible: puede estar obstruido.');
      lista.push('🟡 Buscar fugas de aire en la admisión.');
    }

    if (altitudVal > 3000) {
      lista.push('Usar gasolina de mayor octanaje para compensar la pérdida de oxígeno.');
    }

    if (inyector === 'sucio') {
      lista.push('Realizar limpieza ultrasónica de inyectores cada 40.000 km.');
    }
    if (inyector === 'dañado') {
      lista.push('Reemplazar el inyector inmediatamente.');
    }

    if (sensor === 'falla' || sensor === 'lento') {
      lista.push('Revisar sensor de oxígeno con escáner OBD-II.');
    }

    if (this.calidadGasolina() === 'mala') {
      lista.push('Cambiar a gasolina premium.');
    }

    return lista;
  });

  // ============================================
  // LIFECYCLE
  // ============================================
  ngOnInit(): void {
    this.iniciarAnimacion();
  }

  ngOnDestroy(): void {
    clearInterval(this.intervaloAnimacion);
  }

  iniciarAnimacion(): void {
    this.intervaloAnimacion = setInterval(() => {
      const gotasActuales = this.gotasActivas();

      const animadas = gotasActuales
        .map((g) => ({
          ...g,
          y: g.y + (this.modoInyector() === 'goteo' ? 4 : 6),
          opacity: g.opacity - 0.06,
        }))
        .filter((g) => g.opacity > 0 && g.y < 100);

      const nuevas: Gota[] = [];
      const cantidad = this.cantidadGotas();
      const tamano = this.tamanoGota();
      const modo = this.modoInyector();

      for (let i = 0; i < cantidad; i++) {
        let xMin = 45, xMax = 55;

        if (modo === 'normal-amplio') {
          xMin = 30; xMax = 70;
        } else if (modo === 'obstruido') {
          xMin = 48; xMax = 52;
        } else if (modo === 'goteo') {
          xMin = 47; xMax = 53;
        }

        nuevas.push({
          x: xMin + Math.random() * (xMax - xMin),
          y: 55,
          opacity: 1,
          size: tamano + Math.random() * 1.5,
        });
      }

      this.gotasActivas.set([...animadas, ...nuevas]);
    }, 130);
  }

  simular(): void {
    this.gotasActivas.set([]);
  }

  resetear(): void {
    this.altitud.set(3600);
    this.calidadGasolina.set('regular');
    this.estadoInyector.set('bueno');
    this.estadoSensor.set('ok');
    this.temperatura.set(90);
    this.modoInyector.set('normal-angosto');
    this.usarAfrManual.set(false);
    this.afrManual.set(null);
    this.gotasActivas.set([]);
  }
}