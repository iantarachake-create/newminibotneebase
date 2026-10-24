const config = require("../config");

module.exports = {
    cmd: "autostatusreact",
    desc: "Toggle Auto React Status",
    category: "OWNER",
    isOwner: true,
    async execute(conn, m, { text }) {
        if (!text) return m.reply(`💡 *ᴜꜱᴀɢᴇ:* .autoreact on/off`);
        const status = text.toLowerCase() === 'on';
        config.AUTO_REACT_STATUS = status ? "true" : "false";
        await m.react(status ? "✅" : "❌");
        m.reply(`✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃* ✨\n══════════════════\n✅ *ᴀᴜᴛᴏ ʀᴇᴀᴄᴛ:* ${status ? "🟢 ᴏɴ" : "🔴 ᴏꜰꜰ"}\n══════════════════`);
    }
};
