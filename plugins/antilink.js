const fs = require('fs');
const path = require('path');
const settingsFile = path.join(__dirname, '../database/group_settings.json');

module.exports = {
    cmd: "antilink",
    alias: ["link", "linkmode"],
    desc: "Control the Antilink System",
    category: "group",
    isGroup: true,
    isAdmin: true, // Only you or group admins can change settings
    async execute(conn, m, { text }) {
        // Ensure database directory exists
        const dbDir = path.join(__dirname, '../database');
        if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);
        
        let settings = fs.existsSync(settingsFile) ? JSON.parse(fs.readFileSync(settingsFile)) : {};

        const mode = text.toLowerCase().trim();
        const validModes = ["off", "delete", "warn", "kick"];

        if (!validModes.includes(mode)) {
            let help = `🛡️ *POPKID-MD ANTILINK SETTINGS*\n\n`;
            help += `Current Mode: *${(settings[m.from]?.antilink || "OFF").toUpperCase()}*\n\n`;
            help += `*Usage:* .antilink [mode]\n`;
            help += `• .antilink *off*\n`;
            help += `• .antilink *delete*\n`;
            help += `• .antilink *warn*\n`;
            help += `• .antilink *kick*`;
            return m.reply(help);
        }

        // Save the setting
        settings[m.from] = { ...settings[m.from], antilink: mode };
        fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));

        await m.react("🛡️");
        m.reply(`✅ *Antilink updated to mode:* ${mode.toUpperCase()}`);
    }
};
