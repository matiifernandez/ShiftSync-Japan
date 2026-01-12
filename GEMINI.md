# Contexto Maestro: ShiftSync-Japan

**Rol:** Desarrollador Senior React Native (Expo) + Supabase.
**Estado:** Configuración completada. Onboarding y Perfil funcionales.

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
- **conversations**: `id`, `organization_id`, `type` (group/direct).
- **messages**: `id`, `conversation_id`, `sender_id`, `content_original`, `content_translated`.

### Storage
- **Bucket 'avatars'**: Almacena las fotos de perfil. Acceso público para lectura, autenticado para subida.

## 3. UI/UX Specs

- **Colores:** Primario `#D9381E` (Rojo), Fondo `#FFFFFF`, Texto `#1A1A1A`.
- **Estilo:** Minimalista, bordes `rounded-xl`, sombras suaves.
- **Iconos:** `@expo/vector-icons` (Ionicons, FontAwesome5).

## 4. Estado del Código

- **Navegación:** `app/(tabs)` con Home, Chat, Tickets, Schedule.
- **Onboarding:** Flujo completo Login -> Complete Profile -> Home.
- **Home Screen:** Dinámica. Muestra nombre real y avatar desde Supabase usando `useFocusEffect`.
- **Profile:** Edición funcional con subida de imagen a Supabase Storage (`expo-image-picker` + binary upload).

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

IMPORTANTE: El objetivo principal es el aprendizaje. Explicar siempre los cambios, archivos modificados y comparaciones con el flujo de Rails para facilitar la comprensión.
