'use strict';
// The original chatbot plugin starts ONE global listener for the whole process (guarded by
// global.chatbotActive), so with many linked accounts only the first would ever reply.
// This is the same logic, run for every session instead. (index.js sets global.chatbotActive = true so the
// plugin does not start its own listener.)
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const settingsFile = path.join(__dirname, '../database/group_settings.json');

async function handle(conn, mek) {
    try {
        if (!mek.message || mek.key.fromMe) return;

        const from = mek.key.remoteJid;
        const body = mek.message.conversation || mek.message.extendedTextMessage?.text || mek.message.imageMessage?.caption;

        // Don't reply to commands or empty messages
        if (!body || body.startsWith('.') || body.startsWith('!') || body.startsWith('/')) return;

        // Read database
        if (!fs.existsSync(settingsFile)) return;
        let settings = JSON.parse(fs.readFileSync(settingsFile));

        // ONLY reply if this specific chat has autoai: true
        if (!settings[from]?.autoai) return;

        // Visual feedback: Typing...
        await conn.sendPresenceUpdate('composing', from);

        const { data } = await axios.get('https://api.qasimdev.dpdns.org/api/gemini/flash', {
            params: {
                text: body,
                apiKey: 'xbps-install-Syu',
                GeminiKey: 'xbps-install-Syu'
            },
            timeout: 30000
        });

        if (data?.data?.response) {
            await conn.sendMessage(from, { text: data.data.response }, { quoted: mek });
        }
    } catch (e) {
        console.log("Chatbot Error:", e.message);
    }
}

module.exports = { handle };
