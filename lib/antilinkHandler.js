const fs = require('fs');
const path = require('path');
const settingsFile = path.join(__dirname, '../database/group_settings.json');

async function AntilinkHandler(conn, m, isOwner) {
    try {
        // 1. Basic Safety Checks
        if (!m.isGroup || m.key.fromMe || !m.body) return;

        // 2. Load Database
        const dbDir = path.join(__dirname, '../database');
        if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);
        let settings = fs.existsSync(settingsFile) ? JSON.parse(fs.readFileSync(settingsFile)) : {};

        const currentMode = settings[m.from]?.antilink || "off";
        if (currentMode === "off") return;

        // 3. Link Detection Pattern
        const linkPattern = /chat.whatsapp.com\/|https?:\/\/[^\s]+|www\.[^\s]+/gi;

        if (linkPattern.test(m.body)) {
            // Fetch fresh metadata to verify admins
            const groupMetadata = await conn.groupMetadata(m.from).catch(() => null);
            if (!groupMetadata) return;

            const userIsAdmin = groupMetadata.participants.find(p => p.id === m.sender)?.admin || isOwner;

            // 4. Action Logic for Non-Admins
            if (!userIsAdmin) {
                // DELETE: Always try to delete first
                await conn.sendMessage(m.from, { delete: m.key }).catch(() => null);

                if (currentMode === "kick") {
                    await m.reply(`🚫 *Link Policy:* @${m.sender.split('@')[0]} has been removed.`);
                    await conn.groupParticipantsUpdate(m.from, [m.sender], "remove").catch(() => null);

                } else if (currentMode === "warn") {
                    if (!settings[m.from].warnings) settings[m.from].warnings = {};
                    if (!settings[m.from].warnings[m.sender]) settings[m.from].warnings[m.sender] = 0;
                    
                    settings[m.from].warnings[m.sender] += 1;
                    const count = settings[m.from].warnings[m.sender];
                    
                    if (count >= 3) {
                        await m.reply(`🚫 *Final Strike:* @${m.sender.split('@')[0]} removed for 3/3 warnings.`);
                        settings[m.from].warnings[m.sender] = 0; // Reset
                        await conn.groupParticipantsUpdate(m.from, [m.sender], "remove").catch(() => null);
                    } else {
                        await m.reply(`⚠️ *Link Warning (${count}/3):* @${m.sender.split('@')[0]}, links are forbidden here!`);
                    }
                    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
                } else if (currentMode === "delete") {
                    await m.reply(`🚫 *No Links Allowed!* (Message Deleted)`);
                }
            }
        }
    } catch (e) {
        console.log("Antilink Handler Error: ", e.message);
    }
}

module.exports = { AntilinkHandler };
