const config = require("../config");

module.exports = {
    cmd: "antidelete",
    alias: ["ad", "antidel"],
    desc: "Configure Anti-Delete protection",
    category: "OWNER",
    isOwner: true,
    async execute(conn, m, { text }) {
        const input = text?.toLowerCase();

        // 1. DASHBOARD VIEW (If no valid input)
        if (!['inchat', 'indm', 'false'].includes(input)) {
            const current = config.ANTIDELETE === "false" ? "🔴 ᴅɪꜱᴀʙʟᴇᴅ" : `🟢 ᴀᴄᴛɪᴠᴇ (${config.ANTIDELETE})`;
            return m.reply(
                `✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐀𝐍𝐓𝐈-𝐃𝐄𝐋𝐄𝐓𝐄* ✨\n` +
                `══════════════════════⊷\n` +
                `📊 *ᴄᴜʀʀᴇɴᴛ:* ${current}\n\n` +
                `📝 *ᴀᴠᴀɪʟᴀʙʟᴇ ꜱᴇᴛᴛɪɴɢꜱ:* \n` +
                `◦ .antidelete inchat (Sends to the group)\n` +
                `◦ .antidelete indm (Sends to your DM)\n` +
                `◦ .antidelete false (Turn off)\n` +
                `══════════════════════⊷\n` +
                `> 𝖯𝗈𝗉𝗄𝗂𝖽 𝖬𝖽 𝖤𝗇𝗀ɪɴ𝖾 🇰🇪`
            );
        }

        // 2. PROCESS TOGGLE
        config.ANTIDELETE = input;
        process.env.ANTIDELETE = input; // Real-time update

        await m.react(input === 'false' ? "❌" : "🛡️");

        // 3. DESIGNER SUCCESS CARD
        const statusIcon = input === 'false' ? "🔴 ᴅɪꜱᴀʙʟᴇᴅ" : `🟢 ᴇɴᴀʙʟᴇᴅ (${input})`;
        
        let feedback = `✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐔𝐏𝐃𝐀𝐓𝐄* ✨\n` +
                       `══════════════════\n` +
                       `✅ *ᴀɴᴛɪ-ᴅᴇʟᴇᴛᴇ ꜱᴇᴛ*\n` +
                       `📊 *ꜱᴛᴀᴛᴜꜱ:* ${statusIcon}\n` +
                       `🛡️ *ᴇɴɢɪɴᴇ:* ᴏᴘᴇʀᴀᴛɪᴏɴᴀʟ\n` +
                       `══════════════════\n` +
                       `> ꜱᴇᴛᴛɪɴɢꜱ ᴀᴘᴘʟɪᴇᴅ ꜱᴜᴄᴄᴇꜱꜱꜰᴜʟʟʏ 🚀`;

        return m.reply(feedback);
    }
};
