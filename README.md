# ShiftSync Japan 🗻

Logistics management and coordination app for travel teams in Japan. Simplifies the lives of staff and managers by unifying chat, itineraries, tickets, and expenses.

## 🚀 Tech Stack

- **Framework:** React Native (Expo SDK 54)
- **Navigation:** Expo Router (File-based routing)
- **Styling:** NativeWind v4 (Tailwind CSS for RN)
- **Backend/DB:** Supabase (Auth & Postgres)
- **Language:** TypeScript

## ✨ Key Features

- **Multi-Tenancy:** Support for multiple organizations.
- **Smart Chat:** Automatic message translation.
- **Itinerary Management:** Schedule for shifts, travel, and days off.
- **Logistics:** Storage and visualization of train/flight tickets.
- **Expenses:** Per diem tracking and approval.

## 🛠️ Project Setup

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Configure Environment Variables:**
    Create a `.env` file in the root directory with:
    ```
    EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
    EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

3.  **Run the App:**
    ```bash
    # Clearing cache (recommended)
    TMPDIR=/tmp npx expo start -c
    ```

## 📂 Directory Structure

- `/app`: Screens and navigation (Expo Router).
- `/components`: Reusable UI components.
- `/lib`: Service configuration (Supabase, etc.).
- `/types`: TypeScript definitions.
- `/assets`: Images and fonts.

## 🎨 Style Guide

- **Primary:** `#D9381E` (Japan Red)
- **Background:** `#FFFFFF` (White)
- **Text:** `#1A1A1A` (Dark Gray)
- **Style:** Minimalist, rounded-xl, soft shadows.