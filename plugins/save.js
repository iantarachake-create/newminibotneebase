const { getContentType, downloadContentFromMessage } = require("@whiskeysockets/baileys");

// Media types the command can re-send (document, sticker, audio and voice notes included)
const MEDIA = {
    imageMessage: 'image',
    videoMessage: 'video',
    stickerMessage: 'sticker',
    audioMessage: 'audio',
    documentMessage: 'document'
};

// Peel off wrappers (view-once, disappearing chats, document-with-caption) to reach the real message
const unwrap = (msg) => {
    let cur = msg;
    for (let i = 0; i < 5 && cur; i++) {
        const next = cur.ephemeralMessage?.message
            || cur.viewOnceMessage?.message
            || cur.viewOnceMessageV2?.message
            || cur.viewOnceMessageV2Extension?.message
            || cur.documentWithCaptionMessage?.message;
        if (!next) break;
        cur = next;
    }
    return cur;
};

module.exports = {
    cmd: "save",
    alias: ["sv", "getstatus", "downloadstatus"],
    desc: "Save a replied message, status or media to your DM",
    category: "tools",
    async execute(conn, m, { isOwner }) {
        try {
            const ctx = m.message?.extendedTextMessage?.contextInfo
                || m.message?.imageMessage?.contextInfo
                || m.message?.videoMessage?.contextInfo;
            if (!ctx?.quotedMessage) return m.reply("⚠️ *Reply to a message or status first*");

            const quoted = unwrap(ctx.quotedMessage);
            const type = getContentType(quoted);
            const participant = ctx.participant || m.from;
            const sender = participant.split('@')[0].split(':')[0];

            // The owner's copy goes to their own chat, anyone else gets it in their DM
            const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
            const target = isOwner ? botJid : m.sender;

            await m.react("💾");

            const header = `📥 *Saved*\n` +
                           `👤 *From:* @${sender}\n\n`;
            const footer = `\n\n> *Popkid Md Engine* 🇰🇪`;

            // 1. Text messages / text statuses
            if (type === 'conversation' || type === 'extendedTextMessage') {
                const statusText = quoted.conversation || quoted.extendedTextMessage?.text || '';
                await conn.sendMessage(target, {
                    text: header + `📝 *Text:*\n${statusText}` + footer,
                    mentions: [participant]
                });
                await m.react("✅");
                return m.reply("✅ *Saved*");
            }

            // 2. Media (image, video, sticker, audio, voice note, document)
            const mediaType = MEDIA[type];
            if (mediaType) {
                const data = quoted[type];
                const stream = await downloadContentFromMessage(data, mediaType);
                const chunks = [];
                for await (const chunk of stream) chunks.push(chunk);
                const buffer = Buffer.concat(chunks);
                if (!buffer.length) throw new Error('download failed');

                const caption = data.caption ? `${data.caption}\n\n` : '';
                let content;
                if (mediaType === 'image' || mediaType === 'video') {
                    content = { [mediaType]: buffer, caption: header + caption.trim() + footer, mentions: [participant] };
                } else if (mediaType === 'sticker') {
                    content = { sticker: buffer };
                } else if (mediaType === 'audio') {
                    content = { audio: buffer, mimetype: data.mimetype || 'audio/ogg; codecs=opus', ptt: !!data.ptt };
                } else {
                    content = { document: buffer, mimetype: data.mimetype || 'application/octet-stream', fileName: data.fileName || 'file' };
                }

                await conn.sendMessage(target, content);
                await m.react("✅");
                return m.reply("✅ *Saved to DM*");
            }

            // 3. Anything else (contacts, locations, polls...): forward it as it is
            await conn.sendMessage(target, {
                forward: {
                    key: { remoteJid: m.from, fromMe: false, id: ctx.stanzaId, participant: ctx.participant },
                    message: ctx.quotedMessage
                }
            });
            await m.react("✅");
            return m.reply("✅ *Saved*");

        } catch (e) {
            console.error("Save Command Error:", e);
            m.reply("⚠️ *Error saving. Try again.*");
        }
    }
};
