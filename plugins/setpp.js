const { getContentType, downloadContentFromMessage } = require("@whiskeysockets/baileys");
const Jimp = require("jimp");

module.exports = {
    cmd: "setpp",
    alias: ["setbotpp"],
    desc: "Force Change Bot PP",
    category: "owner",
    isOwner: true,
    async execute(conn, m) {
        try {
            const messageContent = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!messageContent) return m.reply("❌ Please reply to an image!");

            const type = getContentType(messageContent);
            const imageMsg = messageContent.imageMessage || messageContent.documentMessage;

            if (!imageMsg || !/image/.test(imageMsg.mimetype)) {
                return m.reply("❌ The bot doesn't find a photo in that reply.");
            }

            await m.react("⏳");

            // 1. Download raw buffer
            const stream = await downloadContentFromMessage(imageMsg, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // 2. Process image with Jimp to make it a square (WhatsApp requirement)
            const image = await Jimp.read(buffer);
            const resBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);

            // 3. Update PP
            const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
            await conn.updateProfilePicture(botJid, resBuffer);
            
            await m.react("✅");
            m.reply("✅ *POPKID-MD* Profile Picture Updated!");

        } catch (e) {
            console.error(e);
            m.reply(`❌ Error: ${e.message}. Ensure 'npm install jimp' was run.`);
        }
    }
};
