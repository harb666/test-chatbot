# Telegram Image Bot

A Telegram bot that generates images from text prompts — for free, no API
key or paid account required.

Image generation is powered by [Pollinations.ai](https://pollinations.ai),
a free, keyless image-generation HTTP API. Just send the bot a text prompt
and it replies with a generated image.

## Setup

1. **Create a bot with BotFather**
   - Open [@BotFather](https://t.me/BotFather) on Telegram
   - Send `/newbot` and follow the prompts
   - Copy the token it gives you (looks like `123456789:AA...`)

2. **Install dependencies**

   ```bash
   cd telegram-image-bot
   npm install
   ```

3. **Configure**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and paste your token into `TELEGRAM_BOT_TOKEN`.

4. **Run it**

   ```bash
   npm run dev
   ```

   You should see `Bot @yourbotname is running (long polling)...`. Open a
   chat with your bot on Telegram and send `/start`.

## Usage

- `/imagine <description>` — generate an image from a text prompt
- Or just send any plain text message — it's treated as a prompt too
- `/help` — show usage info

Example:

```
/imagine a corgi surfing at sunset, watercolor style
```

## Configuration

All settings are read from `.env` (see `.env.example`):

| Variable             | Description                                                       | Default  |
| --------------------- | ------------------------------------------------------------------ | -------- |
| `TELEGRAM_BOT_TOKEN`  | Bot token from BotFather (required)                                 | —        |
| `ALLOWED_USER_IDS`    | Comma-separated Telegram user IDs allowed to use the bot            | everyone |
| `COOLDOWN_SECONDS`    | Minimum seconds between requests per user (basic anti-spam)         | `10`     |
| `IMAGE_SIZE`          | Width/height in pixels of generated images                          | `1024`   |

To restrict the bot to yourself, message [@userinfobot](https://t.me/userinfobot)
to get your numeric Telegram ID, then set `ALLOWED_USER_IDS=<your id>`.

## Production build

```bash
npm run build
npm start
```

## Deploying

This bot uses long polling, so it just needs to run as a persistent
process — no public URL or webhook needed. It runs anywhere Node.js 18+ is
available: a small VPS, [Railway](https://railway.app),
[Render](https://render.com), [Fly.io](https://fly.io), a Raspberry Pi, etc.
Set `TELEGRAM_BOT_TOKEN` (and any optional variables) as environment
variables on the host, then run `npm ci && npm run build && npm start`.

## Notes on the free image provider

Pollinations.ai requires no signup or API key, which is what makes this
bot free to run with zero configuration. As a shared free service it can be
slower at peak times and has no uptime guarantee. If you outgrow it, swap
`generateImage` in `src/imageProvider.ts` for another provider (e.g. a
Hugging Face Inference API model) — the rest of the bot doesn't need to
change.
