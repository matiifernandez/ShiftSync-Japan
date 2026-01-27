# Contexto Maestro: ShiftSync-Japan

**Rol:** Desarrollador Senior React Native (Expo) + Supabase.
**Estado:** Producción-Ready (Chat Realtime, Traducción IA, Notificaciones, Offline-First Completo).

## 1. Resumen de la Sesión (Hitos Logrados)

- **Notificaciones Push (Backend):**
    - Se creó la Edge Function `push-notification` polimórfica.
    - Soporta: **Chat** (nuevos mensajes) y **Expenses** (cambios de estado: approved/rejected).
    - `projectId` de EAS vinculado en `app.json`.
- **Deep Linking:**
    - Navegación automática a `/chat/[id]` al tocar notificación.
- **Offline Mutations (TanStack Query):**
    - **Expenses Queue:** Se implementó `useOfflineQueue`. Si falla la subida de imagen, se guarda en `AsyncStorage` y se reintenta automáticamente al detectar red (`NetInfo`).
    - **Chat:** Mutaciones optimistas integradas con Realtime.
- **Optimistic UI:**
    - Indicadores visuales (opacidad, iconos de reloj/nube) para items pendientes de sincronización.

## 2. Estado de la Arquitectura

### Backend (Supabase)
- **Edge Functions:** 
    - `translate-message`: Traducción con Groq.
    - `push-notification`: Notificaciones Push inteligentes (Chat + Expenses).
- **Triggers:**
    - `messages (INSERT)` -> Webhook -> `push-notification`.
    - **FALTA:** Configurar Trigger `expenses (UPDATE)` -> Webhook -> `push-notification`.

### Frontend (React Native)
- **Gestión de Estado:** TanStack Query v5 + `AsyncStorage` Queue.
- **Navegación:** Expo Router.
- **Red:** `@react-native-community/netinfo` para auto-sync.

## 3. Pendientes Inmediatos (Próxima Sesión)

### 🟡 Prioridad 1: Configurar Webhook de Expenses
- En Supabase Dashboard, añadir nuevo Webhook:
    - Table: `expenses`
    - Event: `UPDATE`
    - Function: `push-notification`
- **Importante:** La función ya espera este evento, solo falta conectarlo.

### 🟢 Prioridad 2: Validar en Físico
- Probar flujo completo de Chat y Gastos con notificaciones reales (cuando la red lo permita).

### 🟢 Prioridad 3: Despliegue de la Función Actualizada
- Ejecutar `supabase functions deploy push-notification` para subir la nueva lógica que soporta gastos.

## 4. Lecciones Aprendidas (Knowledge Base)

1.  **Offline Queues:** Para archivos binarios (imágenes), es mejor una cola manual en AsyncStorage que confiar en el retry de React Query, ya que necesitamos persistencia entre reinicios de app.
2.  **Edge Functions:** Una sola función puede manejar múltiples triggers si inspeccionamos el payload (`record`).
3.  **EAS Project ID:** Es obligatorio para Push Notifications en Expo, incluso en desarrollo.