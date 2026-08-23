# Private Two-User Chat & Real-Time Discord Bridge ❤️

A high-performance, secure, and modern real-time messenger built exclusively for **Sagar** and **Something**, featuring a bidirectional synchronization bridge between the web platform and **two dedicated Discord bots**.

---

## 🌟 Key Highlights

- 🔒 **Strict 2-User System**: Exclusively authorized for **Sagar** and **Something**. Public registration, account discovery, and unauthorized access are completely blocked (403 Forbidden).
- 🌸 **Romantic Glassmorphism UI**: Custom dreamy pink crystal hearts backdrop with high-contrast, modern dark glass panels optimized for desktop and mobile devices.
- 🤖 **Bidirectional Dual Discord Bridge**:
  - **Bot 1 (Sagar)**: Delivers Sagar's web messages into the Discord channel and listens for Sagar's Discord messages.
  - **Bot 2 (Something)**: Delivers Something's web messages into the Discord channel and listens for Something's Discord messages.
  - **Complete Sync**: Edits, deletions, replies, and attachments are synchronized in real time across both the website and Discord.
  - **Infinite Loop Prevention**: Smart message source tracking (`website` vs `discord`) and deduplication cache ensure zero echo loops.
- ⚡ **Real-Time WebSockets**: Instant message delivery, typing indicators (*"Something is typing..."*), presence indicators (🟢 Online / ⚫ Offline), and message status ticks (✓ Sent, ✓✓ Delivered, ✓✓ Read).
- 📱 **Mobile Perfection**: 100dvh viewport sizing, keyboard-safe padding, touch context menus, and responsive modals.
- 📎 **Rich Media & Protected Storage**: Drag-and-drop file sharing for images, videos, audio, documents, and archives up to 50MB with full-screen zoomable lightbox and protected stream access.
- 📶 **Offline Resilience**: Automatically queues messages if internet connection drops and resends seamlessly when reconnected without duplicates.

---

## 🚀 Quick Start & Hosting Guide

### 1. Local Development
```bash
# Terminal 1: Backend Server (Port 4000)
cd server
npm install
npm run setup
npm run dev

# Terminal 2: Frontend Client (Port 5173 with proxy)
cd client
npm install
npm run dev
```

### 2. Hosting & Production Deployment
This application is designed for cloud hosting on platforms like **Render**, **Railway**, **Fly.io**, **Heroku**, **VPS (Ubuntu/Debian)**, or **Docker**.

#### Single Command Build & Start:
```bash
# Build both frontend and backend
npm run build

# Start the unified production server
npm start
```
The server serves the compiled frontend assets directly from `http://localhost:4000` alongside the REST API, Socket.IO WebSockets, and Discord Bridge bots.

#### Deploying with Docker:
```bash
docker build -t private-duo-chat .
docker run -p 4000:4000 --env-file server/.env private-duo-chat
```

---

## 🔑 Default Credentials

| User | Username | Default Password | Role |
| :--- | :--- | :--- | :--- |
| **Sagar** | `sagar` | `password123` | Authorized User 1 |
| **Something** | `something` | `password123` | Authorized User 2 |

*(Passwords and display profiles can be updated anytime inside **Room Settings**).*

---

## 🤖 Discord Bot Setup Instructions

To enable two-way synchronization between Discord and the website:

### Step 1: Create Bot 1 (For Sagar)
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application** and name it `Sagar Bot`.
3. Go to the **Bot** tab on the left sidebar:
   - Click **Reset Token** and copy the token into `DISCORD_BOT_SAGAR_TOKEN` in your `server/.env`.
   - Scroll down to **Privileged Gateway Intents** and enable:
     - ✅ **Message Content Intent**
     - ✅ **Server Members Intent**
4. Go to **OAuth2 → URL Generator**:
   - Scopes: Select `bot`.
   - Bot Permissions: Select `Send Messages`, `Read Message History`, `Attach Files`, `Embed Links`, `Manage Messages`.
   - Copy the generated URL and open it in your browser to invite the bot to your private Discord server.

### Step 2: Create Bot 2 (For Something)
1. Repeat the same steps in the [Discord Developer Portal](https://discord.com/developers/applications) for `Something Bot`.
2. Copy the token into `DISCORD_BOT_SOMETHING_TOKEN` in `server/.env`.
3. Enable **Message Content Intent** and invite Bot 2 to the same Discord server.

### Step 3: Configure Channel & User IDs
1. In Discord Settings → Advanced, enable **Developer Mode**.
2. Right-click your private Discord channel → **Copy Channel ID** → Paste into `DISCORD_CHANNEL_ID`.
3. Right-click Sagar's Discord account → **Copy User ID** → Paste into `DISCORD_SAGAR_USER_ID`.
4. Right-click Something's Discord account → **Copy User ID** → Paste into `DISCORD_SOMETHING_USER_ID`.
5. Restart your backend server. Both bots will log in and show active in the in-app **Bridge Diagnostics** panel!

---

## 📁 Project Structure

```
private-duo-chat/
├── client/                     # Frontend (React + Vite + TypeScript + Tailwind CSS)
│   ├── public/                 # Static Assets (bg-hearts.png)
│   ├── src/
│   │   ├── components/         # Auth & Chat UI Components
│   │   │   ├── Auth/           # Login & Quick Switch
│   │   │   └── Chat/           # Header, Messages, Composer, Lightbox, Modals
│   │   ├── context/            # AuthContext, SocketContext, ChatContext
│   │   ├── services/           # Axios API Client & Web Audio Sound Engine
│   │   ├── types/              # Client Data Interfaces
│   │   ├── App.tsx             # Root Application & Drag-and-Drop Handler
│   │   └── main.tsx            # Context Provider Wrappers
│   └── package.json
│
├── server/                     # Backend (Node.js + Express + Socket.IO + Prisma + discord.js)
│   ├── prisma/
│   │   ├── schema.prisma       # Database Models (Users, Messages, Attachments, Sessions)
│   │   └── seed.ts             # Initial Account & Conversation Seeder
│   ├── src/
│   │   ├── config/             # Environment & Security Constants
│   │   ├── controllers/        # Auth, Messages, Uploads & System Diagnostics
│   │   ├── middleware/         # 2-User Auth Guard & Rate Limiters
│   │   ├── routes/             # REST API Routes
│   │   ├── services/
│   │   │   ├── auth.service.ts # Password Hashing, JWT & Session Management
│   │   │   ├── discord.service.ts # Dual Bot Engine & Loop-Free Bridge
│   │   │   ├── message.service.ts # Pagination, Search, Soft-Deletes & Edits
│   │   │   ├── socket.service.ts  # Real-Time WebSocket Gateway
│   │   │   └── storage.service.ts # Protected File Uploads & Whitelist Checks
│   │   └── index.ts            # Server Entry Point
│   └── package.json
│
├── Dockerfile                  # Production Docker Container Setup
├── README.md                   # Complete Documentation
└── package.json                # Unified Workspace Scripts
```
