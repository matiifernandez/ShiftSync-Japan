# Contexto Maestro: ShiftSync-Japan

**Rol:** Desarrollador Senior React Native (Expo) + Supabase.
**Estado:** MVP Polished & Store-Ready (Audit Session Completed).

## 1. Resumen de la Sesión (Hitos Logrados - 29 Ene 2026)

- **Auditoría de Estabilidad:**
    - Downgrade de `react-native-reanimated` a `~4.1.1` para compatibilidad total con Expo 54, eliminando warnings de bundler.
- **Responsividad para iPad:**
    - Refactorización del Dashboard (`app/(tabs)/index.tsx`) con grid responsivo (`md:w-[23%]`).
    - Verificación de `supportsTablet: true` en `app.json`.
- **Configuración de Producción (Store Compliance):**
    - Definición de `bundleIdentifier` (iOS) y `package` (Android): `com.matiifernandez.shiftsyncjapan`.
    - Agregadas descripciones de privacidad (`NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`) requeridas por Apple.
- **Mejoras en Schedule (Admin):**
    - **Validación:** Se bloqueó la creación de shifts en fechas pasadas.
    - **Gestión Avanzada:** Implementación de `Long Press` en la lista de turnos para Editar/Eliminar (exclusivo Admin).
    - **Nueva Pantalla:** `app/schedule/[id].tsx` para edición detallada de turnos.
    - **UX:** Invalidation de caché con TanStack Query para refresco instantáneo tras crear/editar.

## 1.1 Resumen de la Sesión (Hitos Logrados - 01 Feb 2026)

- **Refactorización & Code Quality (Issues #2, #4, #5):**
    - **Separación de Responsabilidades:** Extracción de lógica de negocio a custom hooks (`useSchedule`, `useUserRole`) para aligerar componentes UI.
    - **Validaciones:** Implementación de validaciones robustas en formularios clave (`CompleteProfile`, `ExpenseDetail`).
    - **Legibilidad:** Estandarización de estructura de componentes y adición de JSDoc.
    - **TanStack Query Mutations:** Migración de operaciones de escritura (delete) a mutaciones para mejor gestión de estado y caché.

- **UX/UI & Accesibilidad (Issue #3):**
    - **Feedback System:** Creación de un contexto global de notificaciones (`ToastContext`) para mensajes de éxito/error no intrusivos, reemplazando `Alert` nativos.
    - **Accesibilidad:** Adición de etiquetas (`accessibilityLabel`, `accessibilityRole`) en pantallas críticas (Login, Chat) para soporte de lectores de pantalla.
    - **Internationalization (i18n):** Implementación de detección de idioma del sistema mediante `expo-localization` como fallback inicial, asegurando que usuarios que no han configurado su perfil vean la app en su idioma preferido (inglés/japonés) desde el primer contacto.

## 1.2 Resumen de la Sesión (Hitos Logrados - 15 Feb 2026)

- **Corrección de Regresiones en Traducciones:**
    - **Cobertura Total:** Se eliminaron strings hardcoded en Login, Signup, Dashboard, Travel, Expenses y Onboarding.
    - **i18n Dinámico:** Implementación de traducción para estados de gastos (Pending, Approved, Rejected) y descripciones de la "Próxima Actividad" en el Dashboard.
    - **Localización de Fechas:** Integración de locales de `date-fns` (enUS/ja) para formateo de fechas consistente con el idioma del usuario.
    - **Shadowing Fix:** Resolución de un conflicto de nombres de variables en el Dashboard detectado vía Code Review (GitHub PR #6).
- **Workflow & DevOps:**
    - **GitHub Flow:** Adopción de ramas (`fix-translations`) y Pull Requests para revisión de cambios, utilizando `gh` CLI para la integración con GitHub.

## 2. Estado de la Arquitectura

### Backend (Supabase)
- **Tablas:** `schedule_items` vinculada con `profiles` para vista de administrador.
- **Realtime:** Suscripciones activas en Chat y Schedule para sincronización mutua.

### Frontend (React Native)
- **Navegación:** Expo Router con rutas dinámicas para edición (`/schedule/[id]`).
- **UI:** Tailwind (NativeWind) configurado con breakpoints para tablets.

## 3. Pendientes Inmediatos (Post-Demo)

### 🟡 Prioridad 1: Traducción de Chat con IA (Groq)
- Verificar el trigger en Supabase para asegurar que la Edge Function `translate-message` se dispare correctamente en cada mensaje nuevo.

### 🟢 Prioridad 2: Testing Offline Exhaustivo
- Probar el flujo de `useOfflineQueue` en áreas de baja señal durante la carga de recibos de gastos.

## 5. Roadmap: Transformación a SaaS (Público)

**Objetivo:** Convertir ShiftSync-Japan de una herramienta interna a un producto SaaS multi-tenant escalable para cualquier empresa de "blue collar" en Japón.

### Fase 1: Auth & Onboarding (La Puerta de Entrada)
*Estado Actual:* `organization_id` existe en BD pero no hay flujo de registro UI.
1.  **Pantalla de Registro (`app/signup.tsx`):**
    *   Clonar estilo de Login.
    *   Inputs: Email, Password, Confirm Password.
    *   Action: `supabase.auth.signUp()`.
2.  **Pantalla de Bienvenida/Selector (`app/onboarding/index.tsx`):**
    *   Lógica en `_layout.tsx`: Si `!session` -> Login. Si `session` pero `!profile.organization_id` -> Onboarding.
    *   **Opción A (Admin):** "Create New Workspace".
        *   Input: Company Name.
        *   Logic: Insert en `organizations`, Update `profiles` (role: 'admin', org_id: new_id).
    *   **Opción B (Worker):** "Join Existing Team".
        *   Input: Invite Code (6 chars).
        *   Logic: Validar código, Update `profiles` (role: 'staff', org_id: found_id).

### Fase 2: Gestión de Invitaciones
1.  **Generación de Códigos:**
    *   Añadir columna `invite_code` (unique) a tabla `organizations`.
    *   Generar al crear la organización (random 6-char alphanumeric).
2.  **UI de Admin:**
    *   Pantalla "Team Management".
    *   Botón "Invite Staff": Muestra el código en grande y botón "Share Invite Link" (Deep link `shiftsync://join?code=XYZ`).

### Fase 3: Seguridad Multi-Tenant (RLS)
*Crucial para evitar fugas de datos entre empresas.*
1.  **Auditoría de Políticas:**
    *   Revisar cada tabla (`schedule_items`, `expenses`, `messages`).
    *   Asegurar que **todas** tengan política `USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()))`.
2.  **Edge Functions:**
    *   Verificar que `translate-message` y futuras funciones respeten el tenant del usuario que las invoca.

### Fase 4: Observabilidad y Mantenimiento
1.  **Sentry (Error Tracking):**
    *   Instalar `@sentry/react-native`.
    *   Configurar DSN en `.env`.
    *   Capturar errores globales y de React Query.
2.  **Feature Flags (Opcional):**
    *   Para habilitar/deshabilitar features nuevas sin redeploy (útil para betas públicas).

## 6. Estrategia de Monetización (Freemium B2B)

**Filosofía:** "Land and Expand". El usuario final (trabajador) nunca paga. La empresa paga por gestión y escala.

### Estructura de Planes
1.  **Plan Starter (Gratuito):**
    *   **Límite de Usuarios:** Hasta 10 empleados por organización.
    *   **Historial:** Acceso a últimos 60 días de turnos/chats (suficiente para nómina mensual).
    *   **Funcionalidad:** Chat Traducido, Calendario Básico, Gastos Simples.
2.  **Plan Pro (Suscripción):**
    *   **Usuarios:** Ilimitados.
    *   **Historial:** Ilimitado (Auditoría y Compliance).
    *   **Features Avanzadas:** Exportación CSV/Excel, Roles de Supervisor, Reportes de Gastos Avanzados.

### Implementación Técnica (Fase Inicial "Lean")
No integrar pasarela de pagos (Stripe) hasta validar tracción.
1.  **Database Flags (Tabla `organizations`):**
    *   `plan_type`: 'free' (default) | 'pro' | 'enterprise'.
    *   `max_seats`: 10 (default) | NULL (unlimited).
2.  **Gatekeeping (Lógica de Negocio):**
    *   **Trigger en BD:** Al insertar en `profiles` o `organization_members`, contar usuarios activos. Si `count >= max_seats` y `plan_type == 'free'`, bloquear inserción.
    *   **UI:** Mostrar mensaje "Has alcanzado el límite de 10 usuarios. Contacta a soporte para ampliar."
3.  **Upgrade Manual:**
    *   Si una empresa quiere pagar, se gestiona off-platform inicialmente. El Admin cambia el flag `plan_type` manualmente en Supabase.

## 7. Lecciones Aprendidas (Knowledge Base)

1.  **Compatibilidad de SDK:** En Expo 54, `reanimated` 4.2+ puede causar inestabilidad; mantenerse en la versión recomendada por `npx expo install`.
2.  **Dependencias Reanimated 4:** `react-native-reanimated` v4.x requiere instalar explícitamente `react-native-worklets` para que funcione el plugin de Babel.
3.  **UX en Listas:** Las suscripciones Realtime de Supabase son geniales, pero para una sensación de "velocidad instantánea", usar `queryClient.invalidateQueries` inmediatamente después de un INSERT/UPDATE.
4.  **Privacidad iOS:** Apple rechaza apps que usen la cámara sin una descripción clara en el `infoPlist`. Siempre configurar estos strings antes de generar la primera build de test.
5.  **Feedback Visual:** El uso de `Toast` personalizados en lugar de `Alert.alert` mejora significativamente la percepción de calidad y "native feel" de la app, además de no bloquear la interacción.
6.  **Separación de Lógica:** Centralizar la lógica de Supabase y roles en hooks (`useUserRole`) facilita enormemente el testing y la mantenibilidad frente a tener consultas dispersas en la UI.