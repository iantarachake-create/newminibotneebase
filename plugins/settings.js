const config = require("../config");

module.exports = {
    cmd: "settings",
    alias: ["status", "panel"],
    desc: "Engine configuration",
    category: "OWNER",
    isOwner: true,
    async execute(conn, m) {
        // All settings grouped together
        const engine = [
            { name: "ʙᴏᴛ ᴍᴏᴅᴇ", val: config.MODE.toUpperCase() },
            { name: "ᴀɴᴛɪ-ᴅᴇʟᴇᴛᴇ", val: config.ANTIDELETE.toUpperCase() },
            { name: "ᴀᴜᴛᴏ ʀᴇᴀᴅ ꜱᴛᴀᴛᴜꜱ", val: config.AUTO_READ_STATUS === "true" ? "🟢 ᴏɴ" : "🔴 ᴏꜰꜰ" },
            { name: "ᴀᴜᴛᴏ ʀᴇᴀᴄᴛ ꜱᴛᴀᴛᴜꜱ", val: config.AUTO_REACT_STATUS === "true" ? "🟢 ᴏɴ" : "🔴 ᴏꜰꜰ" },
            { name: "ᴀᴜᴛᴏ ᴛʏᴘɪɴɢ", val: config.AUTO_TYPING === "true" ? "🟢 ᴏɴ" : "🔴 ᴏꜰꜰ" },
            { name: "ᴀᴜᴛᴏ ʀᴇᴄᴏʀᴅɪɴɢ", val: config.AUTO_RECORDING === "true" ? "🟢 ᴏɴ" : "🔴 ᴏꜰꜰ" },
            { name: "ᴀᴜᴛᴏ ʙɪᴏ", val: config.AUTO_BIO === "true" ? "🟢 ᴏɴ" : "🔴 ᴏꜰꜰ" },
            { name: "ᴀᴜᴛᴏ ʀᴇᴀᴄᴛ", val: config.AUTO_REACT === "true" ? "🟢 ᴏɴ" : "🔴 ᴏꜰꜰ" },
            { name: "ɴᴏɴ-ᴘʀᴇꜰɪx ᴍᴏᴅᴇ", val: config.NON_PREFIX === "true" ? "🟢 ᴏɴ" : "🔴 ᴏꜰꜰ" },
            { name: "ᴀʟᴡᴀʏꜱ ᴏɴʟɪɴᴇ", val: config.ALWAYS_ONLINE === "true" ? "🟢 ᴏɴ" : "🔴 ᴏꜰꜰ" }
        ];

        let dashboard = `╭══════════════════⊷\n` +
                        `║   ✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃* ✨\n` +
                        `╠══════════════════⊷\n` +
                        `║ 👤 *ᴏᴡɴᴇʀ:* ${config.OWNER_NAME}\n` +
                        `╰══════════════════⊷\n\n`;

        engine.forEach((feat) => {
            dashboard += ` ◦ *${feat.name}:* ${feat.val}\n`;
        });

        dashboard += `\n══════════════════⊷\n` +
                     `> 𝖯𝗈𝗉𝗄𝗂𝖽 𝖬𝖽 𝖤𝗇𝗀ɪɴ𝖾 𝟤𝟢𝟤𝟨 🇰🇪`;

        await m.react("⚙️");
        await conn.sendMessage(m.from, { text: dashboard }, { quoted: m });
    }
};
