# Cochabamba Resiliente

App web para agricultores de Cochabamba con datos satelitales de la NASA.
No necesita instalar nada: abre `index.html` en el navegador.

## Estructura

```
index.html                 Estructura de las pantallas (HTML)
css/styles.css             Todos los estilos
assets/img/                Imagen satelital integrada de Cochabamba
js/
  config.js                Configuración: URL del servicio de alertas, modo demo, QR
  core/utils.js            Utilidades: $(), localStorage, toast
  i18n/es.js en.js qu.js   Textos en español, inglés y quechua
  i18n/i18n.js             Idioma activo y funciones t() / tl()
  data/geo.js              Contorno del departamento y calibración de la imagen
  data/municipios.js       Municipios, cultivos y colores de riesgo
  map/geometry.js          Proyección del mapa y zonas por municipio
  map/map.js               Mapa interactivo (capas NASA GIBS, zoom, GPS)
  features/granja.js       Pantalla "Mi granja"
  features/estadisticas.js Datos NASA POWER, gráfico y recomendaciones
  features/alertas.js      Pronóstico (Open-Meteo) y suscripción por correo
  features/chat.js         Asistente "Cosecha"
  features/compartir.js    Enlace, QR y WhatsApp
  app.js                   Navegación entre pantallas e inicio (se carga al final)
```

## Reglas para editar

- Los scripts son clásicos (no módulos) y comparten variables globales, así que
  el **orden de los `<script>` en `index.html` importa**. Si creas un archivo,
  ponlo antes de `app.js`.
- Un texto nuevo va con la misma clave en `es.js`, `en.js` y `qu.js`. Si falta
  en un idioma, se usa el español.
