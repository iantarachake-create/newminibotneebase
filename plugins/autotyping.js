const config = require("../config");

module.exports = {
    cmd: "autotyping",
    desc: "Toggle Auto Typing",
    category: "OWNER",
    isOwner: true,
    async execute(conn, m, { text }) {
        if (!text) return m.reply(`💡 *ᴜꜱᴀɢᴇ:* .autotyping on/off`);
        const status = text.toLowerCase() === 'on';
        config.AUTO_TYPING = status ? "true" : "false";
        await m.react(status ? "✅" : "❌");
        m.reply(`✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃* ✨\n══════════════════\n✅ *ᴀᴜᴛᴏ ᴛʏᴘɪɴɢ:* ${status ? "🟢 ᴏɴ" : "🔴 ᴏꜰꜰ"}\n══════════════════`);
    }
};
