# Contexto del Proyecto: CRM de WhatsApp (Evolution Go + Supabase)

## Arquitectura Base
- **Frontend**: Next.js (App Router), TailwindCSS, TypeScript. Ubicado en `whatsapp-crm-web`.
- **Backend/Webhooks**: Aplicación Go (`webhook-go`) que procesa los webhooks enviados por Evolution API.
- **Base de Datos**: Supabase (PostgreSQL).

## Reglas y Aprendizajes (Historial de Desarrollo)
1. **Multimedia (Imágenes, Audios y Videos)**:
   - Evolution API envía archivos multimedia codificados en `base64` dentro de la clave `message` del webhook, los cuales se almacenan dentro de la columna JSONB `raw_payload`.
   - El frontend (`crm-dashboard.tsx`) decodifica y renderiza estas imágenes/audios al vuelo sin usar buckets externos.
   - **Gestión de espacio:** Para evitar llenar la base de datos, existe un Cron Job nativo en Supabase llamado `clean_old_payloads` que se ejecuta diariamente para poner en `NULL` el campo `raw_payload` en mensajes con más de 7 días de antigüedad.

2. **Etiquetas (Labels)**: 
   - Las etiquetas se asocian en el CRM a través del webhook `LabelAssociationChat`.
   - Se visualizan haciendo join en la vista `whatsapp_inbox` con la tabla `whatsapp_chat_labels`.
   - **Limitación importante:** Evolution API NO emite webhooks de forma retroactiva. Si una etiqueta fue asignada en el teléfono antes de instalar el CRM, no existirá en la base de datos hasta que el usuario se la quite y se la vuelva a poner manualmente en WhatsApp (para disparar el evento).
   - No hay endpoint público documentado y habilitado para destruir etiquetas globalmente vía Evolution Go (el usuario debe borrarlas de su catálogo desde la App de WhatsApp Business).

3. **Bandeja de Entrada y Búsqueda (CRM Dashboard)**:
   - El CRM carga un límite de 100 conversaciones recientes de inicio para mantener buen rendimiento.
   - La búsqueda (`term`) realiza un filtro directamente en Supabase con `.or('title.ilike..., push_name.ilike...')` para encontrar clientes antiguos.
   - **Estado Reactivo (React State):** Para evitar que la pantalla central se quede en blanco, el estado `data.conversations` realiza un "merge" cuando se carga o busca un chat antiguo (en lugar de sobrescribirse). 
   - **Prioridad de Nombres (Left Sidebar):** El nombre del cliente en el CRM se renderiza siguiendo esta prioridad estricta: `title` -> `push_name` (Nombre público de WS) -> `display_name` -> `phone_number` -> `chat_jid`.
   - **Historial infinito:** Hay un botón de "Cargar mensajes anteriores" que inyecta bloques de 30 mensajes mediante cursor offset con la base de datos sin romper la posición del scroll.
