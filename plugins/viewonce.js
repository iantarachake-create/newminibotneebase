const { getContentType, downloadContentFromMessage } = require("@whiskeysockets/baileys");

module.exports = {
    cmd: "vv",
    alias: ["retrive", "viewonce"],
    desc: "Retrieve/Leak View-Once media",
    category: "tools",
    async execute(conn, m) {
        try {
            // 1. Target the replied message
            const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg) return m.reply("❌ *Please reply to a View-Once message!*");

            // 2. Locate the media content (It can be inside different wrappers)
            let mediaContent = quotedMsg.viewOnceMessageV2?.message || 
                               quotedMsg.viewOnceMessage?.message || 
                               quotedMsg;

            let type = getContentType(mediaContent);
            let mediaData = mediaContent[type];

            // 3. Validation: Check if it's truly a View-Once (internal flag)
            const isVO = mediaData?.viewOnce || quotedMsg.viewOnceMessage || quotedMsg.viewOnceMessageV2;
            
            if (!isVO) return m.reply("❌ *That is not a View-Once message.*");

            await m.react("⏳");

            // 4. Download Logic (Compatible with WhiskeySockets)
            const stream = await downloadContentFromMessage(mediaData, type.replace('Message', ''));
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // 5. Leak it back to the chat
            const caption = `🔓 *POPKID-MD VIEW-ONCE LEAK*\n\n` +
                            `📝 *Caption:* ${mediaData.caption || "No caption"}\n\n` +
                            `*MASTER ENGINE 2026* 🇰🇪`;

            const finalType = type.replace('Message', ''); // 'image' or 'video'
            
            await conn.sendMessage(m.from, {
                [finalType]: buffer,
                caption: caption
            }, { quoted: m });

            await m.react("✅");

        } catch (e) {
            console.error(e);
            m.reply("❌ *Error:* Failed to leak. The media might have already been opened or expired.");
        }
    }
};
