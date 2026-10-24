const fs = require('fs')
const path = require('path')

// --- Safety Wrapper for Folders ---
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

// ── Format helpers ────────────────────────
const formatUptime = (seconds) => {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const parts = []
  if (d) parts.push(`${d}d`)
  if (h) parts.push(`${h}h`)
  if (m) parts.push(`${m}m`)
  parts.push(`${s}s`)
  return parts.join(' ')
}

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const getNairobiTime = () => {
  return new Date().toLocaleString('en-KE', {
    timeZone: 'Africa/Nairobi',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const randItem = (arr) => arr[Math.floor(Math.random() * arr.length)]
const isValidJid = (jid) => /^\d+@(s\.whatsapp\.net|g\.us)$/.test(jid)

const jidToNum = (jid) => {
  if (!jid) return ''
  return jid.replace(/:[0-9]+/, '').replace(/@.+/, '')
}

const numToJid = (num) => {
  const clean = num.replace(/[^0-9]/g, '')
  return `${clean}@s.whatsapp.net`
}

const extractJidForms = (jid) => {
  if (!jid) return { full: '', base: '', numeric: '' }
  const full    = jid
  const base    = jid.includes('@') ? jid.split('@')[0] : jid
  const numeric = base.includes(':') ? base.split(':')[0] : base
  return { full, base, numeric }
}

// ── THE MASTER ADMIN CHECKS (VANGUARD LOGIC) ──
const isBotAdmin = async (sock, groupJid) => {
  try {
    const meta = await sock.groupMetadata(groupJid)
    const participants = meta.participants || []
    const bot    = extractJidForms(sock.user?.id  || '')
    const botLid = extractJidForms(sock.user?.lid || '')

    return participants.some(p => {
      const pId  = extractJidForms(p.id  || '')
      const pLid = extractJidForms(p.lid || '')
      const isBot = (
        bot.full      === pId.full      ||
        bot.full      === pLid.full     ||
        botLid.full   === pLid.full     ||
        botLid.numeric === pLid.numeric ||
        botLid.base   === pLid.numeric  ||
        bot.numeric   === pId.numeric   ||
        bot.numeric   === pLid.numeric  ||
        bot.numeric   === (p.phoneNumber ? p.phoneNumber.split('@')[0] : '')
      )
      return isBot && (p.admin === 'admin' || p.admin === 'superadmin')
    })
  } catch { return false }
}

const isSenderAdmin = async (sock, groupJid, senderJid) => {
  try {
    const meta = await sock.groupMetadata(groupJid)
    const participants = meta.participants || []
    const sender = extractJidForms(senderJid)

    return participants.some(p => {
      const pId  = extractJidForms(p.id  || '')
      const pLid = extractJidForms(p.lid || '')
      const match = (
        sender.full    === pId.full     ||
        sender.full    === pLid.full    ||
        sender.numeric === pId.numeric  ||
        sender.numeric === pLid.numeric ||
        sender.base    === pId.numeric  ||
        sender.numeric === (p.phoneNumber ? p.phoneNumber.split('@')[0] : '')
      )
      return match && (p.admin === 'admin' || p.admin === 'superadmin')
    })
  } catch { return false }
}

// ── Group Store Helpers (Safe Version) ──
const getGroupSettings = (groupId) => {
  try {
    const file = path.join(__dirname, '..', 'groupstore', groupId, 'groupsettings.json')
    if (!fs.existsSync(file)) return {}
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch { return {} }
}

const saveGroupSettings = (groupId, settings) => {
  try {
    const dir = path.join(__dirname, '..', 'groupstore', groupId)
    ensureDir(dir)
    const file = path.join(dir, 'groupsettings.json')
    const existing = getGroupSettings(groupId)
    fs.writeFileSync(file, JSON.stringify({ ...existing, ...settings }, null, 2))
    return true
  } catch { return false }
}

const getWarns = (groupId) => {
  try {
    const file = path.join(__dirname, '..', 'groupstore', groupId, 'warns.json')
    if (!fs.existsSync(file)) return {}
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch { return {} }
}

const saveWarns = (groupId, data) => {
  try {
    const dir = path.join(__dirname, '..', 'groupstore', groupId)
    ensureDir(dir)
    fs.writeFileSync(path.join(dir, 'warns.json'), JSON.stringify(data, null, 2))
    return true
  } catch { return false }
}

const addWarn = (groupId, userNum, reason = 'violation') => {
  const data = getWarns(groupId)
  if (!data[userNum]) data[userNum] = { count: 0, reasons: [] }
  data[userNum].count++
  data[userNum].reasons.push(reason)
  saveWarns(groupId, data)
  return data[userNum].count
}

const getWarnCount = (groupId, userNum) => {
  const data = getWarns(groupId)
  return data[userNum]?.count || 0
}

const resetWarns = (groupId, userNum) => {
  const data = getWarns(groupId)
  delete data[userNum]
  saveWarns(groupId, data)
}

const getEconomy = () => {
  try {
    const file = path.join(__dirname, '..', 'data', 'economy.json')
    if (!fs.existsSync(file)) return {}
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch { return {} }
}

const saveEconomy = (data) => {
  try {
    ensureDir(path.join(__dirname, '..', 'data'))
    const file = path.join(__dirname, '..', 'data', 'economy.json')
    fs.writeFileSync(file, JSON.stringify(data, null, 2))
    return true
  } catch { return false }
}

const isSingleEmoji = (str) => {
  const blocked = ['❤️‍🩹', '❤️‍🔥', '👋🏾', '🤲🏾']
  if (blocked.some(e => str.includes(e))) return false
  const segments = [...new Intl.Segmenter().segment(str)]
  return segments.length === 1
}

const mentionUser = (jid) => `@${jidToNum(jid)}`

module.exports = {
  formatUptime, formatBytes, getNairobiTime, sleep, randInt, randItem,
  isValidJid, jidToNum, numToJid, extractJidForms, isBotAdmin, isSenderAdmin,
  getGroupSettings, saveGroupSettings, getWarns, saveWarns, addWarn,
  getWarnCount, resetWarns, getEconomy, saveEconomy, isSingleEmoji, mentionUser
}
