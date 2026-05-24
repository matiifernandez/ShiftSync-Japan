# ShiftSync Japan 🇯🇵

A comprehensive logistics and team management application designed for travel teams in Japan. Built with **React Native (Expo)** and **Supabase**.

## 🚀 Features

### 1. Travel Logistics (Multi-Project)
- **Admin:** Create trips, assign staff members, upload transport tickets (Shinkansen/Flight), and manage accommodations.
- **Staff:** View personalized itineraries based on assignments.
- **Visuals:** "View Ticket" button for quick access to QR codes/PDFs.
- **Architecture:** Supports multiple simultaneous trips via Project Selector.

### 2. Expense Management
- **Capture:** Staff can upload receipts via camera/gallery.
- **Dashboard:** Admin view with "Pending" (Inbox) and "History" (Month-grouped) tabs.
- **Workflow:** Approval/Rejection flow for managers.

### 3. Real-time Communication
- **Chat:** Group and Direct messaging with auto-translation support (EN/JP).
- **Status:** Unread counters and read receipts.

### 4. Localization
- Full English/Japanese support.

## 🛠 Tech Stack

- **Framework:** React Native (Expo Router)
- **Styling:** NativeWind (TailwindCSS)
- **Backend:** Supabase (Auth, DB, Storage, Realtime)
- **State/Hooks:** Custom Modular Hooks (`useTravel`, `useExpenses`, etc.)

## 📦 Setup & Installation

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Supabase Setup:**
    - Create a Supabase project.
    - Run the SQL migrations found in the `supabase/migrations` folder.
    - **Crucial Tables:**
        - `project_members`: For assigning staff to trips.
        - `profiles`: Needs `expo_push_token` column for notifications.
    - **Crucial RPC:**
        - `public.get_my_conversations()`: Required by chat list loading (`supabase/migrations/20260417_get_my_conversations_rpc.sql`).

3.  **Environment Variables:**
    - Create `.env` file with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

4.  **Run:**
    ```bash
    npx expo start
    ```

## 🧰 Chat Troubleshooting

- If chat list is empty and you see a warning about `get_my_conversations`:
  - Confirm migration `20260417_get_my_conversations_rpc.sql` was applied to the active Supabase project.
  - Confirm the app points to the same project in `.env` (`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`).

## 📱 Notifications

The app is "Push Ready". It automatically registers the user's `ExpoPushToken` to the `profiles` table upon login.
*To enable real notifications:* You need to configure Supabase Edge Functions to trigger Expo Push API using these tokens.

## 🗺 Roadmap

- [x] Multi-project Travel Logic
- [x] Expenses Approval Dashboard
- [x] Push Token Registration
- [ ] Server-side Push Triggers (Edge Functions)
- [ ] Offline Mode (TanStack Query)
