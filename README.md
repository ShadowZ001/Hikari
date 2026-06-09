# 🌌 Hikari — Next-Gen Music Experience

![Hikari Banner](./1780819046055.png)

### 🌐 Live Preview: [hikari.shadowexe.in](https://hikari.shadowexe.in) | 💬 Support Server: [Join Discord](https://discord.gg/WSyEdJXFtY)

Hikari is a premium, feature-rich Discord music bot designed around **Discord Components V2 (Cv2)**. Built with visual excellence, auto-failover music routing, and localized custom playlists, it delivers studio-quality audio with a borderless, premium aesthetic.

Developed by **Shadow** (Discord: `shadow.css`)  
Inspired by **Kreo**

---

## 🛠️ Key Features

*   **Discord Components V2 Layouts**: Completely borderless interface cards with curated HSL color accents, avoiding default hex borders for a modern, sleek appearance.
*   **Visual Web Dashboard**: Control playback, browse custom playlists, view live listener counts, and manage active server streams in real time from a beautiful web interface.
*   **Dynamic Lavalink Load Balancing**: Integrates multiple high-performance Lavalink nodes (including *NyxBot* and *TriniumHost*) with automatic failover, latency scoring, and dynamic migration during node degradation.
*   **Dynamic Search Engine Auto-Detection**: Dynamically queries active Lavalink nodes to detect supported source managers (`YouTube Music`, `Spotify`, `Apple Music`, `Deezer`, `JioSaavn`, `SoundCloud`) and filters user preferences accordingly.
*   **Local Playlist Management**: Create, add, remove, and play localized custom playlists (`pl-create`, `pl-add`, `pl-play`) stored securely in MongoDB.
*   **Real-Time Audio Control**: Modify playback speed (0.25x - 3.0x), seek to timestamps, toggle autoplay, and apply audio filters (BassBoost, 8D audio, NightCore, Vaporwave) instantly.
*   **Dynamic No-Prefix Access**: Database-driven global bypass allowing authorized users to invoke prefix commands without using the default prefix (`>`).

---

## 📁 Commands Directory

Here is a curated summary of Hikari's commands:

### 🎵 Music Commands
| Command | Aliases | Description |
| :--- | :--- | :--- |
| `play` | `p`, `hplay` | Plays a song or playlist from a search query or direct link. |
| `autoplay` | `ap`, `auto` | Toggles autoplay mode for recommended songs. |
| `pause` | None | Pauses the currently playing track. |
| `resume` | `r` | Resumes paused audio playback. |
| `skip` | `s` | Skips the current track instantly. |
| `stop` | None | Clears the queue, disconnects the bot, and stops playback. |
| `seek` | None | Jumps to a specific timestamp in the track (e.g., `1:30`, `45s`). |
| `speed` | `tempo` | Adjusts playback speed (0.25x - 3.0x) using timescale pitch preservation. |
| `volume` | `v`, `vol` | Modifies volume. Includes interactive adjustment buttons. |
| `filter` | `eq` | Apply advanced audio presets (BassBoost, 8D, NightCore, Reverb). |

### 📂 Custom Playlists
| Command | Usage | Description |
| :--- | :--- | :--- |
| `pl-create` | `pl-create <name>` | Create a new custom playlist. |
| `pl-add` | `pl-add <name> \| <query>` | Add a track/URL to a playlist. |
| `pl-remove` | `pl-remove <name> <number>` | Remove a track from your playlist. |
| `pl-list` | `pl-list` | List all your custom playlists and sizes. |
| `pl-play` | `pl-play <name>` | Queue and play all songs inside a saved playlist. |

### 🛡️ Owner Commands (shadow.css)
| Command | Description |
| :--- | :--- |
| `serverlist` | Lists all servers the bot is connected to in a paginated list. |
| `leaveserver` | Forces the bot to leave a specific guild by ID. |
| `mutual` | Returns mutual servers sharing connection with a user. |
| `nopaccess` | Grants, revokes, or lists global no-prefix bypass authorization. |
| `reload` | Dynamically hot-reloads command scripts in-memory without rebooting. |
| `restart` | Confirms and safely restarts the bot node process. |

---

## 🚀 Professional Deployment & Setup Guide

Hikari is structured for a secure, high-performance hybrid deployment:
1. **Backend (Discord Bot & Express API Server)**: Deployed to a VPS or **Pterodactyl Panel**. The dashboard API server is integrated natively inside the Discord bot process, running together on a single port for maximum speed, security, and simplicity.
2. **Frontend (Vite React Client)**: Deployed to **Vercel** as a globally fast static site, proxying `/api` traffic directly to the Pterodactyl IP/port via Vercel Edge rewrites.

---

### 🖥️ 1. Pterodactyl Panel Setup (Bot & Express Backend)

Follow these steps to host the backend of your bot on any standard Pterodactyl Panel:

#### A. Port Allocation
1. Go to your Pterodactyl Server's dashboard and navigate to the **Network** or **Allocations** tab.
2. Allocate a new port (e.g., `5000` or any available port). This will be the single port your backend uses for both the bot API and dashboard endpoints.

#### B. Prepare & Upload Files
1. Download or clone this repository to your local machine.
2. Zip all files **excluding** the `node_modules` folders (both in the root directory and inside `Hikari-dash/`).
3. Upload the ZIP file directly to the **Files** manager on Pterodactyl, and extract it.

#### C. Configure Environment Variables
Create a file named `.env` in the root folder of the project via the Pterodactyl file editor:
```env
# 🌌 DISCORD BOT CONFIGURATION
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_bot_client_id
PREFIX=>
OWNER_IDS=your_discord_user_id
SUPPORT_URL=https://discord.gg/WSyEdJXFtY

# ⚡ BOT STATUS PRESENCE
BOT_STATUS="lofi songs for kavya <:woo:1414225948089520198>"
BOT_STATUS_TYPE=CUSTOM

# 🔊 LAVALINK CONFIGURATION
LAVALINK_HOST=sg1-nodelink.nyxbot.app
LAVALINK_PORT=3000
LAVALINK_PASSWORD=nyxbot.app/support
LAVALINK_SECURE=false

# 💾 DATABASE
MONGO_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/hikari

# 🌐 DASHBOARD EXPRESS API
PORT=5000 # Use your allocated Pterodactyl port here
DISCORD_CLIENT_ID=your_bot_client_id
DISCORD_CLIENT_SECRET=your_bot_client_secret
DISCORD_REDIRECT_URI=https://your-vercel-domain.vercel.app/api/auth/callback
JWT_SECRET=use_a_random_32_character_hex_string
```

#### D. Startup Configuration
1. Go to the **Startup** tab in the Pterodactyl panel.
2. In the **Start Command** or Startup configuration field, set it to run:
   ```bash
   npm start
   ```
   *(Or keep it as `npm run start-all` since both commands now start the unified process directly).*
3. Click the **Console** tab and click **Start**. The panel will automatically install dependencies and launch the unified bot and dashboard backend concurrently.

---

### 🌐 2. Vercel Setup (Vite React Frontend)

Hosting the React frontend on Vercel is free, secure, and yields ultra-fast load times:

#### A. Configure the Vercel Proxy Rewrite
1. Open the [Hikari-dash/vercel.json](file:///c:/Users/Administrator/Downloads/Hikari/Hikari-dash/vercel.json) file.
2. Replace the destination URL with your Pterodactyl server's public IP/domain and the allocated port:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "http://your_pterodactyl_ip:your_allocated_port/api/:path*"
       },
       {
         "source": "/(.*)",
         "destination": "/$1"
       }
     ]
  }
  ```
  *(Example: `http://149.202.85.42:5000/api/:path*`)*

#### B. Deploy to Vercel
1. Sign in to your [Vercel Dashboard](https://vercel.com) and click **Add New** -> **Project**.
2. Import your GitHub repository.
3. In the project configuration page:
   - **Root Directory**: Select the `Hikari-dash` folder.
   - **Framework Preset**: Select **Vite** (automatically detected).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Deploy**. Vercel will build the frontend assets and provide you with a deployment domain (e.g., `https://hikari-dash.vercel.app`).

---

### 🛡️ 3. Discord Developer Portal OAuth2 Setup

To allow users to log in with their Discord accounts to control the bot:
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Select your application, navigate to the **OAuth2** tab, and click **Redirects**.
3. Add a redirect matching your Vercel domain:
   ```text
   https://your-vercel-domain.vercel.app/api/auth/callback
   ```
4. Save the changes. You're ready to go!

---

## 🌌 Credits & Inspiration

* **Developed By**: [Shadow](https://discord.com/users/shadow.css) (`shadow.css`)
* **Inspiration & Design Core**: Inspired by the UI and framework concepts of **Kreo**.
* **Audio Core**: Built using **Shoukaku** and **Lavalink v4**.
* **License**: MIT License (included in repository)
