module.exports = {
    cmd: "newsletter",
    alias: ["channelid", "chid"],
    desc: "Get detailed information about a WhatsApp Channel",
    category: "GENERAL",

    async execute(conn, m, { text }) {
        try {
            const q = text || (m.quoted ? m.quoted.text : "");
            
            if (!q) return m.reply("❎ Please provide a WhatsApp Channel link.\n\n*Example:* .cinfo https://whatsapp.com/channel/123456789");

            const match = q.match(/whatsapp\.com\/channel\/([\w-]+)/);
            if (!match) return m.reply("⚠️ *Invalid channel link format.*");

            const inviteId = match[1];
            await m.react("📡");

            // Fetch Metadata
            let metadata;
            try {
                metadata = await conn.newsletterMetadata("invite", inviteId);
            } catch (e) {
                return m.reply("❌ Failed to fetch channel metadata. The channel might be private or the link expired.");
            }

            // --- IMPROVED DATA MAPPING ---
            // Baileys sometimes stores these inside 'thread_metadata' or direct keys
            const id = metadata.id;
            const name = metadata.name || metadata.thread_metadata?.name || "Unknown Name";
            const followers = metadata.subscribers || metadata.thread_metadata?.subscribers_count || 0;
            const creationTime = metadata.creation_time || metadata.thread_metadata?.creation_time;
            const pps = metadata.preview || metadata.thread_metadata?.picture || null;

            const infoText = `🛰️ *CHANNEL INFORMATION* 🛰️\n\n` +
                `🛠️ *ID:* ${id}\n` +
                `📌 *Name:* ${name}\n` +
                `👥 *Followers:* ${followers.toLocaleString()}\n` +
                `📅 *Created on:* ${creationTime ? new Date(creationTime * 1000).toLocaleString("en-KE") : "Unknown"}\n\n` +
                `> *ᴘᴏᴘᴋɪᴅ-ᴍᴅ ᴇɴɢɪɴᴇ* 🇰🇪`;

            // Send with Profile Picture if it exists
            if (pps) {
                const imageUrl = pps.startsWith('http') ? pps : `https://pps.whatsapp.net${pps}`;
                await conn.sendMessage(m.chat, {
                    image: { url: imageUrl },
                    caption: infoText
                }, { quoted: m });
            } else {
                await m.reply(infoText);
            }

        } catch (error) {
            console.error("❌ Error in .cinfo plugin:", error);
            m.reply("⚠️ An unexpected error occurred while fetching info.");
        }
    }
};
