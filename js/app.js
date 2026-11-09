/**
 * ============================================================================
 * CardioAlerta AI — Lógica Principal: Simulador ECG 60 FPS y Explorador de Capas
 * Proyecto de Admisión · Ingeniería Biomédica · UMNG
 * ============================================================================
 */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
   * 1. DATOS TÉCNICOS DE LAS 5 CAPAS DEL PROTOTIPO (SECCIÓN 3)
   * -------------------------------------------------------------------------- */
  const PROTOTYPE_LAYERS = {
    1: {
      id: 1,
      tag: 'Capa 01 · Protección y Ergonomía',
      title: 'Carcasa Superior Flexible (Biomaterial)',
      specLabel: 'Material',
      specValue:
        'Elastómero de silicona de grado médico hipoalergénico e impermeable (certificación IP67).',
      functionText:
        'Protege la electrónica permitiendo que el parche se adapte a la curvatura del tórax del paciente.',
      metrics: [
        { label: 'Protección', value: 'IP67 Impermeable' },
        { label: 'Biocompatibilidad', value: 'ISO 10993' },
        { label: 'Espesor', value: '1.8 mm flexible' }
      ],
      accentColor: '#EA434E',
      iconName: 'shield-check'
    },
    2: {
      id: 2,
      tag: 'Capa 02 · Bioinstrumentación Analógica',
      title: 'Módulo de Adquisición Analógica (AFE — Analog Front-End)',
      specLabel: 'Componente referencia',
      specValue:
        'Chip bioinstrumentado tipo ADS1293 o AD8232 de bajo consumo.',
      functionText:
        'Amplifica los biopotenciales cardíacos (rango de 0.5 mV a 5 mV) y aplica filtrado analógico paso banda (0.05 Hz a 100 Hz) para eliminar ruido muscular y de línea eléctrica (60 Hz).',
      metrics: [
        { label: 'Rango Entrada', value: '0.5 mV – 5 mV' },
        { label: 'Banda Pasante', value: '0.05 – 100 Hz' },
        { label: 'CMRR', value: '> 100 dB (60 Hz)' }
      ],
      accentColor: '#10B981',
      iconName: 'activity'
    },
    3: {
      id: 3,
      tag: 'Capa 03 · Procesamiento y Telemetría',
      title: 'Microcontrolador y Transmisión Inalámbrica (SoC)',
      specLabel: 'Componente referencia',
      specValue:
        'Microcontrolador nRF52840 o ESP32-S3 con Bluetooth Low Energy (BLE 5.0).',
      functionText:
        'Digitaliza la señal a una frecuencia de muestreo de 250 Hz con resolución de 24 bits y transmite los paquetes de datos encriptados al teléfono o estación de enfermería.',
      metrics: [
        { label: 'Muestreo (Fs)', value: '250 Hz' },
        { label: 'Resolución ADC', value: '24 bits' },
        { label: 'Conectividad', value: 'BLE 5.0 AES-128' }
      ],
      accentColor: '#06B6D4',
      iconName: 'cpu'
    },
    4: {
      id: 4,
      tag: 'Capa 04 · Gestión Energética',
      title: 'Alimentación Autónoma',
      specLabel: 'Componente',
      specValue:
        'Batería recargable de polímero de litio (LiPo) ultradelgada de 3.7 V (150 mAh).',
      functionText:
        'Hasta 72 horas de monitoreo continuo en urgencias con circuito integrado de protección contra sobrecarga y regulación LDO de bajo ruido.',
      metrics: [
        { label: 'Tensión / Cap.', value: '3.7 V · 150 mAh' },
        { label: 'Autonomía', value: 'Hasta 72 horas' },
        { label: 'Perfil', value: 'Ultradelgado 2.0 mm' }
      ],
      accentColor: '#F59E0B',
      iconName: 'battery-charging'
    },
    5: {
      id: 5,
      tag: 'Capa 05 · Interfaz Bioeléctrica Paciente',
      title: 'Matriz de 3 Electrodos de Hidrogel Ag/AgCl',
      specLabel: 'Disposición',
      specValue:
        'Triángulo compacto en el pecho para captar 3 derivaciones bipolares sin cables largos.',
      functionText:
        'Contacto conductivo de baja impedancia piel-electrodo, desechable e intercambiable entre pacientes.',
      metrics: [
        { label: 'Transductor', value: 'Ag/AgCl Hidrogel' },
        { label: 'Derivaciones', value: '3 Bipolares (I, II, III)' },
        { label: 'Uso Clínico', value: 'Base Desechable' }
      ],
      accentColor: '#EC4899',
      iconName: 'radio'
    }
  };

  /* --------------------------------------------------------------------------
   * 2. MOTOR MATEMÁTICO DE SIMULACIÓN ECG EN <CANVAS> (60 FPS)
   * -------------------------------------------------------------------------- */
  class ECGMonitorSimulator {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');

      // Escenario actual: 'normal' | 'infarction'
      this.mode = 'normal';
      this.isPaused = false;
      this.showAnnotations = true;

      // Parámetros de barrido y muestreo
      this.sweepX = 0;
      this.phase = 0; // Fase del ciclo cardíaco [0, 1)
      this.elapsedTime = 0;
      this.lastFrameTime = performance.now();

      // Buffer circular de puntos Y y colores por columna X
      this.traceY = [];
      this.traceMode = [];
      this.width = 0;
      this.height = 0;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);

      // Temporizador de simulación de triaje 15s (11.4s detección)
      this.triageTimer = null;

      this.initResize(true);
      window.addEventListener('resize', () => this.initResize(false));
      requestAnimationFrame((t) => this.loop(t));
    }

    initResize(force = false) {
      if (!this.canvas) return;
      const rect = this.canvas.parentElement.getBoundingClientRect();
      const newWidth = Math.max(260, Math.floor(rect.width));
      const newHeight = Math.max(200, Math.floor(rect.height));

      // En móviles, hacer scroll muestra/oculta la barra de direcciones y dispara 'resize' vertical.
      // Ignoramos cambios donde el ancho del contenedor no haya cambiado para no reiniciar el trazo ECG.
      if (!force && Math.abs(newWidth - this.width) < 4) {
        return;
      }

      this.width = newWidth;
      this.height = newHeight;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);

      this.canvas.width = this.width * this.dpr;
      this.canvas.height = this.height * this.dpr;
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;

      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

      const baseline = this.height * 0.62;
      this.traceY = new Float32Array(this.width).fill(baseline);
      this.traceMode = new Array(this.width).fill(this.mode);
      this.sweepX = 0;

      // Pre-llenar el primer tercio de la pantalla para que al cargar ya se vea un trazo rico
      const preloadCols = Math.floor(this.width * 0.72);
      for (let x = 0; x < preloadCols; x++) {
        this.advanceSample(1 / 145);
        this.traceY[x] = this.computeCurrentY();
        this.traceMode[x] = this.mode;
      }
      this.sweepX = preloadCols;
    }

    /**
     * Función Gaussiana auxiliar para modelar ondas P, Q, R, S, ST y T
     */
    gaussian(t, center, width, amplitude) {
      const z = (t - center) / width;
      return amplitude * Math.exp(-0.5 * z * z);
    }

    /**
     * Calcula el voltaje en mV según la fase del ciclo cardíaco [0, 1)
     */
    evaluateECGMillivolts(phase, mode) {
      let mv = 0;

      if (mode === 'normal') {
        // Ritmo Sinusal Normal (72 BPM): Onda P, QRS estrecho, ST isoeléctrico, Onda T normal
        mv += this.gaussian(phase, 0.16, 0.032, 0.15);   // Onda P
        mv += this.gaussian(phase, 0.275, 0.010, -0.11); // Onda Q
        mv += this.gaussian(phase, 0.300, 0.011, 1.28);  // Pico R alto y limpio
        mv += this.gaussian(phase, 0.326, 0.012, -0.26); // Onda S
        mv += this.gaussian(phase, 0.560, 0.048, 0.28);  // Onda T simétrica
      } else {
        // Infarto Agudo de Miocardio con Elevación del Segmento ST (STEMI - 114 BPM)
        // Complejo QRS + Punto J elevado + Meseta convexa ST (Signo de Pardee) + Onda T hiperaguda
        mv += this.gaussian(phase, 0.14, 0.030, 0.14);   // Onda P taquicárdica
        mv += this.gaussian(phase, 0.255, 0.013, -0.24); // Onda Q patológica más profunda
        mv += this.gaussian(phase, 0.285, 0.013, 1.18);  // Pico R
        mv += this.gaussian(phase, 0.310, 0.014, 0.08);  // Punto J traccionado hacia arriba
        // Elevación franca del Segmento ST fusionada con la onda T (morfología convexa de lesión subepicárdica)
        mv += this.gaussian(phase, 0.395, 0.065, 0.44);  // Meseta de elevación ST (+0.42 mV)
        mv += this.gaussian(phase, 0.515, 0.058, 0.56);  // Onda T hiperaguda acoplada
      }

      // Micro-variabilidad fisiológica y residuo post-filtro Notch 60 Hz muy sutil
      const microNoise =
        Math.sin(this.elapsedTime * 18.0) * 0.006 +
        Math.cos(this.elapsedTime * 43.0) * 0.004;

      return mv + microNoise;
    }

    advanceSample(dt) {
      this.elapsedTime += dt;
      const bpm = this.mode === 'normal' ? 72 : 114;
      const beatsPerSecond = bpm / 60;
      this.phase = (this.phase + dt * beatsPerSecond) % 1.0;
    }

    computeCurrentY() {
      const baseline = this.height * 0.63;
      const scaleMvToPx = this.height * 0.33; // 1 mV = ~33% de la altura del visor
      const mv = this.evaluateECGMillivolts(this.phase, this.mode);
      return baseline - mv * scaleMvToPx;
    }

    /**
     * Dibuja la cuadrícula milimetrada clínica sobre el Canvas
     */
    drawClinicalGrid(ctx, w, h) {
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, w, h);

      const smallStep = 6; // 1 mm equivalente
      const largeStep = 30; // 5 mm equivalente

      // Cuadrícula fina (1 mm)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.75)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= w; x += smallStep) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, h);
      }
      for (let y = 0; y <= h; y += smallStep) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(w, y + 0.5);
      }
      ctx.stroke();

      // Cuadrícula principal (5 mm)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.65)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= w; x += largeStep) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, h);
      }
      for (let y = 0; y <= h; y += largeStep) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(w, y + 0.5);
      }
      ctx.stroke();

      // Línea base isoeléctrica de referencia (0.0 mV)
      const baseline = h * 0.63;
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle =
        this.mode === 'normal'
          ? 'rgba(16, 185, 129, 0.22)'
          : 'rgba(239, 68, 68, 0.32)';
      ctx.lineWidth = 1;
      ctx.moveTo(0, baseline);
      ctx.lineTo(w, baseline);
      ctx.stroke();
      ctx.restore();

      // Pulso estándar de calibración (1 mV) en la esquina inferior izquierda
      this.drawCalibrationPulse(ctx, baseline, h * 0.33);
    }

    drawCalibrationPulse(ctx, baseline, oneMvPx) {
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const startX = 14;
      ctx.moveTo(startX, baseline);
      ctx.lineTo(startX + 6, baseline);
      ctx.lineTo(startX + 6, baseline - oneMvPx);
      ctx.lineTo(startX + 22, baseline - oneMvPx);
      ctx.lineTo(startX + 22, baseline);
      ctx.lineTo(startX + 28, baseline);
      ctx.stroke();

      ctx.fillStyle = 'rgba(148, 163, 184, 0.65)';
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.fillText('1 mV', startX + 3, baseline + 14);
      ctx.restore();
    }

    /**
     * Dibuja etiquetas clínicas en vivo en el monitor (adaptadas al ancho móvil o escritorio)
     */
    drawOverlayGuides(ctx, w, h) {
      if (!this.showAnnotations) return;
      const baseline = h * 0.63;
      const oneMvPx = h * 0.33;
      const isCompactMobile = w < 430;

      ctx.save();
      ctx.font = isCompactMobile
        ? '600 10px "JetBrains Mono", monospace'
        : '600 11px "JetBrains Mono", monospace';

      if (this.mode === 'infarction') {
        // Banda de elevación del segmento ST (> +0.2 mV umbral de isquemia)
        const stLevelY = baseline - oneMvPx * 0.42;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.09)';
        ctx.fillRect(0, stLevelY, w, baseline - stLevelY);

        ctx.beginPath();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)';
        ctx.moveTo(0, stLevelY);
        ctx.lineTo(w, stLevelY);
        ctx.stroke();

        ctx.fillStyle = '#FCA5A5';
        const stLabel = isCompactMobile
          ? '▲ ELEVACIÓN ST (+0.42 mV · Punto J)'
          : '▲ ELEVACIÓN ST (+0.42 mV · Punto J Supradesnivelado)';
        ctx.fillText(stLabel, 40, Math.max(32, stLevelY - 7));
      } else {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.78)';
        const normalLabel = isCompactMobile
          ? '● ST ISOELÉCTRICO (0.00 mV · QRS Normal)'
          : '● LÍNEA ISOELÉCTRICA ST (0.00 mV · Complejo QRS Estrecho)';
        ctx.fillText(normalLabel, 40, baseline + 15);
      }
      ctx.restore();
    }

    loop(now) {
      const dt = Math.min(0.05, (now - this.lastFrameTime) / 1000);
      this.lastFrameTime = now;

      if (!this.isPaused && this.width > 0) {
        // Velocidad de barrido equivalente a 25 mm/s (~145 px/s)
        const speedPxPerSec = 145;
        const steps = Math.max(1, Math.round(speedPxPerSec * dt));
        const subDt = dt / steps;

        for (let i = 0; i < steps; i++) {
          this.advanceSample(subDt);
          this.traceY[this.sweepX] = this.computeCurrentY();
          this.traceMode[this.sweepX] = this.mode;
          this.sweepX = (this.sweepX + 1) % this.width;
        }
      }

      this.render();
      requestAnimationFrame((t) => this.loop(t));
    }

    render() {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;
      if (!w || !h) return;

      this.drawClinicalGrid(ctx, w, h);
      this.drawOverlayGuides(ctx, w, h);

      const gapSize = 38; // Brecha de borrado estilo monitor hospitalario

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Dibujar el trazo punto a punto respetando la brecha del cabezal de barrido
      for (let x = 1; x < w; x++) {
        const distAhead = (x - this.sweepX + w) % w;
        if (distAhead > 0 && distAhead < gapSize) {
          continue; // Espacio limpio delante del cabezal
        }

        const prevDistAhead = (x - 1 - this.sweepX + w) % w;
        if (prevDistAhead > 0 && prevDistAhead < gapSize) {
          continue;
        }

        // Atenuación gradual en la cola más antigua del barrido
        const age = (this.sweepX - x + w) % w;
        const fade = Math.max(0.22, 1 - (age / w) * 0.72);

        const sampleMode = this.traceMode[x];
        const rgb =
          sampleMode === 'normal' ? '16, 185, 129' : '239, 68, 68';

        ctx.beginPath();
        ctx.strokeStyle = `rgba(${rgb}, ${fade.toFixed(2)})`;
        ctx.lineWidth = age < 90 ? 2.8 : 2.3;
        ctx.moveTo(x - 1, this.traceY[x - 1]);
        ctx.lineTo(x, this.traceY[x]);
        ctx.stroke();
      }

      // Cabezal luminoso (fósforo activo) en la posición actual de barrido
      const headX = (this.sweepX - 1 + w) % w;
      const headY = this.traceY[headX];
      const activeHex = this.mode === 'normal' ? '#10B981' : '#EF4444';

      ctx.shadowColor = activeHex;
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(headX, headY, 4.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = activeHex;
      ctx.beginPath();
      ctx.arc(headX, headY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    setScenario(newMode) {
      this.mode = newMode;
      updateClinicalUI(newMode);
    }

    togglePause() {
      this.isPaused = !this.isPaused;
      return this.isPaused;
    }
  }

  /* --------------------------------------------------------------------------
   * 3. CONTROLADOR DE INTERFAZ DEL MONITOR ECG Y SIMULACIÓN DE TRIAJE 15S
   * -------------------------------------------------------------------------- */
  let triageIntervalId = null;

  function updateClinicalUI(mode) {
    const btnNormal = document.getElementById('btn-scenario-normal');
    const btnInfarction = document.getElementById('btn-scenario-infarction');
    const bpmValue = document.getElementById('ecg-bpm-value');
    const bpmLabel = document.getElementById('ecg-bpm-status');
    const heartIcon = document.getElementById('ecg-heart-icon');
    const stValue = document.getElementById('ecg-st-value');
    const qrsValue = document.getElementById('ecg-qrs-value');
    const spo2Value = document.getElementById('ecg-spo2-value');

    const statusNormalBox = document.getElementById('ai-status-normal');
    const triageProgressBox = document.getElementById('ai-triage-progress');
    const alertPriorityCard = document.getElementById('ai-alert-priority');
    const progressBarFill = document.getElementById('triage-bar-fill');
    const progressStepText = document.getElementById('triage-step-text');
    const progressTimeText = document.getElementById('triage-time-counter');

    if (triageIntervalId) {
      clearInterval(triageIntervalId);
      triageIntervalId = null;
    }

    if (mode === 'normal') {
      // Estado Botón A (Activo) vs Botón B (Inactivo)
      btnNormal.className =
        'touch-target flex-1 flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm sm:text-base transition-all border-2 bg-emerald-500/15 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-950/50';
      btnInfarction.className =
        'touch-target flex-1 flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm sm:text-base transition-all border border-slate-700 bg-slate-800/70 text-slate-300 hover:border-red-400/60 hover:text-white';

      // Lecturas numéricas
      bpmValue.textContent = '72';
      bpmValue.className =
        'font-mono-clinical text-3xl sm:text-5xl font-extrabold text-emerald-400 tracking-tight';
      bpmLabel.textContent = 'RITMO SINUSAL NORMAL';
      bpmLabel.className =
        'text-[11px] sm:text-xs font-mono-clinical uppercase tracking-wider text-emerald-400 mt-0.5 font-bold';
      heartIcon.className = 'w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 animate-heartbeat self-center mr-1';

      stValue.textContent = '0.00 mV (Normal)';
      stValue.className = 'font-mono-clinical text-[11px] sm:text-sm font-semibold text-emerald-400 mt-0.5 truncate';
      qrsValue.textContent = '84 ms (Estrecho)';
      spo2Value.textContent = '98%';

      // Mostrar caja verde de IA Normal y ocultar alertas rojas
      statusNormalBox.classList.remove('hidden');
      triageProgressBox.classList.add('hidden');
      alertPriorityCard.classList.add('hidden');
    } else {
      // Vibración háptica sutil en dispositivos móviles compatibles al simular la emergencia
      if (navigator.vibrate) {
        try {
          navigator.vibrate([45, 30, 80]);
        } catch (_) {}
      }

      // Estado Botón B (Activo - Simular Infarto)
      btnInfarction.className =
        'touch-target flex-1 flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm sm:text-base transition-all border-2 bg-red-500/20 border-red-500 text-red-200 shadow-lg shadow-red-950/60';
      btnNormal.className =
        'touch-target flex-1 flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm sm:text-base transition-all border border-slate-700 bg-slate-800/70 text-slate-300 hover:border-emerald-400/60 hover:text-white';

      // Lecturas numéricas patológicas
      bpmValue.textContent = '114';
      bpmValue.className =
        'font-mono-clinical text-3xl sm:text-5xl font-extrabold text-red-400 tracking-tight';
      bpmLabel.textContent = 'TAQUICARDIA · SUPRADESNIVEL ST';
      bpmLabel.className =
        'text-[11px] sm:text-xs font-mono-clinical uppercase tracking-wider text-red-400 mt-0.5 font-bold';
      heartIcon.className = 'w-5 h-5 sm:w-6 sm:h-6 text-red-500 animate-ping self-center mr-1';

      stValue.textContent = '+0.42 mV (Elevado)';
      stValue.className = 'font-mono-clinical text-[11px] sm:text-sm font-semibold text-red-400 mt-0.5 truncate';
      qrsValue.textContent = '108 ms (Alterado)';
      spo2Value.textContent = '93%';

      // Iniciar simulación del Triaje en 15 s (Detección en 11.4 s)
      statusNormalBox.classList.add('hidden');
      alertPriorityCard.classList.add('hidden');
      triageProgressBox.classList.remove('hidden');

      let progress = 0;
      progressBarFill.style.width = '0%';
      progressTimeText.textContent = '0.0 s / 15.0 s';
      progressStepText.textContent = 'Analizando morfología QRS-ST...';

      const stepsMessages = [
        { pct: 0, text: 'Analizando morfología QRS-ST en Derivación II...' },
        { pct: 32, text: 'Detectando elevación del Punto J (+0.42 mV > umbral)...' },
        { pct: 68, text: 'Clasificando con Red Neuronal 1D-CNN (Confianza 99.1%)...' },
        { pct: 90, text: 'Empaquetando alerta prioritaria vía Telemedicina...' }
      ];

      // Animación ágil (~2.2 segundos reales representando los 11.4 s clínicos)
      triageIntervalId = setInterval(() => {
        progress += 4;
        if (progress > 100) progress = 100;

        progressBarFill.style.width = `${progress}%`;
        const simulatedSeconds = ((progress / 100) * 11.4).toFixed(1);
        progressTimeText.textContent = `${simulatedSeconds} s / 15.0 s`;

        for (let i = stepsMessages.length - 1; i >= 0; i--) {
          if (progress >= stepsMessages[i].pct) {
            progressStepText.textContent = stepsMessages[i].text;
            break;
          }
        }

        if (progress >= 100) {
          clearInterval(triageIntervalId);
          triageIntervalId = null;
          setTimeout(() => {
            triageProgressBox.classList.add('hidden');
            alertPriorityCard.classList.remove('hidden');
          }, 180);
        }
      }, 75);
    }
  }

  /* --------------------------------------------------------------------------
   * 4. EXPLORADOR INTERACTIVO DE CAPAS DEL PROTOTIPO (SECCIÓN 3)
   * -------------------------------------------------------------------------- */
  let currentLayerId = 1;

  function selectPrototypeLayer(layerId) {
    const data = PROTOTYPE_LAYERS[layerId];
    if (!data) return;
    currentLayerId = Number(layerId);

    // Actualizar botones Hotspot (1 al 5) y píldoras selectoras
    document.querySelectorAll('[data-hotspot-id]').forEach((btn) => {
      const id = Number(btn.getAttribute('data-hotspot-id'));
      if (id === currentLayerId) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });

    // Actualizar capas del diagrama SVG explosivo
    document.querySelectorAll('.svg-layer-group').forEach((layerEl) => {
      const id = Number(layerEl.getAttribute('data-layer'));
      if (id === currentLayerId) {
        layerEl.classList.add('layer-active');
        layerEl.classList.remove('layer-dimmed');
      } else {
        layerEl.classList.remove('layer-active');
        layerEl.classList.add('layer-dimmed');
      }
    });

    // Actualizar tarjeta lateral de especificaciones técnicas
    const tagEl = document.getElementById('proto-detail-tag');
    const numEl = document.getElementById('proto-detail-num');
    const titleEl = document.getElementById('proto-detail-title');
    const specLabelEl = document.getElementById('proto-detail-spec-label');
    const specValueEl = document.getElementById('proto-detail-spec-value');
    const funcEl = document.getElementById('proto-detail-function');
    const metricsContainer = document.getElementById('proto-detail-metrics');

    if (tagEl) tagEl.textContent = data.tag;
    if (numEl) numEl.textContent = `0${data.id}`;
    if (titleEl) titleEl.textContent = data.title;
    if (specLabelEl) specLabelEl.textContent = `${data.specLabel}:`;
    if (specValueEl) specValueEl.textContent = data.specValue;
    if (funcEl) funcEl.textContent = data.functionText;

    if (metricsContainer) {
      metricsContainer.innerHTML = data.metrics
        .map(
          (m) => `
          <div class="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-2.5 sm:p-3 flex sm:block items-center justify-between">
            <div class="text-[11px] uppercase tracking-wider text-slate-400 font-medium">${m.label}</div>
            <div class="font-mono-clinical text-xs sm:text-sm font-bold text-cyan-400 sm:mt-1">${m.value}</div>
          </div>
        `
        )
        .join('');
    }
  }

  /* --------------------------------------------------------------------------
   * 5. INICIALIZACIÓN DE EVENTOS AL CARGAR EL DOM
   * -------------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    // Inicializar iconos Lucide si están disponibles
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }

    // Instanciar el Simulador ECG en Canvas
    const simulator = new ECGMonitorSimulator('ecg-canvas');

    const btnNormal = document.getElementById('btn-scenario-normal');
    const btnInfarction = document.getElementById('btn-scenario-infarction');
    const btnPause = document.getElementById('btn-ecg-pause');
    const btnReplayTriage = document.getElementById('btn-replay-triage');

    if (btnNormal) {
      btnNormal.addEventListener('click', () => simulator.setScenario('normal'));
    }
    if (btnInfarction) {
      btnInfarction.addEventListener('click', () =>
        simulator.setScenario('infarction')
      );
    }
    if (btnReplayTriage) {
      btnReplayTriage.addEventListener('click', () =>
        simulator.setScenario('infarction')
      );
    }
    if (btnPause) {
      btnPause.addEventListener('click', () => {
        const paused = simulator.togglePause();
        btnPause.innerHTML = paused
          ? '<span class="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1.5"></span>Reanudar Trazo'
          : '<span class="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1.5"></span>Congelar Trazo';
      });
    }

    // Inicializar Explorador Interactivo de Capas (Sección 3)
    selectPrototypeLayer(1);

    document.querySelectorAll('[data-hotspot-id]').forEach((btn) => {
      const id = Number(btn.getAttribute('data-hotspot-id'));
      btn.addEventListener('click', () => selectPrototypeLayer(id));
      btn.addEventListener('mouseenter', () => {
        if (window.innerWidth >= 1024) {
          selectPrototypeLayer(id);
        }
      });
    });

    document.querySelectorAll('.svg-layer-group').forEach((layerEl) => {
      const id = Number(layerEl.getAttribute('data-layer'));
      layerEl.addEventListener('click', () => selectPrototypeLayer(id));
    });

    // Botones Anterior / Siguiente capa para comodidad en móvil
    const btnPrevLayer = document.getElementById('btn-prev-layer');
    const btnNextLayer = document.getElementById('btn-next-layer');
    if (btnPrevLayer) {
      btnPrevLayer.addEventListener('click', () => {
        const prev = currentLayerId <= 1 ? 5 : currentLayerId - 1;
        selectPrototypeLayer(prev);
      });
    }
    if (btnNextLayer) {
      btnNextLayer.addEventListener('click', () => {
        const next = currentLayerId >= 5 ? 1 : currentLayerId + 1;
        selectPrototypeLayer(next);
      });
    }

    // Alternar Vista Explosiva vs Vista Ensamblada en el SVG
    const btnToggleExploded = document.getElementById('btn-toggle-exploded');
    const protoSvg = document.getElementById('prototype-exploded-svg');
    if (btnToggleExploded && protoSvg) {
      btnToggleExploded.addEventListener('click', () => {
        const isCompact = protoSvg.classList.toggle('mode-compact');
        btnToggleExploded.textContent = isCompact
          ? 'Separar Capas (Vista Explosiva)'
          : 'Compactar Capas (Ensamblado)';
      });
    }

    // Alternar entre Diagrama Interactivo SVG y Render 3D Fotorealista
    const tabSvgView = document.getElementById('tab-view-svg');
    const tabRenderView = document.getElementById('tab-view-render');
    const panelSvgView = document.getElementById('panel-view-svg');
    const panelRenderView = document.getElementById('panel-view-render');

    if (tabSvgView && tabRenderView && panelSvgView && panelRenderView) {
      tabSvgView.addEventListener('click', () => {
        panelSvgView.classList.remove('hidden');
        panelRenderView.classList.add('hidden');
        tabSvgView.className =
          'touch-target px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#EA434E] text-white shadow transition-all';
        tabRenderView.className =
          'touch-target px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all';
      });
      tabRenderView.addEventListener('click', () => {
        panelRenderView.classList.remove('hidden');
        panelSvgView.classList.add('hidden');
        tabRenderView.className =
          'touch-target px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#EA434E] text-white shadow transition-all';
        tabSvgView.className =
          'touch-target px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all';
      });
    }
  });
})();
