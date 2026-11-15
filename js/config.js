/* =========================================================
   Configuración general de la app
   Cambia estos valores al publicar la app.
   ========================================================= */
var CFG = {
  // Dirección del servicio de alertas por correo y del chat con IA (Google Apps Script).
  // Ver backend/README.md. Ejemplo: "https://script.google.com/macros/s/XXXX/exec"
  API: "https://script.google.com/macros/s/AKfycbwtueZRPVLMqeF-uWnRY4LF7DSxvkUML5PnOtpW2L9de8oWPXTAO_rebabFxLbQwxFGQw/exec",

  // Enlace público de la app (para el QR y para compartir por WhatsApp).
  // Si está vacío y la app se abre desde internet, se usa la dirección actual.
  PUBLIC: "https://valentinmercado284-ai.github.io/hackathon-cbba-resilient/",

  // Imagen del QR ya generada (opcional, por ejemplo "assets/img/qr.png") para cuando no hay internet.
  QR: "",

  // Modo demostración: sin internet, con datos de ejemplo (para presentar en lugares sin conexión).
  DEMO: false,

  // Cuántas horas se reutilizan los datos guardados de la NASA antes de volver a descargarlos.
  CACHE_HOURS: 12
};
