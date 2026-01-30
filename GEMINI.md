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

## 4. Lecciones Aprendidas (Knowledge Base)

1.  **Compatibilidad de SDK:** En Expo 54, `reanimated` 4.2+ puede causar inestabilidad; mantenerse en la versión recomendada por `npx expo install`.
2.  **Dependencias Reanimated 4:** `react-native-reanimated` v4.x requiere instalar explícitamente `react-native-worklets` para que funcione el plugin de Babel.
3.  **UX en Listas:** Las suscripciones Realtime de Supabase son geniales, pero para una sensación de "velocidad instantánea", usar `queryClient.invalidateQueries` inmediatamente después de un INSERT/UPDATE.
3.  **Privacidad iOS:** Apple rechaza apps que usen la cámara sin una descripción clara en el `infoPlist`. Siempre configurar estos strings antes de generar la primera build de test.