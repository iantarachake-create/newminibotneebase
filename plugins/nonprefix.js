const config = require("../config");

module.exports = {
    cmd: "nonprefix",
    desc: "Toggle Non-Prefix Mode",
    category: "OWNER",
    isOwner: true,
    async execute(conn, m, { text }) {
        if (!text) return m.reply(`💡 *ᴜꜱᴀɢᴇ:* .nonprefix on/off`);
        const status = text.toLowerCase() === 'on';
        config.NON_PREFIX = status ? "true" : "false";
        await m.react(status ? "✅" : "❌");
        m.reply(`✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃* ✨\n══════════════════\n✅ *ɴᴏɴ-ᴘʀᴇꜰɪx:* ${status ? "🟢 ᴏɴ" : "🔴 ᴏꜰꜰ"}\n══════════════════`);
    }
};
