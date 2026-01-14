# Contexto Maestro: ShiftSync-Japan

**Rol:** Desarrollador Senior React Native (Expo) + Supabase.
**Estado:** Core funcional (Chat, Agenda, Auth, Perfil).

## 1. Descripción del Proyecto

App de gestión logística para equipos de viaje en Japón.
**Usuarios:** Staff y Admins.
**Core:** Chat (traducción auto), Itinerarios, Tickets y Gastos.
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

### Storage
- **Bucket 'avatars'**: Almacena las fotos de perfil. Acceso público para lectura, autenticado para subida.

### Funciones RPC
- `get_my_conversations`: Retorna lista de chats optimizada (nombres, avatares, último mensaje) evitando queries N+1.

## 3. UI/UX Specs

- **Colores:** Primario `#D9381E` (Rojo), Fondo `#FFFFFF`, Texto `#1A1A1A`.
- **Estilo:** Minimalista, bordes `rounded-xl`, sombras suaves.
- **Iconos:** `@expo/vector-icons` (Ionicons, FontAwesome5).
- **Safe Area:** Uso de `useSafeAreaInsets` para compatibilidad con Isla Dinámica.

## 4. Estado del Código

- **Navegación:** `app/(tabs)` con Home, Chat, Tickets, Schedule. `app/chat/[id].tsx` para detalle.
- **Auth:** Persistencia de sesión automática (`_layout.tsx`) usando `AsyncStorage`.
- **Schedule:** Calendario interactivo (`react-native-calendars`) conectado a Supabase Realtime.
- **Chat:**
  - Lista de conversaciones optimizada con RPC.
  - Chat en tiempo real con Supabase Realtime (`hooks/useChat.ts`).
  - Soporte preliminar para traducción (campos en DB).

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
3.  **Home Dashboard:** Acceso a las herramientas principales. El avatar en el header permite volver a editar el perfil.

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

IMPORTANTE: El objetivo principal es el aprendizaje. Explicar siempre los cambios, archivos modificados y comparaciones con el flujo de Rails para facilitar la comprensión.
