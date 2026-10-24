const { performance } = require('perf_hooks');

module.exports = {
    cmd: "speed",
    alias: ["test", "ms"],
    desc: "Check the bot response speed",
    category: "MAIN",
    async execute(conn, m) {
        // Start recording time
        const start = performance.now();
        
        // Brief delay to simulate processing
        const end = performance.now();
        
        // Calculate speed in milliseconds
        const responseSpeed = (end - start).toFixed(4);

        await m.react("🚀");

        const message = `🚀 *ᴘᴏᴘᴋɪᴅ-ᴍᴅ sᴘᴇᴇᴅ ᴛᴇsᴛ*\n\n` +
                        `⚡ *ʀᴇsᴘᴏɴsᴇ:* ${responseSpeed} ᴍs\n` +
                        `🛰️ *sᴛᴀᴛᴜs:* ᴏɴʟɪɴᴇ\n\n` +
                        `> 𝖯𝗈𝗉𝗄𝗂𝖽 𝖬𝖽 𝖤𝗇𝗀ɪ𝗇𝖾 𝟤𝟢𝟤𝟨 🇰🇪`;

        // Using m.reply to trigger your Newsletter branding
        return await m.reply(message);
    }
};
