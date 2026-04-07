# Interactive Seasonal Wall Calendar

A beautiful, premium, and highly interactive software wall calendar built natively on the web. It uses a custom HTML5 particle engine to deliver immersive seasonal environments that react to the month being viewed.

![Project Status](https://img.shields.io/badge/Status-Completed-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-16+-black?logo=next.js)
![React](https://img.shields.io/badge/React-18+-blue?logo=react)

## ✨ Key Features

- **Live Seasonal Atmosphere:** A custom physics-based HTML5 canvas engine tracks the current month and renders natural backing animations. 
  - ❄️ **Winter:** Falling multi-armed snowflakes, icy horizons, and rhythmic aurora borealis.
  - 🌸 **Spring:** Drifting cherry blossom petals, mist, and shooting stars.
  - ☀️ **Summer:** Floating bioluminescent fireflies and reflective moonlit waters.
  - 🍂 **Autumn:** Slowly spinning autumn leaves against a glowing harvest moon and deep ember sky.
- **Dynamic Seasonal Phrases:** Positivity-focused seasonal quotes that intelligently rotate weekly and adapt completely to the active season.
- **Localized Indian Holidays:** Built-in tracking of major Indian national holidays and cultural festivals (e.g., Diwali, Independence Day, Holi, Republic Day) right on the calendar grid.
- **Inline Event Tracking:** Double-click any date to create custom events. Event titles are neatly truncated and seamlessly integrate into the grid views.
- **Month-Specific Notes:** The calendar persists your monthly memos specific to *that* individual month using local storage. 
- **Premium Glassmorphism UI:** Features sub-millisecond backdrop blurring, subtle hover ambient glows responsive to the season's color scheme, and fully dynamic CSS state architecture.
- **Range Selection:** Select start and end dates seamlessly like a physical planner.

## 🛠 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) App Router
- **UI:** React
- **Styling:** Custom CSS with CSS Variables & Glassmorphism 
- **Animation:** `requestAnimationFrame` Canvas loop & advanced CSS keyframes
- **State Management:** Native React Hooks with `localStorage` persistence

## 🚀 How to Run Locally

You need [Node.js](https://nodejs.org/) installed on your machine.

**1. Clone the repository / Navigate to the project folder:**
```bash
cd interactive-calendar
```

**2. Install dependencies:**
```bash
npm install
```

**3. Start the development server:**
```bash
npm run dev
```

**4. View the app:**
Open your browser and navigate to exactly: [http://localhost:3000](http://localhost:3000)

## 💡 Notes on Architecture
This project deliberately avoids massive CSS frameworks (like Tailwind) in favor of pure, hyper-optimized Vanilla CSS. This ensures total granular control over complex micro-animations (like the page flipping, the ambient theme glowing, and note dropdowns) while keeping the codebase visually elegant. 
