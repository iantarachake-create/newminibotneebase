module.exports = {
    cmd: "privacy",
    alias: ["setprivacy", "pvcy", "pri"],
    desc: "Manage WhatsApp privacy and blocklist",
    category: "owner",
    isOwner: true,
    async execute(conn, m, { args }) {
        const setting = args[0]?.toLowerCase();
        const value = args[1]?.toLowerCase();

        // ── 1. Show Main Menu ───────────────────────────────────────
        if (!setting) {
            const menu = `╔══════════════╗\n` +
                         `║🔒 *PRIVACY SETTING* ║\n` +
                         `╚══════════════╝\n` +
                         `📌 *Usage:* .pvcy <set> <val>\n\n` +
                         `────────────────────\n` +
                         `*⚙️ PRIVACY CONTROLS*\n` +
                         `👁️ *lastseen* — all | contacts | none\n` +
                         `🟢 *online* — all | match_last_seen\n` +
                         `🖼️ *profile* — all | contacts | none\n` +
                         `📊 *status* — all | contacts | none\n` +
                         `✅ *receipts* — all | none\n` +
                         `👥 *groups* — all | contacts\n\n` +
                         `*🚫 BLOCK CONTROLS*\n` +
                         `🔴 *block* — <number> or reply\n` +
                         `🟢 *unblock* — <number> or reply\n\n` +
                         `*📊 SYSTEM*\n` +
                         `📋 *blocklist* — view blocked users\n` +
                         `🔍 *status* — current settings\n` +
                         `────────────────────\n` +
                         `*𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃*`;
            return m.reply(menu);
        }

        // ── 2. Current Privacy Status ──────────────────────────────
        if (setting === 'status') {
            try {
                const s = await conn.fetchPrivacySettings(true);
                const fmt = (v) => v ? `\`${v}\`` : `\`unknown\``;
                const statusMsg = `╔═══════════════╗\n` +
                                 `║🔒 *CURRENT PRIVACY* ║\n` +
                                 `╚═══════════════╝\n\n` +
                                 `👁️ *Last Seen:* ${fmt(s.last)}\n` +
                                 `🟢 *Online:* ${fmt(s.online)}\n` +
                                 `🖼️ *Profile Pic:* ${fmt(s.profile)}\n` +
                                 `📊 *Status:* ${fmt(s.status)}\n` +
                                 `✅ *Read Receipts:* ${fmt(s.readreceipts)}\n` +
                                 `👥 *Groups Add:* ${fmt(s.groupadd)}\n\n` +
                                 `*𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃*`;
                return m.reply(statusMsg);
            } catch (e) {
                return m.reply(`❌ Failed to fetch settings: ${e.message}`);
            }
        }

        // ── 3. Block List ──────────────────────────────────────────
        if (setting === 'blocklist') {
            try {
                const list = await conn.fetchBlocklist();
                if (!list || list.length === 0) return m.reply("📋 *Block List is empty.*");
                const entries = list.map((jid, i) => `${i + 1}. @${jid.split('@')[0]}`).join('\n');
                return conn.sendMessage(m.from, { text: `🚫 *BLOCK LIST*\n\n${entries}`, mentions: list }, { quoted: m });
            } catch (e) {
                return m.reply("❌ Error fetching blocklist.");
            }
        }

        // ── 4. Block / Unblock ─────────────────────────────────────
        if (setting === 'block' || setting === 'unblock') {
            let targetJid = m.message?.extendedTextMessage?.contextInfo?.participant || 
                            m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            
            if (!targetJid && value) {
                const num = value.replace(/[^0-9]/g, '');
                if (num.length >= 7) targetJid = `${num}@s.whatsapp.net`;
            }

            if (!targetJid) return m.reply("⚠️ Tag someone, reply to a message, or provide a number.");

            try {
                await conn.updateBlockStatus(targetJid, setting);
                await m.react("✅");
                return m.reply(`✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐔𝐏𝐃𝐀𝐓𝐄* ✨\n\n✅ Target ${setting === 'block' ? 'Blocked' : 'Unblocked'} successfully.`);
            } catch (e) {
                return m.reply(`❌ Action failed: ${e.message}`);
            }
        }

        // ── 5. Privacy Updates ─────────────────────────────────────
        const privacyMap = {
            lastseen: { fn: (v) => conn.updateLastSeenPrivacy(v), allowed: ['all', 'contacts', 'contact_blacklist', 'none'], label: 'Last Seen' },
            online: { fn: (v) => conn.updateOnlinePrivacy(v), allowed: ['all', 'match_last_seen'], label: 'Online Status' },
            profile: { fn: (v) => conn.updateProfilePicturePrivacy(v), allowed: ['all', 'contacts', 'contact_blacklist', 'none'], label: 'Profile Picture' },
            status: { fn: (v) => conn.updateStatusPrivacy(v), allowed: ['all', 'contacts', 'contact_blacklist', 'none'], label: 'Status' },
            receipts: { fn: (v) => conn.updateReadReceiptsPrivacy(v), allowed: ['all', 'none'], label: 'Read Receipts' },
            groups: { fn: (v) => conn.updateGroupsAddPrivacy(v), allowed: ['all', 'contacts', 'contact_blacklist'], label: 'Groups Add' },
        };

        const config = privacyMap[setting];
        if (!config) return m.reply("❌ Unknown option. Use `.privacy` to see the menu.");
        
        if (!value || !config.allowed.includes(value)) {
            return m.reply(`❌ Invalid value. Allowed: ${config.allowed.map(v => `\`${v}\``).join(', ')}`);
        }

        try {
            await config.fn(value);
            await m.react("✅");
            return m.reply(`✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐔𝐏𝐃𝐀𝐓𝐄* ✨\n\n✅ *${config.label}* set to \`${value}\``);
        } catch (e) {
            return m.reply(`❌ Update failed: ${e.message}`);
        }
    }
};
