const { downloadContentFromMessage, getContentType } = require("@whiskeysockets/baileys");
const Jimp = require("jimp");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = {
    cmd: "sticker",
    alias: ["s", "stiker"],
    desc: "Local high-speed sticker converter",
    category: "convert",
    async execute(conn, m) {
        try {
            const messageContent = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message;
            const type = getContentType(messageContent);
            const mediaMsg = messageContent?.imageMessage || messageContent?.documentMessage;

            if (!mediaMsg || !/image/.test(mediaMsg.mimetype)) {
                return m.reply("❌ Please reply to an image!");
            }

            await m.react("⏳");

            // 1. Download Media
            const stream = await downloadContentFromMessage(mediaMsg, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // 2. Process Image (Square Crop)
            const image = await Jimp.read(buffer);
            image.cover(512, 512); 
            const jpgBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);

            // 3. Save temp files
            const tmpFile = path.join(__dirname, `../tmp/${Date.now()}.jpg`);
            const webpFile = path.join(__dirname, `../tmp/${Date.now()}.webp`);
            if (!fs.existsSync(path.join(__dirname, '../tmp'))) fs.mkdirSync(path.join(__dirname, '../tmp'));
            
            fs.writeFileSync(tmpFile, jpgBuffer);

            // 4. Use local FFMPEG (Fast & Offline)
            exec(`ffmpeg -i ${tmpFile} -vf "scale=512:512:force_original_aspect_ratio=increase,crop=512:512" ${webpFile}`, async (err) => {
                if (err) {
                    // Fallback if FFMPEG fails: Send as image buffer (Baileys auto-converts some)
                    await conn.sendMessage(m.from, { sticker: jpgBuffer }, { quoted: m });
                } else {
                    const finalSticker = fs.readFileSync(webpFile);
                    await conn.sendMessage(m.from, { sticker: finalSticker }, { quoted: m });
                }

                // Cleanup
                if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
                if (fs.existsSync(webpFile)) fs.unlinkSync(webpFile);
                await m.react("✅");
            });

        } catch (e) {
            console.error(e);
            m.reply("❌ System Error: " + e.message);
        }
    }
};
