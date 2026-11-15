# Servicio de alertas por correo y chat (Google Apps Script)

La app funciona sin este servicio: la granja, el mapa, los datos de la NASA, el
pronóstico y el chat básico corren en el navegador. Este servicio agrega lo que
necesita un servidor:

- **Alertas por correo**: guarda las suscripciones en una hoja de Google y, todos
  los días a las 6:00 (hora de Bolivia), revisa el pronóstico de cada granja.
- **Correo de bienvenida** al suscribirse y **correo de prueba** con el pronóstico real.
- **Baja**: cada correo trae un enlace para dejar de recibirlos.
- **Chat con IA** (opcional): la clave de OpenAI queda guardada en el servidor y no
  en el navegador, con un límite diario de mensajes para cuidar el costo.

Es gratis y no hace falta instalar nada. Los correos salen de la cuenta de Google
que publica el servicio: conviene usar una cuenta del equipo, no una personal.

## Publicarlo (unos 10 minutos)

1. Entra a Google Drive con la cuenta del equipo y crea una hoja de cálculo nueva
   (o abre `sheets.new`). Ponle de nombre «Cochabamba Resiliente - Suscriptores».
2. En la hoja: **Extensiones → Apps Script**. Se abre el editor.
3. Borra todo lo que hay en `Código.gs` y pega el contenido completo de
   [google-apps-script/Code.gs](google-apps-script/Code.gs). Guarda (Ctrl + S).
4. Ve a **Configuración del proyecto** (el engranaje ⚙️ de la izquierda) y marca
   «Mostrar el archivo de manifiesto "appsscript.json" en el editor». Vuelve al
   **Editor**, abre `appsscript.json`, reemplaza su contenido por el de
   [google-apps-script/appsscript.json](google-apps-script/appsscript.json) y guarda.
5. Arriba, en la lista de funciones, elige **`instalarActivador`** y pulsa **Ejecutar**.
   Google pide permisos:
   - **Revisar permisos** → elige la cuenta.
   - Si aparece «**Google no verificó esta app**»: es normal, porque el script es
     tuyo. Pulsa **Configuración avanzada** → **Ir a … (no seguro)** → **Permitir**.

   Esto programa la revisión diaria de las 6:00 y prepara la hoja «Suscriptores».
6. **Implementar → Nueva implementación**. En el engranaje de «Seleccionar tipo»
   elige **Aplicación web** y completa:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario** (no «Cualquier usuario con cuenta de Google»)

   Pulsa **Implementar** y copia la **URL de la aplicación web** (termina en `/exec`).
7. Comprueba que responde: abre en el navegador `TU_URL?action=ping`.
   Debe mostrar algo como `{"ok":true,"service":"cochabamba-resiliente",...}`.
8. Conecta la app:
   - **Para probar en tu computadora**: en la app, **Alertas → Para administradores**,
     pega la URL y pulsa **Guardar**. Debe aparecer «✅ Servicio de alertas conectado».
   - **Para que funcione para todos**: pega la URL en `API` dentro de
     [../js/config.js](../js/config.js) y sube el cambio a GitHub.
9. Prueba completa: en **Alertas**, escribe tu correo y pulsa **Suscribirme**. Llega un
   correo de bienvenida (mira también en spam). Con **Enviar alerta de prueba** llega
   otro con el pronóstico real de tu granja.

## Cuándo llegan las alertas

- **Todos los días a las 6:00**: si para mañana se esperan **15 mm de lluvia o más**,
  o una **helada (2 °C o menos)** en los próximos 2 días.
- **Los lunes**, además: si la semana viene sin lluvia y calurosa (sequía o incendio),
  junto con un resumen de la semana.
- Si no hay nada que avisar, **no se envía correo** (para no llenar la bandeja).
- Cada persona recibe solo los tipos de aviso que eligió en la app.

Para probar sin esperar a las 6:00: en el editor elige `revisarAlertas` y pulsa
**Ejecutar** (solo enviará correos si hay algo que avisar). En el menú
**Ejecuciones** (a la izquierda) se ve cada revisión y sus errores.

## Chat con IA (opcional)

En **Configuración del proyecto → Propiedades del script** agrega:

| Propiedad | Valor |
|---|---|
| `OPENAI_API_KEY` | tu clave de OpenAI (obligatoria para el chat con IA) |
| `OPENAI_MODEL` | modelo a usar (opcional; por defecto `gpt-5.3-chat-latest`) |
| `CHAT_DAILY_LIMIT` | mensajes por día (opcional; por defecto 300) |

Sin la clave, el chat de la app sigue respondiendo con su guía básica, sin errores.

## Si algo no funciona

| Problema | Solución |
|---|---|
| La app dice «El servicio no responde» | La URL debe terminar en `/exec` (no `/dev`) y el acceso debe ser **Cualquier usuario**. |
| Cambiaste `Code.gs` y no se nota | **Implementar → Gestionar implementaciones →** lápiz → Versión: **Nueva versión** → Implementar. La URL no cambia. |
| No llegan los correos | Revisa spam. Mira errores en **Ejecuciones**. Una cuenta de Gmail normal puede enviar unos **100 correos por día** (Google Workspace: unos 1500). |
| Quieres dar de baja a alguien | En la hoja «Suscriptores», cambia su columna `activo` a `FALSE`. |
| El enlace de baja no aparece en los correos | Abre una vez `TU_URL?action=ping` (así el servicio guarda su dirección) o escríbela en la propiedad del script `WEBAPP_URL`. |

## Límites a tener en cuenta

- El número de WhatsApp solo se guarda en la hoja: la app **no envía** mensajes de
  WhatsApp, porque eso requiere un servicio de pago.
- Los avisos son orientativos. Para decisiones importantes, consultar a la alcaldía,
  a un técnico agrónomo o a INIAF.
