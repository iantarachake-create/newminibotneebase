const { isBotAdmin, isSenderAdmin } = require('../lib/utils')

module.exports = {
    cmd: "setgpp",
    desc: "Change Group Profile Picture",
    category: "admin",
    isGroup: true,
    async execute(conn, m, { isOwner }) {
        try {
            if (!await isBotAdmin(conn, m.from)) return m.reply("❌ I need Admin rights.")
            if (!isOwner && !await isSenderAdmin(conn, m.from, m.sender)) return m.reply("❌ Admins only.")

            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted || !quoted.imageMessage) return m.reply("⚠️ *Reply to an image*")

            const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
            const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]); }

            await conn.updateProfilePicture(m.from, buffer)
            await m.react("📸")
            
            m.reply(`✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃* ✨\n══════════════════\n✅ *ɢʀᴏᴜᴘ ɪᴄᴏɴ ᴜᴘᴅᴀᴛᴇᴅ*\n══════════════════`)
        } catch (e) { m.reply("❌ Failed to update GPP.") }
    }
}
