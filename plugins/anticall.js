const config = require("../config");

module.exports = {
    cmd: "anticall",
    alias: ["blockcall", "callreject"],
    desc: "Toggle Auto-Reject for incoming calls",
    category: "OWNER",
    isOwner: true,
    async execute(conn, m, { text }) {
        const input = text?.toLowerCase();

        // 1. DASHBOARD VIEW (If no on/off specified)
        if (input !== 'on' && input !== 'off') {
            const current = config.ANTICALL === "true" ? "🟢 ᴇɴᴀʙʟᴇᴅ" : "🔴 ᴅɪꜱᴀʙʟᴇᴅ";
            return m.reply(
                `✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐀𝐍𝐓𝐈𝐂𝐀𝐋𝐋* ✨\n` +
                `══════════════════⊷\n` +
                `📊 *ꜱᴛᴀᴛᴜꜱ:* ${current}\n` +
                `📝 *ᴜꜱᴀɢᴇ:* .anticall on/off\n` +
                `══════════════════⊷\n` +
                `> 𝖯𝗈𝗉𝗄𝗂𝖽 𝖬𝖽 𝖤𝗇𝗀ɪɴ𝖾 🇰🇪`
            );
        }

        // 2. PROCESS TOGGLE
        const value = input === 'on' ? "true" : "false";
        config.ANTICALL = value;
        process.env.ANTICALL = value; // Update environment for real-time logic

        await m.react(input === 'on' ? "🚫" : "✅");

        // 3. SUCCESS CARD
        const statusLabel = input === 'on' ? "🟢 ᴇɴᴀʙʟᴇᴅ" : "🔴 ᴅɪꜱᴀʙʟᴇᴅ";
        const infoMsg = input === 'on' 
            ? "ᴀʟʟ ɪɴᴄᴏᴍɪɴɢ ᴄᴀʟʟꜱ ᴡɪʟʟ ʙᴇ ʀᴇᴊᴇᴄᴛᴇᴅ." 
            : "ɪɴᴄᴏᴍɪɴɢ ᴄᴀʟʟꜱ ᴀʀᴇ ɴᴏᴡ ᴀʟʟᴏᴡᴇᴅ.";

        let feedback = `✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐔𝐏𝐃𝐀𝐓𝐄* ✨\n` +
                       `══════════════════\n` +
                       `✅ *ᴀɴᴛɪ-ᴄᴀʟʟ ꜱᴇᴛ*\n` +
                       `📊 *ꜱᴛᴀᴛᴜꜱ:* ${statusLabel}\n` +
                       `📢 *ɪɴꜰᴏ:* ${infoMsg}\n` +
                       `══════════════════\n` +
                       `> ꜱᴇᴛᴛɪɴɢꜱ ᴀᴘᴘʟɪᴇᴅ ꜱᴜᴄᴄᴇꜱꜱꜰᴜʟʟʏ 🚀`;

        return m.reply(feedback);
    }
};
