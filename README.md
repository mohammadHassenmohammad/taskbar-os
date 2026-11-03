# ⚡ TaskBar OS — Tactical Fitness & Routine Operating System

[![React](https://img.shields.io/badge/React-18%2B-blue?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5%2B-purple?logo=vite)](https://vitejs.dev/)
[![Zustand](https://img.shields.io/badge/State-Zustand%20%2B%20Immer-orange)](https://zustand.docs.pmnd.rs/)
[![Firebase](https://img.shields.io/badge/Cloud-Firebase%20Firestore-yellow?logo=firebase)](https://firebase.google.com/)
[![Electron](https://img.shields.io/badge/Desktop-Electron-47848F?logo=electron)](https://www.electronjs.org/)
[![Capacitor](https://img.shields.io/badge/Mobile-Capacitor%20Android-119EFF?logo=capacitor)](https://capacitorjs.com/)

> **TaskBar OS** (Neural OS) is a unified, local-first personal command center integrating **daily task execution**, **gym & strength training**, **caloric & macro nutrition management**, **biohacking (sleep/energy/steps)**, and **cognitive Pomodoro focus sessions** into a gamified dark-mode tactical interface.

---

## 🌟 Key Features

- 🎯 **Daily Task Execution**: Prioritized task queue (High, Medium, Low), scheduled routines, active timers, subtasks, and global instant search (`Ctrl+K`).
- 🏋️ **Fitness OS (Gym)**: Set-by-set workout logger, 38+ exercise library across 8 muscle groups, automatic circular rest timer, personal record (PR) detection, and volume calculation ($kg \times reps$).
- 🥗 **Diet OS (Nutrition)**: Mifflin-St Jeor BMR/TDEE calculations, raw-vs-cooked food composition math, 1,000+ Indian & global foods, custom recipe builder, and structured hydration schedule.
- ⚡ **Gamified Progression Engine**: Mathematical quadratic level curve ($250 \times (L^2 - L)$), 7 rank tiers (Recruit to Transcendent), and idempotent anti-farming XP transaction ledger.
- ⏱️ **Focus Mode (Pomodoro)**: Distraction-free ambient timer using timestamp-delta calculation safe against background browser tab throttling.
- 🧠 **BioHacker & AI Insights**: Sleep quality tracker, intraday energy pulse logging (1–10), walking/step calorie deduction, and real-data cross-module correlation analytics.
- ☁️ **Local-First & Cloud Sync**: Zero-latency UI backed by `localStorage` with seamless debounced sync to Firebase Firestore and full offline functionality.
- 📱 **Cross-Platform**: Web PWA, Desktop app via Electron, and native Android app via Capacitor with native notifications.

---

## 📂 Architecture & Documentation

For the complete technical specification, state models, mathematical formulas, and master workflows, refer to:
👉 **[TASKBAR_OS_SPEC_AND_WORKFLOW.md](./TASKBAR_OS_SPEC_AND_WORKFLOW.md)**

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

### Installation
```bash
# Clone the repository
git clone https://github.com/mohammadHassenmohammad/taskbar-os.git
cd taskbar-os

# Install dependencies
npm install
```

### Running Locally
```bash
# Start Vite development server
npm run dev

# Run desktop Electron application in development
npm run electron:dev
```

### Building for Production
```bash
# Build web production bundle
npm run build

# Package Electron desktop app
npm run electron:build
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Framer Motion, Lucide Icons, Recharts, React Hot Toast, React Confetti, date-fns
- **State Management**: Zustand with Immer & Persist middleware
- **Backend / Auth**: Firebase Authentication & Cloud Firestore
- **Desktop Shell**: Electron 28+
- **Mobile Runtime**: Capacitor Android 6+
- **Styling**: Cyber tactical dark theme using pure CSS custom properties

---

## 📄 License
Private / Proprietary.
