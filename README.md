# WhatsApp CRM Web

Panel web realtime para conversaciones de WhatsApp conectado a Supabase.

## Stack
- Next.js 16
- React 19
- Tailwind CSS 4
- Supabase JS
- Docker listo para Easypanel

## Variables de entorno

### Frontend / browser
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (opcional; útil para el fetch inicial en local y producción)

### Servidor / bootstrap
- `SUPABASE_URL` (opcional si no usas `NEXT_PUBLIC_SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY` (recomendado para cargar el inbox inicial sin exponer secretos)

## Desarrollo local

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Producción con Easypanel

1. Crea un nuevo servicio **Docker**.
2. Apunta al directorio del proyecto o sube el repo.
3. Easypanel debe usar el `Dockerfile` del proyecto.
4. Configura las variables de entorno.
5. Expón el puerto `3000`.

## Supabase Realtime

El panel ya viene preparado para escuchar cambios en:
- `whatsapp_messages`
- `whatsapp_conversations`

Para que el navegador reciba eventos, debes permitir lectura desde Supabase según tu estrategia de auth/RLS.

Si lo quieres abierto para un entorno interno, puedes aplicar un SQL de solo lectura. Si lo quieres cerrado por seguridad, usa auth de Supabase y políticas por rol.

## Siguiente paso recomendado

Conectar este frontend con:
- login de agentes
- filtros por instancia
- envío de mensajes salientes
- asignación y etiquetas
- conteos de no leídos en vivo
