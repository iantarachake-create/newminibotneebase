const { downloadContentFromMessage, getContentType } = require("@whiskeysockets/baileys");
const axios = require('axios');
const FormData = require('form-data');

module.exports = {
    cmd: "tourl",
    alias: ["url", "upload", "catbox"],
    desc: "Convert media to a permanent link",
    category: "TOOLS",
    async execute(conn, m) {
        try {
            // 1. EXACT STICKER LOGIC TO FIND MEDIA
            const messageContent = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message;
            const type = getContentType(messageContent);
            
            const mediaMsg = messageContent?.imageMessage || 
                             messageContent?.videoMessage || 
                             messageContent?.audioMessage || 
                             messageContent?.documentMessage;

            if (!mediaMsg || !mediaMsg.mimetype) {
                return m.reply("❌ Please reply to an image, video, or document!");
            }

            await m.react("⏳");

            // 2. DOWNLOAD MEDIA (Using your working stream logic)
            const streamType = mediaMsg.mimetype.split('/')[0].replace('application', 'document');
            const stream = await downloadContentFromMessage(mediaMsg, streamType);
            
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            if (!buffer || buffer.length === 0) throw new Error("File download failed.");

            // 3. SIZE CHECK (10MB)
            if (buffer.length > 10 * 1024 * 1024) {
                return m.reply("✴️ *ꜰɪʟᴇ ᴛᴏᴏ ʟᴀʀɢᴇ.* ᴍᴀx ʟɪᴍɪᴛ ɪꜱ 10ᴍʙ.");
            }

            // 4. DETECT EXTENSION (Fixed version-safe way)
            let extension = 'bin';
            try {
                const { fileTypeFromBuffer } = await import('file-type');
                const ft = await fileTypeFromBuffer(buffer);
                if (ft) extension = ft.ext;
            } catch (e) {
                // Fallback: Get extension from mimetype if file-type fails
                extension = mediaMsg.mimetype.split('/')[1].split(';')[0] || 'bin';
            }

            // 5. UPLOAD TO CATBOX
            const form = new FormData();
            form.append('reqtype', 'fileupload');
            form.append('fileToUpload', buffer, `popkid.${extension}`);

            const res = await axios.post('https://catbox.moe/user/api.php', form, {
                headers: { ...form.getHeaders() }
            });

            const url = res.data;

            if (!url || typeof url !== 'string' || !url.startsWith('https')) {
                throw new Error("Invalid response from Catbox.");
            }

            // 6. SUCCESS OUTPUT
            const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
            await m.react("🔗");

            return m.reply(
                `✅ *ᴜᴘʟᴏᴀᴅ ꜱᴜᴄᴄᴇꜱꜱꜰᴜʟ*\n\n` +
                `🔗 *ᴜʀʟ:* ${url}\n` +
                `💾 *ꜱɪᴢᴇ:* ${sizeMB} MB\n\n` +
                `> 𝖯𝗈𝗉𝗄𝗂𝖽 𝖬𝖽 𝖤𝗇𝗀ɪɴ𝖾 🇰🇪`
            );

        } catch (e) {
            console.error("URL Command Error:", e);
            await m.react("❌");
            return m.reply(`❌ *ᴜᴘʟᴏᴀᴅ ꜰᴀɪʟᴇᴅ:* ${e.message}`);
        }
    }
};
