module.exports = {
    cmd: "getpp",
    alias: ["getprofile", "pp", "stealpp"],
    desc: "Fetch the high-resolution profile picture of a user",
    category: "tools",
    async execute(conn, m) {
        try {
            // 1. Determine the target JID
            let target;
            if (m.mentionedJid && m.mentionedJid[0]) {
                target = m.mentionedJid[0]; // From tag
            } else if (m.quoted) {
                target = m.quoted.sender; // From reply
            } else {
                target = m.from; // From the current chat/group
            }

            await m.react("🔍");

            // 2. Request the high-quality URL from WhatsApp servers
            // 'image' parameter ensures we get the full-res version, not the tiny thumbnail
            let ppUrl;
            try {
                ppUrl = await conn.profilePictureUrl(target, 'image');
            } catch (err) {
                // This happens if the user has "Nobody" in privacy or no PP set
                return m.reply("❌ *Failed to fetch PP:* Either the user has no profile picture or their privacy settings are blocking the bot.");
            }

            // 3. Send the image back with a clean caption
            const pushname = m.pushName || "User";
            await conn.sendMessage(m.from, { 
                image: { url: ppUrl }, 
                caption: `👤 *POPKID-MD PP GRABBER*\n\n🎯 *Target:* @${target.split('@')[0]}\n📥 *Requested by:* ${pushname}`,
                mentions: [target]
            }, { quoted: m });

            await m.react("✅");

        } catch (e) {
            console.error("GetPP Error:", e.message);
            m.reply("⚠️ An internal error occurred while fetching the profile picture.");
        }
    }
};
