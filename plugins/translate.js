/**
 * NEEBASE Plugin: Multi-API Translator
 * Base: Master Engine 2026
 * Features: Triple Fallback (Google, MyMemory, Dreaded)
 */

module.exports = {
    cmd: 'translate',
    alias: ['trt'],
    category: 'tools',
    description: 'Translate text to the specified language.',
    execute: async (sock, m, context) => {
        // Mapping NEEBASE context to your handler
        const { text, args } = context;
        const msgArgs = text ? text.split(' ') : args;
        
        const pluginContext = {
            chatId: m.chat,
            ...context
        };

        return await handler(sock, m, msgArgs, pluginContext);
    }
};

async function handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    try {
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('composing', chatId);

        let textToTranslate = '';
        let lang = '';

        // Checking for quoted message (reply)
        const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (quotedMessage) {
            textToTranslate = quotedMessage.conversation ||
                quotedMessage.extendedTextMessage?.text ||
                quotedMessage.imageMessage?.caption ||
                quotedMessage.videoMessage?.caption ||
                '';
            lang = args[0]?.trim();
        } else {
            if (args.length < 2) {
                return await sock.sendMessage(chatId, {
                    text: `*🌍 NEEBASE TRANSLATOR*\n\n*Usage:*\n1. Reply to a message: \`.trt <lang>\` \n2. Direct type: \`.trt <text> <lang>\` \n\n*Example:* \`.trt hello fr\`\n\n*Codes:* fr, es, de, it, pt, ru, ja, ko, zh, ar, hi`,
                }, { quoted: message });
            }
            lang = args.pop();
            textToTranslate = args.join(' ');
        }

        if (!textToTranslate) {
            return await sock.sendMessage(chatId, {
                text: '❌ No text found to translate. Please provide text or reply to a message.',
            }, { quoted: message });
        }

        let translatedText = null;

        // --- API 1: GOOGLE (GTX) ---
        try {
            const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(textToTranslate)}`);
            if (response.ok) {
                const data = await response.json();
                if (data && data[0] && data[0][0] && data[0][0][0]) {
                    translatedText = data[0][0][0];
                }
            }
        } catch (e) { /* Fallback */ }

        // --- API 2: MYMEMORY ---
        if (!translatedText) {
            try {
                const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=auto|${lang}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.responseData && data.responseData.translatedText) {
                        translatedText = data.responseData.translatedText;
                    }
                }
            } catch (e) { /* Fallback */ }
        }

        // --- API 3: DREADED ---
        if (!translatedText) {
            try {
                const response = await fetch(`https://api.dreaded.site/api/translate?text=${encodeURIComponent(textToTranslate)}&lang=${lang}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.translated) {
                        translatedText = data.translated;
                    }
                }
            } catch (e) { /* Fallback */ }
        }

        if (!translatedText) {
            throw new Error('All translation APIs failed');
        }

        // Sending the final result
        await sock.sendMessage(chatId, {
            text: `*✅ Translation (${lang}):*\n\n${translatedText}`,
        }, { quoted: message });

    } catch (error) {
        console.error('❌ Error in translate command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Failed to translate text. Please try again later.\n\nUsage: .trt <text> <lang>',
        }, { quoted: message });
    }
}
