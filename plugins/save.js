const { getContentType, downloadContentFromMessage } = require("@whiskeysockets/baileys");

module.exports = {
    cmd: "save",
    alias: ["getstatus", "downloadstatus"],
    desc: "Download status (Minimal)",
    category: "tools",
    async execute(conn, m) {
        try {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted) return m.reply("⚠️ *Select a status*");

            const type = getContentType(quoted);
            const sender = m.message.extendedTextMessage.contextInfo.participant.split('@')[0];
            const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';

            // --- ULTRA SIMPLE CAPTION ---
            const caption = `📥 *Saved Status*\n` +
                            `👤 *From:* @${sender}\n\n` +
                            `> *Popkid Md Engine* 🇰🇪`;

            // 1. Handle Text Status
            if (type === 'conversation' || type === 'extendedTextMessage') {
                const statusText = quoted.conversation || quoted.extendedTextMessage.text;
                await conn.sendMessage(botJid, { 
                    text: caption + `\n\n📝 *Text:*\n${statusText}`,
                    mentions: [m.message.extendedTextMessage.contextInfo.participant]
                });
                return m.reply("✅ *Saved*");
            }

            // 2. Handle Media Status
            if (/imageMessage|videoMessage/.test(type)) {
                await m.react("⏳");
                
                const mediaData = quoted[type];
                const stream = await downloadContentFromMessage(mediaData, type.replace('Message', ''));
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }

                const mediaType = type.replace('Message', '');
                
                await conn.sendMessage(botJid, {
                    [mediaType]: buffer,
                    caption: caption,
                    mentions: [m.message.extendedTextMessage.contextInfo.participant]
                });

                await m.react("✅");
                return m.reply("✅ *Saved to DM*");
            }

        } catch (e) {
            m.reply("⚠️ *Error*");
        }
    }
};
