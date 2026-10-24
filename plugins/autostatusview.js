const config = require("../config");

module.exports = {
    cmd: "autostatusview",
    desc: "Toggle Auto Read Status",
    category: "OWNER",
    isOwner: true,
    async execute(conn, m, { text }) {
        if (!text) return m.reply(`💡 *ᴜꜱᴀɢᴇ:* .autoread on/off`);
        const status = text.toLowerCase() === 'on';
        config.AUTO_READ_STATUS = status ? "true" : "false";
        await m.react(status ? "✅" : "❌");
        m.reply(`✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃* ✨\n══════════════════\n✅ *ᴀᴜᴛᴏ ʀᴇᴀᴅ:* ${status ? "🟢 ᴏɴ" : "🔴 ᴏꜰꜰ"}\n══════════════════`);
    }
};
