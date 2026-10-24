const config = require("../config");

module.exports = {
    cmd: "autorecording",
    desc: "Toggle Auto Recording",
    category: "OWNER",
    isOwner: true,
    async execute(conn, m, { text }) {
        if (!text) return m.reply(`💡 *ᴜꜱᴀɢᴇ:* .autorecording on/off`);
        const status = text.toLowerCase() === 'on';
        config.AUTO_RECORDING = status ? "true" : "false";
        await m.react(status ? "✅" : "❌");
        m.reply(`✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃* ✨\n══════════════════\n✅ *ᴀᴜᴛᴏ ʀᴇᴄᴏʀᴅɪɴɢ:* ${status ? "🟢 ᴏɴ" : "🔴 ᴏꜰꜰ"}\n══════════════════`);
    }
};
