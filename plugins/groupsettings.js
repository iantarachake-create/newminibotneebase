const { isBotAdmin, isSenderAdmin } = require('../lib/utils');

module.exports = {
    cmd: "gcset",
    alias: ["gsetting", "groupset", "gpset"],
    desc: "Change group settings (lock/unlock messages or info)",
    category: "admin",
    isGroup: true,
    async execute(conn, m, { args, isOwner }) {
        try {
            // 1. Permission Checks using your utils
            if (!await isBotAdmin(conn, m.from)) {
                return m.reply("❌ *Error:* I need Admin rights to change settings.");
            }
            if (!isOwner && !await isSenderAdmin(conn, m.from, m.sender)) {
                return m.reply("❌ *Restricted:* Only Group Admins or the Owner can use this.");
            }

            const setting = args[0]?.toLowerCase();

            // 2. Help Menu if no setting is provided
            if (!setting) {
                const menu = `╔════════════════╗\n` +
                             `║⚙️ *GROUP SETTINGS* ║\n` +
                             `╚════════════════╝\n\n` +
                             `📌 *Usage:* .gcset <option>\n\n` +
                             `────────────────────\n` +
                             `*💬 MESSAGE PERMISSIONS*\n` +
                             `🔒 *lock* — Only admins can send messages\n` +
                             `🔓 *unlock* — Everyone can send messages\n\n` +
                             `*🛠️ SETTINGS PERMISSIONS*\n` +
                             `🔒 *lockset* — Only admins can edit group info\n` +
                             `🔓 *unlockset* — Everyone can edit group info\n` +
                             `────────────────────\n` +
                             `*𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃*`;
                return m.reply(menu);
            }

            // 3. Settings Mapping
            const settingsMap = {
                lock: { value: 'announcement', label: '🔒 Only admins can send messages' },
                unlock: { value: 'not_announcement', label: '🔓 Everyone can send messages' },
                lockset: { value: 'locked', label: '🔒 Only admins can edit group info' },
                unlockset: { value: 'unlocked', label: '🔓 Everyone can edit group info' },
            };

            const config = settingsMap[setting];

            if (!config) {
                return m.reply(`❌ Unknown setting: *${setting}*\n\nUse *.gcset* to see valid options.`);
            }

            // 4. Update the setting & React
            await conn.groupSettingUpdate(m.from, config.value);
            await m.react("✅");

            const successText = `✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐔𝐏𝐃𝐀𝐓𝐄* ✨\n\n` +
                                `⚙️ *Setting:* Group Permissions\n` +
                                `✅ *Status:* ${config.label}\n\n` +
                                `> *Mission Completed* 🛡️`;

            return m.reply(successText);

        } catch (e) {
            console.error('[GCSET ERROR]:', e);
            return m.reply("❌ *Action Failed*");
        }
    }
};
