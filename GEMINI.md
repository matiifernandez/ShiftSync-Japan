# Contexto Maestro: ShiftSync-Japan

**Rol:** Desarrollador Senior React Native (Expo) + Supabase.
**Estado:** Arquitectura Offline-First estable y dinámica.

## 1. Resumen de la Sesión Actual (Hitos Logrados)

- **Modo Offline Real:** Se implementó **TanStack Query (v5)** con persistencia vía **AsyncStorage**. Toda la data de Travel, Expenses y Schedule se cachea localmente.
- **Home Dashboard Dinámico:** La tarjeta "Next Activity" ahora es 100% funcional, consumiendo datos del `TravelContext`.
- **Estabilidad de Dependencias:** Se resolvieron conflictos críticos de Babel y `react-native-reanimated`. Se decidió desinstalar temporalmente Reanimated para asegurar la compilación en dispositivos físicos hasta que se normalice la compatibilidad con React 19.
- **Fixes de Producción:** Se manejó el error de `projectId` ausente en Expo Go (físico) y se corrigieron las `queryKey` para cumplir con el estándar de arrays.

## 2. Estado de la Arquitectura & Deuda Técnica

### Gestión de Datos (React Query)
- `TravelContext.tsx`: Proveedor global que centraliza proyectos, tickets y hoteles.
- `hooks/useExpenses.ts`: Migrado a `useQuery` y `useMutation`.
- `hooks/useSchedule.ts`: Migrado a `useQuery` con invalidación por Realtime.

### Estabilidad & Navegación
- Se eliminaron todos los `useFocusEffect` de la carga inicial de datos para evitar errores de "Navigation Context".
- La carga de datos ahora depende del montaje del componente o del estado global del Contexto.

## 3. Pendientes Inmediatos (Próxima Sesión)

### 🔴 Prioridad 1: Test Offline Exhaustivo
- Verificar la persistencia de datos apagando el WiFi/Datos en el dispositivo físico.
- Asegurar que el `staleTime` y `gcTime` sean óptimos para el uso diario.

### 🟡 Prioridad 2: Traducción de Chat con IA (Groq)
- **Objetivo:** Traducción automática EN <-> JP en tiempo real.
- **Stack:** Supabase Edge Functions (Deno) + **Groq API** (Llama 3 / Mixtral) para inferencia rápida y gratuita.
- **Flujo:** Trigger en DB (Insert Message) -> Edge Function -> Groq -> Update Message con traducción.

### 🟢 Prioridad 3: Re-intentar Animaciones (Opcional)
- Una vez la base sea inamovible, intentar reinstalar Reanimated con una versión que no rompa el plugin de Babel.

## 4. Reglas de Mantenimiento (Actualizadas)
1. **Query Keys:** Siempre usar arrays: `['key', { param }]`.
2. **Offline-First:** Siempre usar `useQuery` para fetching de datos de Supabase.
3. **Safe Device Development:** No asumir que el `projectId` de EAS está presente en entornos locales de Expo Go.
