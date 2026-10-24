const config = require("../config");

module.exports = {
    cmd: "autobio",
    desc: "Toggle Auto Bio",
    category: "OWNER",
    isOwner: true,
    async execute(conn, m, { text }) {
        if (!text) return m.reply(`💡 *ᴜꜱᴀɢᴇ:* .autobio on/off`);
        const status = text.toLowerCase() === 'on';
        config.AUTO_BIO = status ? "true" : "false";
        await m.react(status ? "✅" : "❌");
        m.reply(`✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃* ✨\n══════════════════\n✅ *ᴀᴜᴛᴏ ʙɪᴏ:* ${status ? "🟢 ᴏɴ" : "🔴 ᴏꜰꜰ"}\n══════════════════`);
    }
};
