# Popkid-MD Mini Bot (NEEBASE, multi-session)

The NEEBASE bot as a mini bot: visitors open your site, enter their number, get a pairing code and link
it in WhatsApp → Linked devices. No SESSION_ID. Every user gets their own session, settings and data.

## Deploy on Render
1. `bot.env` already contains the database URL. (If you use a different database, edit the `DATABASE_URL` line.)
2. Put the extracted project in a **private** GitHub repo (`bot.env` holds secrets).
3. Render → New → Blueprint (reads `render.yaml`), or Web Service (build `npm install`, start `npm start`).
4. Open your `https://<app>.onrender.com` URL: that is the pairing page. `/health` should say `"storage":"postgres"`.

Both mini bots can use the same Supabase project and the same `DATABASE_URL`: tables here start with `nee_`
(`DB_TABLE_PREFIX`), so nothing mixes. Use a different `ENCRYPTION_KEY` (already generated in `bot.env`).

## What is unchanged
All 57 plugins except `update` and `restart` are byte-identical to the original, and so are the original
handlers (`serialize`, `groupEvents`, `antilinkHandler`, `callHandler`, `tagDetector`, `isAdmin`, `utils`).
Same commands, same replies, same defaults (see `bot.env`), same newsletter attribution on every message.

## How it works per user (without editing the plugins)
- `config` is a per-session view: `.mode`, `.anticall`, `.autobio`, `.nonprefix` ... change only that
  user's copy, saved in the database. The owner is whoever linked the session.
- The plugins' `database/*.json` files are redirected to that user's own documents in the database.
- The chatbot, which the original ran as one process-wide listener, runs for every session.
- Auto-bio runs from one timer for all sessions; statuses are viewed/reacted to one at a time, ~1s apart.

## Deliberate differences
- **Removed `update` and `restart`:** they replace the server's code / restart the whole process, which would
  let any user affect everyone.
- **Removed the owner `$` (eval) and `%` (shell) shortcuts:** every linked user is an "owner" of their own
  session, so these would give everyone control of the server and all stored sessions.
- Antidelete's message cache is per user and capped (the original cached every message for an hour, forever
  growing); it no longer caches when antidelete is off.
- The "POPKID-MD IS LIVE" message is sent once per server start, not on every reconnect.
- Only real-time ("notify") messages run commands, not history or own-sent ones.
- New plugin `autofollow` (`.autofollow on/off`) lets each user opt out of the one-time channel follow.
- Uses `baileys@6.7.21` (as your other bot) instead of the `Prince-bailey` fork, and `@ffmpeg-installer/ffmpeg`
  so the sticker plugin finds `ffmpeg`.

## Heads-up
The defaults make every newly linked account view and react to contacts' statuses, update its bio every minute,
appear always online and run commands without a prefix. The pairing page lists these before anyone links.
`joingroup.js` (the `.join` command) was already broken in the original: it uses variables that don't exist.
