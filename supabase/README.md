# Supabase SQL para CRM

Este proyecto usa las tablas existentes:
- whatsapp_instances
- whatsapp_contacts
- whatsapp_conversations
- whatsapp_messages
- whatsapp_events
- whatsapp_message_attachments
- whatsapp_inbox

## Opcional: permisos de lectura para panel interno

Si vas a usar Realtime directo desde el navegador, debes decidir cómo exponer lectura.

### Opción segura
- login de agentes con Supabase Auth
- políticas RLS por rol `authenticated`

### Opción interna rápida
- permisos de solo lectura para `authenticated` o `anon` según tu red interna

> No apliques esta opción si el panel va a ser público.
