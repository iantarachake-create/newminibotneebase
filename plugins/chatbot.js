const axios = require('axios');
const fs = require('fs');
const path = require('path');
const settingsFile = path.join(__dirname, '../database/group_settings.json');

module.exports = {
    cmd: "chatbot",
    alias: ["autoai", "popkidai"],
    desc: "Autonomous AI Chatbot Toggle",
    category: "ai",
    async execute(conn, m, { text }) {
        // 1. Ensure Global Connection is set
        global.conn = conn;

        const dbDir = path.join(__dirname, '../database');
        if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);
        let settings = fs.existsSync(settingsFile) ? JSON.parse(fs.readFileSync(settingsFile)) : {};

        // 2. Toggle Logic
        if (text === "on") {
            settings[m.from] = { ...settings[m.from], autoai: true };
            fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
            
            // Start the listener immediately if not already running
            startChatbotListener(conn);
            
            return m.reply("🤖 *POPKID-MD AI:* Chatbot is now *ON*. I will reply to all messages in this chat.");
        } 
        
        if (text === "off") {
            settings[m.from] = { ...settings[m.from], autoai: false };
            fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
            return m.reply("😴 *POPKID-MD AI:* Chatbot is now *OFF*.");
        }

        const status = settings[m.from]?.autoai ? "ACTIVE ✅" : "INACTIVE ❌";
        return m.reply(`🤖 *POPKID-MD CHATBOT*\n\nStatus: ${status}\n\n*Usage:* .chatbot on/off`);
    }
};

// --- THE BACKGROUND ENGINE ---
function startChatbotListener(conn) {
    if (global.chatbotActive) return; // Prevent duplicate listeners
    global.chatbotActive = true;

    console.log("🧠 POPKID-MD Chatbot Listener Activated");

    conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
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

            // API Request from your screenshot
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
    });
}
