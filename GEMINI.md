# Contexto Maestro: ShiftSync-Japan

**Rol:** Desarrollador Senior React Native (Expo) + Supabase.
**Estado:** Core funcional (Chat, Agenda, Auth, Perfil, Gastos).

## 1. Descripción del Proyecto

App de gestión logística para equipos de viaje en Japón.
**Usuarios:** Staff y Admins.
**Core:** Chat (traducción auto), Itinerarios, Tickets, Gastos (Expenses) y Localización (i18n EN/JP).
**Arquitectura:** Multi-tenant (Organizaciones).

## 2. Estructura de Datos (Schema Actualizado)

El sistema se basa en **Organizaciones**. La regla de oro (RLS) es que un usuario solo ve datos de su `organization_id`.

### Tablas Principales

- **organizations**: `id`, `name`.
- **profiles**: `id`, `organization_id`, `role` (admin/staff), `full_name`, `avatar_url`, `phone`, `preferred_language`.
- **projects**: `id`, `organization_id`, `name`, `status` (planning/active/completed).
- **conversations**: `id`, `organization_id`, `type` (group/direct), `name`.
- **conversation_participants**: `conversation_id`, `user_id`.
- **messages**: `id`, `conversation_id`, `sender_id`, `content_original`, `content_translated`, `original_language`.
- **schedule_items**: `id`, `user_id`, `date`, `type` (work_shift/travel_day/off_day), `notes`.
- **expenses**: `id`, `organization_id`, `user_id`, `amount`, `category`, `description`, `receipt_url`, `status` (pending/approved/rejected).

### Storage
- **Bucket 'avatars'**: Almacena las fotos de perfil.
- **Bucket 'receipts'**: Almacena las fotos de tickets de gastos (Público para lectura).

### Funciones RPC
- `get_my_conversations`: Retorna lista de chats optimizada (nombres, avatares, último mensaje) evitando queries N+1.

## 3. UI/UX Specs

- **Colores:** Primario `#D9381E` (Rojo Brand), Fondo `#FFFFFF`, Texto `#1A1A1A`.
- **Acentos:** Uso del rojo en nombres de usuario (Home), iconos de búsqueda (Chat) y botones de acción (FAB).
- **Dinámico:** Saludo en Home cambia según hora (Ohayou/Konnichiwa/Konbanwa).
- **Estilo:** Minimalista, bordes `rounded-xl`, sombras suaves.
- **Iconos:** `@expo/vector-icons` (Ionicons, FontAwesome5).
- **Safe Area:** Uso de `useSafeAreaInsets` para compatibilidad con Isla Dinámica.

## 4. Estado del Código

- **Navegación:** `app/(tabs)` con Home, Chat, Tickets, Schedule. `app/chat/[id].tsx` para detalle.
- **Expenses:** `app/expenses/` incluye listado, creación con cámara y detalle/edición.
- **Auth:** Persistencia de sesión automática (`_layout.tsx`) usando `AsyncStorage`.
- **Schedule:** Calendario interactivo (`react-native-calendars`) conectado a Supabase Realtime.
- **Chat:**
  - Lista de conversaciones optimizada con RPC.
  - Chat en tiempo real con Supabase Realtime (`hooks/useChat.ts`).
  - Soporte preliminar para traducción (campos en DB).
- **i18n:** `lib/translations.ts` (diccionario) y `hooks/useTranslation.ts` (estado global ligero persistido en AsyncStorage).
- **Notifications:** `hooks/useNotifications.ts` y `hooks/useGlobalRealtime.ts` para alertas locales y globales (foreground).

## 5. Reglas de Desarrollo

1.  **Strict TypeScript:** Mantener las interfaces en `types/index.ts` actualizadas.
2.  **Expo Router:** Usar navegación basada en archivos. `router.push()`, `router.replace()`.
3.  **Tailwind:** Usar clases utilitarias de NativeWind v4.
4.  **React Native vs Rails:** Recordar que RN usa componentes atómicos (`<View>`, `<Text>`) y el estado se maneja en el cliente con Hooks (`useState`, `useEffect`).

## 6. Flujo de Usuarios (User Flow)

### Registro y Onboarding
1.  **Sign Up Inicial:** Email y Password (Supabase Auth).
2.  **Complete Profile:** Pantalla obligatoria post-registro.
    - **Nombre Completo:** Requerido.
    - **Idioma:** Preferencia (EN/JP).
    - **Organización:** Ingreso de ID (Hack actual: `00000000-0000-0000-0000-000000000000`).
    - **Avatar:** Subida de foto a Supabase Storage.
3.  **Home Dashboard:** Acceso a las herramientas principales (Chat, Travel, Schedule, Expenses). El avatar en el header permite volver a editar el perfil.
4.  **Expenses Management:** Carga de tickets con foto -> Aprobación por parte del Admin.

## 7. Troubleshooting & Known Issues (Mantenimiento)

### Errores de Dependencias (`react-native-reanimated` / `worklets`)
Si aparece el error `Cannot find module 'react-native-worklets/plugin'` o conflictos de versión:

1.  **Regla de Oro:** INSTALAR SIEMPRE con `npx expo install nombre-paquete`. Esto alinea las versiones con el SDK de Expo.
2.  **Limpieza Profunda:**
    ```bash
    rm -rf node_modules package-lock.json
    npm install --legacy-peer-deps
    npx expo install react-native-reanimated
    npx expo start -c
    ```
3.  **Babel Config:** Asegurar que `react-native-reanimated/plugin` esté presente y sea el **último** en la lista de plugins en `babel.config.js`.

### Errores de Navegación (Infinite Loader)
Si la lista de chats se queda cargando infinitamente al volver atrás:
- Revisar `hooks/useConversations.ts`: `fetchConversations` no debe activar `setLoading(true)` si es una actualización en segundo plano (foco). Usar flag `isBackground`.

## 8. Roadmap a Producción (App Store)

### 🔴 CRÍTICO: Notificaciones Push Reales
La implementación actual de notificaciones globales (`hooks/useGlobalRealtime.ts`) funciona mediante **Client-Side Listeners** (Supabase Realtime).
- **Limitación:** Solo funcionan cuando la app está **ABIERTA (Foreground)**. Si el usuario cierra la app o bloquea el teléfono, el WebSocket se desconecta y no llegan avisos.
- **Solución para Producción:** Migrar a **Server-Side Push Notifications**.
    1.  **Backend:** Crear Supabase Edge Functions (Triggers en DB) que detecten `INSERT` en `messages` o `schedule_items`.
    2.  **Servicio:** Esas funciones deben llamar a la **Expo Push API** usando los tokens guardados de los usuarios.
    3.  **Frontend:** El cliente solo se encarga de enviar/renovar el Push Token, no de escuchar eventos en vivo para notificar.

*Nota: Las notificaciones locales ("Remind me" en Travel) YA son production-ready, pues usan el scheduler nativo del OS.*

IMPORTANTE: El objetivo principal es el aprendizaje. Explicar siempre los cambios, archivos modificados y comparaciones con el flujo de Rails para facilitar la comprensión.
