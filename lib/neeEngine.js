'use strict';
/**
 * Per-session port of the NEEBASE engine (index.js): same behaviour, same plugins, but every linked
 * WhatsApp account has its own settings and data. Handlers run inside an AsyncLocalStorage context so the
 * unchanged plugins' `config` and `database/` accesses resolve to the right user.
 *
 * Deliberately NOT ported: the owner "$" (eval) and "%" (shell) shortcuts. With many users every linked
 * account is an "owner", so they would give every user full control of the server (and everyone's sessions).
 */
const { getContentType } = require('@whiskeysockets/baileys');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { run, current } = require('./context');
const { sms } = require('./serialize');
const { GroupEvents } = require('./groupEvents');
const { AntilinkHandler } = require('./antilinkHandler');
const { AntideleteHandler } = require('./antidelete');
const { handleTagDetection } = require('./tagDetector');
const { handleIncomingCall } = require('./callHandler');
const chatbot = require('./chatbotEngine');

global.chatbotActive = true; // the chatbot plugin must not start its own process-wide listener (see chatbotEngine.js)
if (!global.msgCache) global.msgCache = new Map();

const sleep = ms => new Promise(r => setTimeout(r, ms));
const lidCache = new Map();

// ---------------------------------------------------------------- status view / react (original logic)
async function resolveStatusJid(conn, mek) {
    const statusParticipant = mek.key.participant || mek.participant || mek.key.remoteJid;
    if (!statusParticipant || statusParticipant === 'status@broadcast') return null;
    if (!statusParticipant.endsWith('@lid')) return statusParticipant;

    const lid = statusParticipant.split('@')[0].split(':')[0];
    if (lidCache.has(lid)) return `${lidCache.get(lid)}@s.whatsapp.net`;
    const rawPn = mek.key?.participantPn || mek.key?.senderPn || mek.participantPn;
    if (rawPn) {
        const num = String(rawPn).split('@')[0].split(':')[0];
        lidCache.set(lid, num);
        return `${num}@s.whatsapp.net`;
    }
    try {
        const r = await conn.signalRepository?.lidMapping?.getPNForLID?.(statusParticipant);
        const num = r ? String(r).split('@')[0].split(':')[0].replace(/\D/g, '') : '';
        if (num.length >= 7) {
            if (lidCache.size > 5000) lidCache.clear();
            lidCache.set(lid, num);
            return `${num}@s.whatsapp.net`;
        }
    } catch { /* fall through */ }
    return statusParticipant;
}

async function handleStatus(conn, mek, type) {
    try {
        const shouldRead = config.AUTO_READ_STATUS === 'true';
        const shouldReact = config.AUTO_REACT_STATUS === 'true';
        if (!shouldRead && !shouldReact) return;

        const realJid = await resolveStatusJid(conn, mek);
        if (!realJid) return;

        const resolvedKey = {
            remoteJid: 'status@broadcast',
            id: mek.key.id,
            participant: realJid
        };

        if (shouldRead) await conn.readMessages([resolvedKey]);

        if (shouldReact) {
            const reactable = ['imageMessage', 'videoMessage', 'extendedTextMessage', 'conversation', 'audioMessage'];
            if (reactable.includes(type)) {
                // --- DYNAMIC EMOJI LOGIC ---
                let emojis = ['🧩', '🌸', '💫', '🫀', '🧿', '🤖', '🥰', '🗿', '💙', '🌝', '🖤', '💚']; // Default
                const emojiPath = path.join(__dirname, '../database/status_emojis.json');
                if (fs.existsSync(emojiPath)) {
                    const customEmojis = JSON.parse(fs.readFileSync(emojiPath));
                    if (customEmojis.emojis && customEmojis.emojis.length > 0) {
                        emojis = customEmojis.emojis;
                    }
                }

                const emoji = emojis[Math.floor(Math.random() * emojis.length)];
                await conn.sendMessage('status@broadcast', {
                    react: { key: resolvedKey, text: emoji }
                }, {
                    statusJidList: [realJid, conn.user.id.split(':')[0] + '@s.whatsapp.net']
                });
            }
        }
    } catch (e) { console.error("Status Error:", e.message); }
}

// Statuses are handled one at a time, ~1s apart, so a burst (e.g. right after reconnecting) can't flood
// the account or the server. Every status is still viewed/reacted to, just not all in the same instant.
function queueStatus(conn, session, ctx, mek, type) {
    session.statusPending = (session.statusPending || 0) + 1;
    if (session.statusPending > 300) { session.statusPending--; return; }
    session.statusQueue = (session.statusQueue || Promise.resolve()).then(async () => {
        try {
            if (session.sock === conn) await run(ctx, () => handleStatus(conn, mek, type));
        } finally {
            session.statusPending--;
        }
        await sleep(1000);
    }).catch(() => {});
}

// ---------------------------------------------------------------- one incoming message (original logic)
async function handleMessage(conn, session, ctx, mek) {
    try {
        if (!mek || !mek.message) return;

        // Handle Ephemeral Messages
        mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;

        const from = mek.key.remoteJid;
        if (!from || from.endsWith('@newsletter') || from === 'broadcast') return;
        const type = getContentType(mek.message);

        // ============ [ STATUS VIEW & REACT LOGIC (MULTI-CONTACT) ] ============
        if (from === 'status@broadcast') {
            if (!mek.key.fromMe) queueStatus(conn, session, ctx, mek, type);
            return;
        }

        // The (original) chatbot listener, now per session
        chatbot.handle(conn, mek).catch(() => {});

        // ============ [ PRESENCE & AUTO-REACT LOGIC ] ============
        if (from !== 'status@broadcast' && !mek.key.fromMe) {
            if (config.AUTO_TYPING === "true") await conn.sendPresenceUpdate('composing', from);
            if (config.AUTO_RECORDING === "true") await conn.sendPresenceUpdate('recording', from);
            if (config.AUTO_READ === "true") await conn.readMessages([mek.key]);
            if (config.AUTO_REACT === "true") {
                const reactEmojis = ['❤️', '🔥', '⚡', '🤖', '💎', '✨'];
                const randReact = reactEmojis[Math.floor(Math.random() * reactEmojis.length)];
                await conn.sendMessage(from, { react: { text: randReact, key: mek.key } });
            }
        }

        // ============ [ COMMAND & PLUGIN LOGIC ] ============
        const m = sms(conn, mek);

        // The owner is the linked account itself (its phone number or its LID).
        const senderNum = m.sender.split('@')[0].split(':')[0];
        const meNum = (conn.user?.id || '').split(':')[0].split('@')[0];
        const meLid = (conn.user?.lid || '').split(':')[0].split('@')[0];
        const isOwnerNum = senderNum === meNum || (!!meLid && senderNum === meLid)
            || config.OWNER_NUMBER.includes(m.sender.split('@')[0]);

        // --- ANTILINK HANDLER ---
        await AntilinkHandler(conn, m, isOwnerNum);

        // --- ANTIDELETE HANDLER ---
        await AntideleteHandler(conn, m);

        // --- ANTITAG HANDLER ---
        await handleTagDetection(conn, m);

        const body = m.body || '';
        const isCmd = body.startsWith(config.PREFIX);

        let command = '';
        let args = [];

        if (isCmd) {
            command = body.slice(config.PREFIX.length).trim().split(' ').shift().toLowerCase();
            args = body.trim().split(/ +/).slice(1);
        } else if (config.NON_PREFIX === "true") {
            command = body.trim().split(' ').shift().toLowerCase();
            args = body.trim().split(/ +/).slice(1);
        }

        const text = args.join(' ');
        const pushname = m.pushName || 'User';
        const isOwner = isOwnerNum || m.fromMe;
        const botNumber = conn.user.id.split(':')[0] + '@s.whatsapp.net';

        const plugin = global.plugins.get(command) || [...global.plugins.values()].find(p => p.alias && p.alias.includes(command));

        // --- BOT MAIN SWITCH LOGIC ---
        if (config.BOT_OFF === "true" && !isOwner) return;

        if (plugin) {
            if (!isCmd && config.NON_PREFIX !== "true") return;
            if (plugin.isOwner && !isOwner) return m.reply("❌ Developer Restricted Command.");
            if (plugin.isGroup && !m.isGroup) return m.reply("❌ This is for Groups only.");

            if (plugin.isBotAdmin && m.isGroup) {
                const groupMetadata = await conn.groupMetadata(from);
                const bot = groupMetadata.participants.find(p => p.id === botNumber);
                if (!bot || !bot.admin) return m.reply("❌ I need Admin permissions first.");
            }

            try {
                await plugin.execute(conn, m, { text, args, isOwner, isGroup: m.isGroup, pushname });
            } catch (e) { console.error(`Plugin Execution Error [${command}]:`, e.message); }
        }
    } catch (e) { console.error("Event Handler Error:", e.message); }
}

// ---------------------------------------------------------------- wiring for one socket
function attach(conn, session) {
    // Every message the bot sends is attributed to the newsletter (original behaviour). The original re-wrapped
    // sendMessage on every incoming message (wrappers piled up forever); once per socket does the same job.
    const originalSendMessage = conn.sendMessage.bind(conn);
    conn.sendMessage = async (jid, content, options = {}) => {
        const mek = current()?.mek;
        const newsletterContext = {
            mentionedJid: [mek?.key?.participant || mek?.participant || mek?.key?.remoteJid].filter(Boolean),
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: config.NEWSLETTER_JID || '120363423997837331@newsletter',
                newsletterName: config.OWNER_NAME || 'POPKID',
                serverMessageId: 1
            }
        };
        if (content.contextInfo) {
            content.contextInfo = { ...newsletterContext, ...content.contextInfo };
        } else {
            content.contextInfo = newsletterContext;
        }
        return originalSendMessage(jid, content, options);
    };

    conn.ev.on('messages.upsert', chatUpdate => {
        if (session.sock !== conn || chatUpdate.type !== 'notify') return;
        for (const mek of chatUpdate.messages) {
            const ctx = { session, conn, mek };
            run(ctx, () => handleMessage(conn, session, ctx, mek)).catch(() => {});
        }
    });

    // ============ [ CALL EVENT ] ============
    conn.ev.on('call', call => {
        if (session.sock !== conn) return;
        run({ session, conn }, () => handleIncomingCall(conn, call)).catch(() => {});
    });

    // ============ [ GROUP PARTICIPANTS UPDATE HANDLER ] ============
    conn.ev.on('group-participants.update', anu => {
        if (session.sock !== conn) return;
        run({ session, conn }, () => GroupEvents(conn, anu)).catch(() => {});
    });
}

// ---------------------------------------------------------------- when a session connects
async function onOpen(session, conn) {
    await run({ session, conn }, async () => {
        // --- ALWAYS ONLINE LOGIC ---
        if (config.ALWAYS_ONLINE === "true") {
            await conn.sendPresenceUpdate('available').catch(() => {});
        }

        // Announce once per process start (the original did it on every reconnect, which would spam users here)
        if (session.liveSent) return;
        session.liveSent = true;
        const ownerJid = (conn.user?.id || '').split(':')[0] + "@s.whatsapp.net";
        await conn.sendMessage(ownerJid, {
            image: { url: "https://files.catbox.moe/j9ia5c.png" },
            caption: `🚀 *POPKID-MD IS LIVE!* \n\nPrefix: ${config.PREFIX}\nNon-Prefix: ${config.NON_PREFIX}\nStatus View: ${config.AUTO_READ_STATUS}`
        }).catch(() => {});
    });
}

// ---------------------------------------------------------------- AUTO-BIO UPDATER (one timer for all sessions)
function startAutoBio(getSessions) {
    const timer = setInterval(() => {
        let i = 0;
        for (const session of getSessions()) {
            const conn = session.sock;
            if (session.status !== 'open' || !conn?.user) continue;
            const delay = (i++) * 400; // spread the updates across the minute
            setTimeout(() => run({ session, conn }, async () => {
                if (config.AUTO_BIO === "true" && conn.user) {
                    const time = new Date().toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi', hour12: false });
                    const bioText = `❤️ ᴘᴏᴘᴋɪᴅ xᴍᴅ ʙᴏᴛ ɪs ʟɪᴠᴇ ⏰ ${time} | Prefix: ${config.PREFIX}`;
                    try { await conn.updateProfileStatus(bioText); } catch (err) {}
                }
            }), delay).unref?.();
        }
    }, 60000);
    timer.unref?.();
    return timer;
}

module.exports = { attach, onOpen, startAutoBio };
