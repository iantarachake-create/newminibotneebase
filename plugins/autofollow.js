// New (not part of the original NEEBASE): lets each user switch the one-time channel follow off or on.
const { current } = require('../lib/context');

module.exports = {
    cmd: "autofollow",
    desc: "Follow the bot's WhatsApp channel on/off",
    category: "OWNER",
    isOwner: true,
    async execute(conn, m, { text }) {
        const session = current()?.session;
        if (!session) return m.reply("❌ Session not ready.");
        const v = (text || '').toLowerCase();
        if (v !== 'on' && v !== 'off') {
            return m.reply(`💡 *Usage:* .autofollow on/off\nCurrently: ${session.settings.autoFollow ? '🟢 ON' : '🔴 OFF'}`);
        }
        session.settings.autoFollow = v === 'on';
        session.save();
        if (v === 'on') require('../lib/channel').followAll(conn, session).catch(() => {});
        return m.reply(`✅ Auto-follow channel: ${v.toUpperCase()}`);
    }
};
