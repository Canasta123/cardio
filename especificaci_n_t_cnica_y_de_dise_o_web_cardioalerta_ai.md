# Especificación de Desarrollo Web: CardioAlerta AI (Landing Page & Simulador ECG)

## 1. Instrucciones Maestras para el Asistente de Código (Antigravity)

**Rol y Objetivo:**
Actúa como un Desarrollador Frontend Senior y Diseñador UI/UX especializado en tecnología médica (*MedTech*). Tu objetivo es construir una aplicación web *One-Page* (Landing Page interactiva) con enfoque **Mobile-First** para el proyecto de Ingeniería Biomédica **CardioAlerta AI**, presentado en el proceso de admisión de la Universidad Militar Nueva Granada (UMNG).

**Contexto de Uso:**
El jurado evaluador escaneará un código QR desde una infografía impresa usando sus teléfonos móviles durante una entrevista de $2\text{ minutos}$. Por lo tanto, la página debe cargar instantáneamente, verse impecable en pantallas verticales (smartphones) y escritorio, y mostrar de forma inmediata el **Visor ECG Interactivo** junto con el **Desglose Técnico del Prototipo**.

**Stack Tecnológico Requerido:**
* **Estructura:** HTML5 semántico.
* **Estilos:** Tailwind CSS (vía CDN o configuración local) + CSS personalizado para animaciones de ondas bioeléctricas.
* **Interactividad:** JavaScript Vanilla (o React si el proyecto está inicializado con Vite) para controlar el simulador ECG en `<canvas>` o `<svg>` dinámico y el explorador interactivo de partes del prototipo.
* **Iconografía:** Lucide Icons o Heroicons.

---

## 2. Sistema de Diseño e Identidad Visual

El diseño web debe mantener coherencia visual directa con la infografía impresa (estilo limpio, orgánico y médico), incorporando un contraste oscuro específico para los módulos de monitoreo clínico.

### 2.1. Paleta de Colores
* **Fondo Principal (Herencia de Infografía):** Gris cálido suave `#EBE9E8` y secciones alternas en blanco puro `#FFFFFF`.
* **Color Primario (Acento Biomédico / Alerta):** Rojo coral `#EA434E` (hover: `#D0323D`).
* **Texto Principal y Encabezados:** Carbón profundo `#141414`.
* **Texto Secundario / Técnico:** Gris pizarra `#4B5563`.
* **Tema Clínico (Exclusivo para el Visor ECG y Esquema Técnico):**
  * Fondo del monitor: Azul noche clínico `#0F172A` con cuadrícula milimetrada sutil en `#1E293B`.
  * Trazo ECG Normal (Ritmo Sinusal): Verde neón médico `#10B981`.
  * Trazo ECG Patológico (Isquemia / Elevación ST): Rojo alerta `#EF4444`.
  * Indicadores de telemetría (SpO2 / Batería / BLE): Cian clínico `#06B6D4`.

### 2.2. Tipografía y Estilo de Componentes
* **Tipografía Sans-Serif Principal:** `Inter` o `Plus Jakarta Sans` (títulos en `font-extrabold`, cuerpo en `font-normal`).
* **Tipografía Monoespaciada (Datos del Monitor y Frecuencias):** `JetBrains Mono` o `Fira Code` para valores numéricos en tiempo real ($\text{BPM}$, $\text{mV}$, $\text{ms}$).
* **Bordes y Sombras:** Tarjetas con bordes muy redondeados (`rounded-3xl`), bordes finos (`border-slate-200`) y sombras suaves (`shadow-lg`).

---

## 3. Arquitectura de la Página (Secciones Detalladas)

La página debe estructurarse en **6 secciones verticales** fluidas con una barra de navegación superior fija (*sticky navbar*) minimalista.

### Sección 0: Barra Superior (Sticky Header)
* **Izquierda:** Ícono de corazón con pulso + Nombre **CardioAlerta AI**.
* **Derecha:** Insignia o *badge* que diga `UMNG · Ingeniería Biomédica` y un botón rápido `Ir al Monitor ECG`.

---

### Sección 1: Hero Section (Presentación de Impacto)
* **Etiqueta superior (Pill):** `Telemedicina + IA en Diagnóstico Médico` (Fondo `#FCE8E9`, texto `#EA434E`).
* **Título Principal:** "Triaje Cardíaco Remoto en $15\text{ Segundos}$".
* **Subtítulo:** "Parche bioinstrumentado portátil de $3\text{ derivaciones}$ con Inteligencia Artificial para la detección temprana de isquemia aguda y arritmias en hospitales rurales de Colombia."
* **Botones de Acción (CTA):**
  1. Botón Primario (`#EA434E`): "Probar Simulador ECG en Vivo" (hace scroll suave a la Sección 2).
  2. Botón Secundario (Borde oscuro): "Explorar Prototipo y Hardware" (hace scroll a la Sección 3).
* ** Tarjetas de Estadísticas Rápidas (Datos Oficiales DANE):**
  * **$17\%$**: De las muertes en Colombia son por enfermedad isquémica cardíaca ($1.\text{ª}$ causa nacional).
  * **$+50.000$**: Fallecimientos anuales agravados por demoras diagnósticas en zonas sin cardiólogo.
  * **$-70\%$**: Reducción proyectada en el tiempo de respuesta en urgencias de primer nivel.

---

### Sección 2: Visor ECG Interactivo (El Núcleo de la Demostración)
Esta sección simula la interfaz médica que recibe la señal del parche por Bluetooth. Debe tener un aspecto de monitor hospitalario moderno sobre fondo oscuro (`#0F172A`).

**Requerimientos Funcionales del Simulador:**
1. **Pantalla de Trazado (`<canvas>` o `<svg>` animado):**
   * Fondo con cuadrícula tipo papel milimetrado de electrocardiografía.
   * Una onda P-Q-R-S-T dibujándose continuamente de izquierda a derecha con efecto de barrido.
2. **Selector de Escenario Clínico (Botones Interactivos para el Jurado):**
   * **Botón A — "Paciente 1: Ritmo Sinusal Normal"**:
     * Onda verde (`#10B981`), complejo QRS estrecho normal, segmento ST isoeléctrico.
     * Frecuencia cardíaca: $72\text{ BPM}$.
     * Estado del Algoritmo IA: Caja verde que dice `IA: Ritmo Sinusal Normal (Confianza: 98.4%) — Sin alerta`.
   * **Botón B — "Paciente 2: Simular Infarto (Elevación ST)"**:
     * Al hacer clic, la onda cambia a color rojo/ámbar (`#EF4444`), muestra una elevación clara del segmento ST y taquicardia.
     * Frecuencia cardíaca sube a $114\text{ BPM}$.
     * **Simulación del Triaje en $15\text{ s}$:** Se activa una barra de progreso rápida ("Analizando morfología QRS-ST...") y lanza una **Tarjeta de Alerta Prioritaria**:
       * `ALERTA ROJA: Posible Infarto Agudo de Miocardio (Elevación del Segmento ST en Derivación II)`.
       * `Acción Automática: Reporte enviado al Cardiólogo de Turno vía Telemedicina (Tiempo de detección: 11.4 s)`.
3. **Indicadores de Telemetría del Parche en el Monitor:**
   * Estado de conexión: `BLE 5.0 Conectado` (con punto parpadeante).
   * Relación Señal/Ruido: `Filtro Notch 60 Hz Activo`.
   * Nivel de batería del parche: `94%`.

---

### Sección 3: Anatomía del Prototipo y Componentes de Hardware
Esta sección explica qué hay dentro del parche **CardioAlerta AI** y cómo está construido físicamente.

**3.1. Modelo Visual / Diagrama Interactivo del Dispositivo (Requerimiento Visual):**
Construye mediante código un **Esquema Visual Interactivo por Capas (Vista Explosiva en SVG/CSS)** del parche biomédico donde el usuario pueda tocar o pasar el cursor sobre **5 puntos calientes (Hotspots)** numerados del $1$ al $5$. Al seleccionar cada punto, una tarjeta lateral actualiza la información técnica del componente:

* **Capa / Punto 1: Carcasa Superior Flexible (Biomaterial):**
  * *Material:* Elastómero de silicona de grado médico hipoalergénico e impermeable (certificación IP67).
  * *Función:* Protege la electrónica permitiendo que el parche se adapte a la curvatura del tórax del paciente.
* **Capa / Punto 2: Módulo de Adquisición Analógica (AFE — Analog Front-End):**
  * *Componente referencia:* Chip bioinstrumentado tipo `ADS1293` o `AD8232` de bajo consumo.
  * *Función:* Amplifica los biopotenciales cardíacos (rango de $0.5\text{ mV}$ a $5\text{ mV}$) y aplica filtrado analógico paso banda ($0.05\text{ Hz}$ a $100\text{ Hz}$) para eliminar ruido muscular y de línea eléctrica ($60\text{ Hz}$).
* **Capa / Punto 3: Microcontrolador y Transmisión Inalámbrica (SoC):**
  * *Componente referencia:* Microcontrolador `nRF52840` o `ESP32-S3` con Bluetooth Low Energy (BLE $5.0$).
  * *Función:* Digitaliza la señal a una frecuencia de muestreo de $250\text{ Hz}$ con resolución de $24\text{ bits}$ y transmite los paquetes de datos encriptados al teléfono o estación de enfermería.
* **Capa / Punto 4: Alimentación Autónoma:**
  * *Componente:* Batería recargable de polímero de litio (LiPo) ultradelgada de $3.7\text{ V}$ ($150\text{ mAh}$).
  * *Autonomía:* Hasta $72\text{ horas}$ de monitoreo continuo en urgencias.
* **Capa / Punto 5: Matriz de $3\text{ Electrodos}$ de Hidrogel Ag/AgCl:**
  * *Disposición:* Triángulo compacto en el pecho para captar $3\text{ derivaciones}$ bipolares sin cables largos.
  * *Función:* Contacto conductivo de baja impedancia piel-electrodo, desechable e intercambiable entre pacientes.

*(Nota opcional para imagen 3D: Dejar un contenedor de imagen limpio por si el desarrollador desea insertar adicionalmente un render 3D del parche en formato PNG/WebP).*

---

### Sección 4: Funcionamiento Paso a Paso (Pipeline de Ingeniería Biomédica)
Presentar un flujo horizontal (o línea de tiempo vertical en móvil) con los **4 pasos de funcionamiento** que conectan el cuerpo humano con el médico especialista:

1. **01. Captación Bioeléctrica:**
   * El personal de enfermería en el puesto de salud rural adhiere el parche al tórax del paciente con dolor torácico. Los $3\text{ electrodos}$ Ag/AgCl captan la actividad eléctrica cardíaca al instante.
2. **02. Acondicionamiento y Digitalización:**
   * El circuito interno amplifica la señal milivóltica, elimina artefactos por movimiento o respiración (deriva de línea base) y envía el flujo de datos vía Bluetooth Low Energy.
3. **03. Clasificación por IA (Red Neuronal 1D-CNN):**
   * Un algoritmo de Inteligencia Artificial entrenado con bases de datos clínicas (como *MIT-BIH Arrhythmia Database* y *PTB Diagnostic ECG*) analiza cada latido en menos de $15\text{ segundos}$ buscando elevaciones del segmento ST o arritmias ventriculares.
4. **04. Triaje y Telemedicina Prioritaria:**
   * Si detecta riesgo de isquemia, el sistema genera una alerta prioritaria en el panel del cardiólogo de referencia a kilómetros de distancia, quien valida el trazado y autoriza el tratamiento trombolítico o traslado inmediato dentro de la "hora dorada".

---

### Sección 5: Matriz de Beneficios y Valor Agregado
Diseñar una cuadrícula de $3\text{ tarjetas}$ limpias (inspiradas en los corazones blancos de la infografía) resaltando el impacto clínico y económico:

* **Eficiencia Clínica ($-70\%$ Tiempo de Respuesta):** Elimina las horas de espera para la lectura experta de un electrocardiograma en municipios sin especialistas de planta.
* **Sostenibilidad y Ahorro Hospitalario:** Reduce hasta en un $40\%$ las remisiones innecesarias en ambulancia por dolores torácicos no cardíacos, optimizando los recursos del sistema de salud.
* **Diseño Accesible y Reutilizable:** A diferencia de los electrocardiógrafos hospitalarios costosos, el núcleo electrónico del parche es reutilizable; solo se reemplaza la base adhesiva de electrodos de bajo costo.

---

### Sección 6: Hoja de Ruta en la UMNG y Perfil del Aspirante (Footer / CTA)
Esta sección cierra la página respondiendo directamente a la rúbrica de admisión ("Llamado a la Acción"):

* **Título:** "Proyección de Desarrollo en la Universidad Militar Nueva Granada".
* **Texto de Propuesta:** "Este proyecto conceptual ha sido estructurado para desarrollarse de manera progresiva dentro de los laboratorios y semilleros de investigación del programa de Ingeniería Biomédica de la UMNG:"
  * **Fase 1 (Semestres Iniciales):** Diseño y simulación del circuito de bioinstrumentación (amplificador de instrumentación y filtros activos) en laboratorio.
  * **Fase 2 (Semestres Intermedios):** Entrenamiento del modelo de Inteligencia Artificial en Python con señales reales de bases de datos abiertas (*PhysioNet*).
  * **Fase 3 (Validación):** Integración del PCB flexible, carcasa impresa en 3D con biomateriales y pruebas en simulador de paciente.
* **Tarjeta del Autor (Editable en el código):**
  * **Nombre:** `[Tu Nombre Completo]`
  * **Rol:** Aspirante al Programa de Ingeniería Biomédica — UMNG (Campus Nueva Granada).
  * **Áreas de Enfoque:** Telemedicina y Salud Digital · Inteligencia Artificial en Diagnóstico Médico.

---

## 4. Anexo: Prompt para Generar Imagen/Render 3D de Referencia (Opcional)

Si deseas generar una ilustración o render fotorrealista del parche para incrustarlo en la **Sección 3**, puedes usar este *prompt* en cualquier generador de imágenes (o pedirle al asistente que genere un recurso visual con estas características):

> **Prompt de Imagen:**
> *Product design render of a modern wearable biomedical ECG patch named "CardioAlerta AI", semi-exploded view showing internal components: a soft white and coral-red (#EA434E) medical-grade silicone top casing, a compact green-gold flexible PCB in the middle with a Bluetooth microchip, and three silver/silver-chloride (Ag/AgCl) circular hydrogel electrodes at the base. Clean studio background in warm light gray (#EBE9E8), minimalist medical aesthetic, high detail, 8k product visualization.*

---

## 5. Criterios de Aceptación para el Código Generado
1. **Cero dependencias rotas:** Todo debe funcionar al abrir el archivo o desplegarlo en un host estático gratuito (Vercel, Netlify o GitHub Pages).
2. **Animación fluida a $60\text{ FPS}$:** El visor ECG no debe depender de imágenes estáticas; debe ser una onda generada matemáticamente en `<canvas>` o mediante animación SVG continua que responda en tiempo real al presionar los botones de "Ritmo Normal" y "Simular Infarto (Elevación ST)".
3. **Diseño Responsivo:** En pantallas de $375\text{ px}$ a $430\text{ px}$ de ancho (iPhone / Android), los botones del simulador ECG y los puntos del prototipo deben ser fáciles de tocar con el pulgar (`min-height: 48px`).