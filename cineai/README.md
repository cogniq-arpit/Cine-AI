# 🍿 CINE AI — Premium AI-Powered Cinematic Experience

[![React Native](https://img.shields.io/badge/React_Native-0.81-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0-black.svg)](https://expo.dev/)
[![Reanimated](https://img.shields.io/badge/Reanimated-v4-38B2AC.svg)](https://docs.swmansion.com/react-native-reanimated/)
[![Zustand](https://img.shields.io/badge/Zustand-State-orange.svg)](https://docs.pmnd.rs/zustand/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E.svg)](https://supabase.com/)
[![TMDB API](https://img.shields.io/badge/TMDB_API-Movies-01B4E4.svg)](https://developer.themoviedb.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-Enabled-4285F4.svg)](https://deepmind.google/technologies/gemini/)

> **"Cinema Intelligence, Reimagined"** — A state-of-the-art, fully responsive mobile platform featuring real-time AI assistance, immersive cinematic design, a robust cloud-synced backend, and a premium seamless browsing experience.

---

## ✨ Key Features

### 🤖 Intelligent AI Ecosystem
- **AI Chatbot**: A dedicated conversational interface powered by **Google Gemini API** for personalized movie recommendations and mood-based discovery.
- **Intent Recognition**: Context-aware conversations that understand complex cinematic queries (e.g., *"I want something like Inception but darker"*).
- **Dual-Mode Resiliency Fallback**: Employs a robust connection router. It attempts to fetch live data from the TMDB API first, and if the API is restricted or blocked by the network, **instantly transitions to a high-fidelity local premium mock data engine** to ensure a flawless presentation experience.

### 🎬 Premium Cinematic UI/UX
- **Glassmorphic Interfaces**: Beautifully blurred overlays using `expo-blur` and deep dark mode aesthetics inspired by leading streaming platforms.
- **Smooth Micro-Animations**: Advanced 60fps animations, parallax scrolling, and dynamic scaling built purely on **React Native Reanimated v4**.
- **Immersive Carousel**: Auto-playing hero carousel showcasing trending titles with high-resolution backdrops and gradient overlays.

### 👤 Cloud-Synced User Platform
- **Authentication**: Secure Supabase integration supporting Sign Up, Log In, and a frictionless **Guest Mode**.
- **Personalized Watchlists**: Save movies to your local or cloud-synced list for later viewing.
- **Dynamic Content Hub**: Live integration with TMDB pulling real-time Top Rated, Trending, Now Playing, and Upcoming movie categories.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | React Native 0.81, Expo SDK 54 |
| **Animations** | React Native Reanimated v4, Gesture Handler |
| **State Management** | Zustand |
| **Movie Data Engine** | The Movie Database (TMDB) API |
| **AI Engine** | Google Gemini SDK |
| **Backend/DB** | Supabase (PostgreSQL + Auth) |
| **Navigation** | React Navigation v7 (Native Stack & Bottom Tabs) |
| **Typography** | Google Fonts (Inter, Poppins) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20 or higher)
- Expo Go app on your iOS/Android device
- TMDB API Key
- Supabase Project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cineai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_TMDB_API_KEY=your_tmdb_api_key
   EXPO_PUBLIC_TMDB_BASE_URL=https://api.themoviedb.org/3
   EXPO_PUBLIC_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Launch the Local Development Server**
   ```bash
   npx expo start -c
   ```
   → Open your camera or Expo Go app to scan the generated QR code.

---

## 📁 Project Architecture

```text
src/
├── components/          # Reusable UI components
│   ├── movie/           # MovieCard, MovieRow elements
│   └── ui/              # Atomized elements (Button, Input)
├── constants/           # Global theme tokens (Colors, Typography, Spacing)
├── navigation/          # React Navigation stacks (AppNavigator, AuthNavigator)
├── screens/             # Main application views
│   ├── auth/            # Login, SignUp, Welcome, Onboarding
│   └── main/            # Home, Search, AIChat, Watchlist, Profile
├── services/            # API & SDK integrations (Supabase, TMDB API)
├── store/               # Zustand state logic (Auth, Watchlist)
└── types/               # TypeScript interfaces for Movie, User, etc.
```

---

## 📝 Database Schema (Supabase)

The application interacts with the following core tables:
- `user_profiles`: Extended user metadata (Name, Favorite Genres, Taste Profile).
- `watchlists` (Planned): Stores customer saved movies and shows.
- *All authentication is securely managed via Supabase `auth.users`.*

---

## 🏗️ Roadmap

- [x] Premium Cinematic UI/UX implementation
- [x] Supabase Auth & Guest Mode
- [x] TMDB Live Data Integration & Mock Data Fallback
- [x] Reanimated v4 Micro-animations
- [x] Gemini AI Chatbot Integration
- [x] Ionicons Icon System (replaced all emoji icons)
- [x] Voice UI — Mic button, waveform animation, TTS playback
- [x] Premium AI Chat — Cinematic orb, streaming UX, quick prompts
- [x] Cinematic Tab Bar with animated icons
- [ ] Offline Watchlist Storage
- [ ] Voice Transcription (native speech-to-text)
- [ ] Advanced AI-driven Taste Profiling

---

*Built with 🍿, ❤️, and 🤖 by the Cine AI Team*
