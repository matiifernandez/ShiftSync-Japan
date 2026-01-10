# Contexto Maestro: ShiftSync-Japan

**Rol:** Desarrollador Senior React Native (Expo) + Supabase.
**Estado:** Configuración completada. Dependencias alineadas (React 19, Expo 54).

## 1. Descripción del Proyecto

App de gestión logística para equipos de viaje en Japón.
**Usuarios:** Staff y Admins.
**Core:** Chat (traducción auto), Itinerarios, Tickets y Gastos.
**Arquitectura:** Multi-tenant (Organizaciones).

## 2. Estructura de Datos (Schema Actualizado)

El sistema se basa en **Organizaciones**. La regla de oro (RLS) es que un usuario solo ve datos de su `organization_id`.

### Tablas Principales

- **organizations**: `id`, `name`.
- **profiles**: `id`, `organization_id`, `role` (admin/staff), `full_name`, `avatar_url`, `phone`.
- **projects**: `id`, `organization_id`, `name`, `status` (planning/active/completed).
- **project_members**: Relación Project <-> Profile.
- **conversations**: `id`, `organization_id`, `type` (group/direct), `project_id`.
- **messages**: `id`, `conversation_id`, `sender_id`, `content_original`, `content_translated`.
- **schedule_items**: `id`, `project_id`, `user_id`, `date`, `type`, `start_time`, `end_time`.
- **logistics_tickets**: `id`, `project_id`, `transport_name`, `departure_time`, `ticket_file_url`.
- **expenses**: `id`, `project_id`, `amount`, `status`.

## 3. UI/UX Specs

- **Colores:** Primario `#D9381E` (Rojo), Fondo `#FFFFFF`, Texto `#1A1A1A`.
- **Estilo:** Minimalista, bordes `rounded-xl`, sombras suaves.
- **Iconos:** `@expo/vector-icons` (Ionicons, FontAwesome).

## 4. Estado del Código

- **Navegación:** `app/(tabs)` implementado con Home, Chat, Tickets, Schedule.
- **Auth:** Supabase Auth implementado en `app/index.tsx`.
- **Styling:** NativeWind v4 (`className`).

## 5. Reglas de Desarrollo

1.  **Strict TypeScript:** Mantener las interfaces en `types/index.ts` actualizadas.
2.  **Expo Router:** Usar navegación basada en archivos. `router.push()`, `router.replace()`.
3.  **Tailwind:** Usar clases utilitarias para todo el estilo.
4.  **Componentes:** Extraer UI reutilizable a `components/`.

## 6. Flujo de Usuarios (User Flow)

### Registro y Onboarding

1.  **Sign Up Inicial:** Email y Password (Supabase Auth).
2.  **Complete Profile:** Pantalla obligatoria post-registro.
    - **Nombre Completo:** Requerido.
    - **Idioma:** Preferencia (EN/JP).
    - **Organización:** Ingreso de ID o Código.
    - **Avatar:** Subida de foto.
      - _Requerimiento Futuro:_ Validación de rostro mediante IA/Librería para asegurar que la foto sea válida.

IMPORTANTE: no olvidar que el objetivo principal del usuario es aprender mientras se desarrolla esta app por lo tanto es escencial aclarar que files se modifican, por que, diferencias o similitudes con Rails, sintaxis especifica de react native y typescript.
