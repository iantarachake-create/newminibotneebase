const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, '../database/antitag.json');

async function handleTagDetection(conn, m) {
    try {
        if (!m.isGroup || m.fromMe) return;

        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const config = db[m.from];
        if (!config || !config.enabled) return;

        // Detection Logic
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const textMentions = m.body?.match(/@\d+/g) || [];
        const totalMentions = [...new Set([...mentioned, ...textMentions])].length;

        // Threshold: If someone tags more than 10 people or 50% of the group
        const groupMetadata = await conn.groupMetadata(m.from);
        const threshold = Math.ceil(groupMetadata.participants.length * 0.5);

        if (totalMentions >= 10 || totalMentions >= threshold) {
            // Check if sender is admin (Admins are allowed to tag)
            const isAdmin = groupMetadata.participants.find(p => p.id === m.sender)?.admin;
            if (isAdmin) return;

            // Delete Message
            await conn.sendMessage(m.from, { delete: m.key });

            if (config.action === "kick") {
                await conn.groupParticipantsUpdate(m.from, [m.sender], "remove");
                await conn.sendMessage(m.from, { text: `🚫 @${m.sender.split('@')[0]} ʜᴀꜱ ʙᴇᴇɴ ᴋɪᴄᴋᴇᴅ ꜰᴏʀ ᴍᴀꜱꜱ ᴛᴀɢɢɪɴɢ.`, mentions: [m.sender] });
            } else {
                await conn.sendMessage(m.from, { text: `⚠️ @${m.sender.split('@')[0]}, ᴍᴀꜱꜱ ᴛᴀɢɢɪɴɢ ɪꜱ ɴᴏᴛ ᴀʟʟᴏᴡᴇᴅ ʜᴇʀᴇ!`, mentions: [m.sender] });
            }
        }
    } catch (e) {
        console.error("Antitag Error:", e);
    }
}

module.exports = { handleTagDetection };
