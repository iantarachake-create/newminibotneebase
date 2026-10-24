const fs = require('fs');
const path = require('path');
const emojiFile = path.join(__dirname, '../database/status_emojis.json');

module.exports = {
    cmd: "statusemoji",
    alias: ["statusreact", "setreact"],
    desc: "Set custom emojis for Auto-Status React",
    category: "owner",
    isOwner: true,
    async execute(conn, m, { text }) {
        if (!text) return m.reply("✨ *Usage:* .setemoji ❤️,🔥,⚡,🤖\n(Separate your favorite emojis with commas)");

        try {
            // 1. Create database folder if it doesn't exist
            const dbDir = path.join(__dirname, '../database');
            if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);

            // 2. Process the input: split by comma and remove spaces
            const emojiList = text.split(',').map(e => e.trim()).filter(e => e !== "");
            
            if (emojiList.length === 0) {
                return m.reply("❌ Please provide at least one valid emoji.");
            }

            // 3. Save to the JSON file
            const data = { emojis: emojiList };
            fs.writeFileSync(emojiFile, JSON.stringify(data, null, 2));

            // 4. Success feedback
            await m.react("✅");
            return m.reply(`🎯 *Status React Updated!*\n\nNew Emojis: ${emojiList.join(' ')}\n\n*POPKID-MD* will now use these for all status views.`);

        } catch (e) {
            console.error("SetEmoji Error:", e);
            return m.reply("⚠️ Error saving emojis: " + e.message);
        }
    }
};
