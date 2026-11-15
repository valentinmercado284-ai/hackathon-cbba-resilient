# Cochabamba Resiliente

App web para agricultores de Cochabamba (Bolivia) con datos satelitales de la NASA:
mapa de riesgos, datos climáticos de la granja, pronóstico de 7 días, alertas por
correo y un asistente («Cosecha»). En español, inglés y quechua.

## Cómo abrirla

- **En tu computadora**: abre `index.html` con doble clic. Funciona todo lo que
  usa internet (mapas, NASA POWER, pronóstico, chat básico).
- **Publicada en internet** (recomendado para compartirla): súbela a GitHub Pages
  (repositorio → Settings → Pages → rama y carpeta raíz). Así además:
  - se puede **instalar en el celular** como una app;
  - **funciona sin internet** con los últimos datos guardados;
  - el QR y el botón de compartir usan el enlace público.

## Qué funciona y de dónde vienen los datos

| Pantalla | Qué hace | Fuente |
|---|---|---|
| Mapa | Imagen satelital del día, lluvia, humedad del suelo, vegetación, incendios y zonas de riesgo por municipio. Toca el mapa o usa el GPS para marcar tu granja. | NASA GIBS (MODIS, GPM IMERG, SMAP, VIIRS) |
| Mi granja | Ubicación, cultivo y detalles. Se guarda solo en el dispositivo. | — |
| Datos NASA | Lluvia de 90 días y humedad del suelo comparadas con lo normal, noches de helada, gráfico de 12 meses, nivel de riesgo y recomendaciones. Se guardan 12 horas y sirven sin internet. | NASA POWER (desde 2010) |
| Alertas | Pronóstico de 7 días, alertas de lluvia fuerte y helada, y suscripción por correo. | Open-Meteo + NASA POWER |
| Cosecha | Chat. Sin IA responde con una guía de buenas prácticas y los datos de la granja; con IA usa OpenAI. | Guía propia / OpenAI |
| Aprende y Compartir | Consejos por riesgo, fuentes de datos, enlace, QR y WhatsApp. | — |

Para que funcionen **los correos de alerta** y **el chat con IA** hay que publicar el
servicio gratuito de Google Apps Script: ver [backend/README.md](backend/README.md).

## Estructura

```
index.html                    Estructura de las pantallas
manifest.webmanifest, sw.js   Instalación en el celular y uso sin internet
css/
  base.css                    Colores (claro y oscuro), tipografía y reset
  layout.css                  Barra superior, pestañas, menú y contenido
  components.css              Tarjetas, botones, formularios, chips, insignias…
  views.css                   Estilos propios de cada pantalla
assets/
  img/                        Imagen satelital integrada de Cochabamba
  icons/                      Íconos de la app
js/
  config.js                   Configuración: servicio de alertas, enlace público, modo demo
  core/utils.js               Utilidades: $(), almacenamiento, iconos, avisos, fechas
  core/state.js               Estado compartido: la granja guardada (FARM) y los datos (FS, FC)
  core/ui.js                  Piezas de interfaz: insignias de riesgo, cargas, errores
  core/router.js              Pantallas y navegación con # (el botón «atrás» funciona)
  i18n/es.js en.js qu.js      Textos en español, inglés y quechua
  i18n/i18n.js                Idioma activo y funciones t() / tl()
  data/geo.js                 Contorno del departamento y calibración de la imagen
  data/municipios.js          Municipios, cultivos y riesgos estimados
  data/conocimiento.js        Guía del asistente para responder sin IA
  services/nasa-power.js      Descarga y cálculos de NASA POWER (con caché)
  services/forecast.js        Pronóstico de Open-Meteo (con caché)
  services/backend.js         Conexión con el servicio de Apps Script
  map/geometry.js             Proyección del mapa y zonas por municipio
  map/map.js                  Mapa interactivo
  features/*.js               Una pantalla por archivo: inicio, granja, estadisticas,
                              alertas, chat, aprende, compartir
  app.js                      Arranque: idioma, clics, conexión (se carga al final)
backend/                      Servicio de alertas por correo y chat con IA (Apps Script)
```

## Reglas para editar

- Los scripts son clásicos (no módulos) y comparten variables globales: el **orden de
  los `<script>` en `index.html` importa**. Si creas un archivo, ponlo antes de
  `app.js` y súmalo a la lista `CORE` de `sw.js`.
- Los botones usan `data-act="nombre"`; la acción se registra en `ACTIONS.nombre`
  dentro del archivo de su pantalla. Cada pantalla se dibuja en `VIEW_HOOKS.id`.
- Los textos visibles van en los archivos de idioma, con la misma clave en `es.js` y
  `en.js` (y en `qu.js` cuando haya traducción; si falta, se muestra el español).
  En el HTML se usan `data-i` (texto), `data-h` (HTML), `data-p` (placeholder) y
  `data-a` (etiqueta accesible).
- Todo texto que escribe el usuario se inserta con `esc()` para evitar inyección de HTML.
