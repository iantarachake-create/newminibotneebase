const config = require("../config");

module.exports = {
    cmd: "mode",
    alias: ["botmode", "workmode"],
    desc: "Switch between Public and Private mode",
    category: "OWNER",
    isOwner: true,
    async execute(conn, m, { text }) {
        const input = text?.toLowerCase();

        // 1. Show usage if no input
        if (input !== 'public' && input !== 'private') {
            const currentMode = config.MODE.toUpperCase();
            return m.reply(
                `✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐌𝐎𝐃𝐄* ✨\n` +
                `══════════════════\n` +
                `🌐 *ᴄᴜʀʀᴇɴᴛ ᴍᴏᴅᴇ:* ${currentMode}\n` +
                `📝 *ᴜꜱᴀɢᴇ:* .mode public/private\n` +
                `══════════════════\n` +
                `> 𝖯𝗈𝗉𝗄𝗂𝖽 𝖬𝖽 𝖤𝗇𝗀ɪɴ𝖾 🇰🇪`
            );
        }

        // 2. Process Switch
        config.MODE = input;
        process.env.MODE = input; // Ensuring real-time engine update

        await m.react(input === 'public' ? "🌍" : "🔒");

        // 3. Designer Confirmation Card
        const statusIcon = input === 'public' ? "🟢 ᴘᴜʙʟɪᴄ" : "🔴 ᴘʀɪᴠᴀᴛᴇ";
        const description = input === 'public' 
            ? "ᴀʟʟ ᴜꜱᴇʀꜱ ᴄᴀɴ ɴᴏᴡ ᴜꜱᴇ ᴛʜᴇ ʙᴏᴛ." 
            : "ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜꜱᴇ ᴛʜᴇ ʙᴏᴛ.";

        let feedback = `✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐔𝐏𝐃𝐀𝐓𝐄* ✨\n` +
                       `══════════════════\n` +
                       `✅ *ᴍᴏᴅᴇ ꜱᴡɪᴛᴄʜᴇᴅ*\n` +
                       `📊 *ꜱᴛᴀᴛᴜꜱ:* ${statusIcon}\n` +
                       `📢 *ɪɴꜰᴏ:* ${description}\n` +
                       `══════════════════\n` +
                       `> ꜱᴇᴛᴛɪɴɢꜱ ᴀᴘᴘʟɪᴇᴅ ꜱᴜᴄᴄᴇꜱꜱꜰᴜʟʟʏ 🚀`;

        return m.reply(feedback);
    }
};
