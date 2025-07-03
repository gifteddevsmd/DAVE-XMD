//base by DGXeon (Xeon Bot Inc.)
//Recode by Dave 

require('./settings')
const makeWASocket = require("@whiskeysockets/baileys").default
const { uncache, nocache } = require('./lib/loader')
const { color } = require('./lib/color')
const { premium } = require('./lib/premium.js')
const NodeCache = require("node-cache")
const readline = require("readline")
const pino = require('pino')
const { Boom } = require('@hapi/boom')
const { Low, JSONFile } = require('./lib/lowdb')
const yargs = require('yargs/yargs')
const fs = require('fs')
const chalk = require('chalk')
const FileType = require('file-type')
const path = require('path')
const axios = require('axios')
const _ = require('lodash')
const { File } = require('megajs');
const moment = require('moment-timezone')
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } = require('./lib/myfunc')
const { default: BellahConnect, getAggregateVotesInPollMessage, delay, PHONENUMBER_MCC, makeCacheableSignalKeyStore, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, generateForwardMessageContent, prepareWAMessageMedia, generateWAMessageFromContent, generateMessageID, downloadContentFromMessage, makeInMemoryStore, jidDecode, proto } = require("@whiskeysockets/baileys")
const channelId = "120363257205745956@newsletter";
const store = makeInMemoryStore({
    logger: pino().child({
        level: 'silent',
        stream: 'store'
    })
})
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.db = new Low(new JSONFile(`src/database.json`))

global.DATABASE = global.db
global.loadDatabase = async function loadDatabase() {
  if (global.db.READ) return new Promise((resolve) => setInterval(function () { (!global.db.READ ? (clearInterval(this), resolve(global.db.data == null ? global.loadDatabase() : global.db.data)) : null) }, 1 * 1000))
  if (global.db.data !== null) return
  global.db.READ = true
  await global.db.read()
  global.db.READ = false
  global.db.data = {
    users: {},
    database: {},
    chats: {},
    game: {},
    settings: {},
    ...(global.db.data || {})
  }
  global.db.chain = _.chain(global.db.data)
}
loadDatabase()

if (global.db)
  setInterval(async () => {
    if (global.db.data) await global.db.write();
  }, 30 * 1000);

// Ensure Bellah.js is hot-reloaded automatically (only if it exists)
const bellahPath = './Bellah.js';
if (fs.existsSync(bellahPath)) {
  require(bellahPath);
  nocache(bellahPath, module =>
    console.log(color('[ CHANGE ]', 'green'), color(`'${module}'`, 'green'), 'Updated')
  );
} else {
  console.log(color('[ WARNING ]', 'yellow'), `'${bellahPath}' not found.`);
}

// Also hot-reload main.js if changes occur
nocache(__filename, module =>
  console.log(color('[ CHANGE ]', 'green'), color(`'${module}'`, 'green'), 'Updated')
);

//------------------------------------------------------
const phoneNumber = "254104260236";

let owner = [];
try {
  const raw = fs.readFileSync('./src/data/role/owner.json');
  owner = JSON.parse(raw);
} catch (err) {
  console.log(color('[ ERROR ]', 'red'), 'Failed to load owner.json:', err.message);
}

const pairingCode = !!phoneNumber || process.argv.includes("--pairing-code")
const useMobile = process.argv.includes("--mobile")

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

const sessionDir = path.join(__dirname, 'session')
const credsPath = path.join(sessionDir, 'creds.json')

async function downloadSessionData() {
  try {
    await fs.promises.mkdir(sessionDir, { recursive: true })

    if (!fs.existsSync(credsPath)) {
      if (!global.SESSION_ID) {
        console.log(color(`❌ Session ID not found at SESSION_ID!\n📂 creds.json not found in session folder!\n\n💬 Please wait to enter your number manually.`, 'red'))
        return
      }

      const base64Data = global.SESSION_ID.split("Dave~")[1]
      const sessionData = Buffer.from(base64Data, 'base64')

      await fs.promises.writeFile(credsPath, sessionData)
      console.log(color(`✅ Session successfully saved. Starting bot...`, 'green'))
    }
  } catch (error) {
    console.error(color('❌ Error saving session data:', 'red'), error)
  }
}

async function startBellah() {
  const { version, isLatest } = await fetchLatestBaileysVersion()
  const { state, saveCreds } = await useMultiFileAuthState('./session')
  const msgRetryCounterCache = new NodeCache()

  const Bellah = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: !pairingCode,
    mobile: useMobile,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" }))
    },
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    getMessage: async (key) => {
      let jid = Bellah.decodeJid(key.remoteJid)
      let msg = await store.loadMessage(jid, key.id)
      return msg?.message || ""
    },
    msgRetryCounterCache,
    defaultQueryTimeoutMs: undefined,
  })

  store.bind(Bellah.ev)

  // Start pairing code mode if needed
  if (pairingCode && !Bellah.authState.creds.registered) {
    if (useMobile) throw new Error('❌ Cannot use pairing code with mobile API')

    let phone = phoneNumber.replace(/[^0-9]/g, '')

    if (!Object.keys(PHONENUMBER_MCC).some(v => phone.startsWith(v))) {
      console.log(chalk.redBright("⚠️ Start with country code of your WhatsApp Number, e.g., +254xxx"))
      phone = await question(chalk.greenBright(`📞 Enter your WhatsApp number again: `))
      phone = phone.replace(/[^0-9]/g, '')
      rl.close()
    }

    // Allow user time to scan code
    setTimeout(async () => {
      let code = await Bellah.requestPairingCode(phone)
      code = code?.match(/.{1,4}/g)?.join("-") || code
      console.log(chalk.bgGreen("🔗 Your Pairing Code:"), chalk.white(code))
    }, 3000)
  }

  Bellah.ev.on('connection.update', async (update) => {
    const {
        connection,
		lastDisconnect
	} = update
try{
		if (connection === 'close') {
	let reason = new Boom(lastDisconnect?.error)?.output.statusCode
	if (reason === DisconnectReason.badSession) {
		console.log(`Bad Session File, Please Delete Session and Scan Again`);
		startBellah()
	} else if (reason === DisconnectReason.connectionClosed) {
		console.log("Connection closed, reconnecting....");
		startBellah();
	} else if (reason === DisconnectReason.connectionLost) {
		console.log("Connection Lost from Server, reconnecting...");
		startBellah();
	} else if (reason === DisconnectReason.connectionReplaced) {
		console.log("Connection Replaced, Another New Session Opened, Please Close Current Session First");
		startBellah()
	} else if (reason === DisconnectReason.loggedOut) {
		console.log(`Device Logged Out, Please Delete Session and Scan Again.`);
		startBellah();
	} else if (reason === DisconnectReason.restartRequired) {
		console.log("Restart Required, Restarting...");
		startBellah();
	} else if (reason === DisconnectReason.timedOut) {
		console.log("Connection TimedOut, Reconnecting...");
		startBellah();
	} else Bellah.end(`Unknown DisconnectReason: ${reason}|${connection}`)
}

if (update.connection == "connecting" || update.receivedPendingNotifications == "false") {
	console.log(color(`\nConnecting...`, 'white'))
}

if (update.connection == "open" || update.receivedPendingNotifications == "true") {
	console.log(color(` `, 'magenta'))
	console.log(color(`Connected to => ` + JSON.stringify(Bellah.user, null, 2), 'green'))
	await delay(1999)

	await Bellah.sendMessage(Bellah.user.id, {
		image: {
			url: "https://files.catbox.moe/em1yu3.jpg"
		},
		caption: ` DAVE-XMD connected
> Bot prefix: ${global.xprefix}

> Owner: ${global.ownernumber}

> BotName: ${global.botname}

> Total Command: 138

> Mode:  ${Bellah.public ? '𝗣𝘂𝗯𝗹𝗶𝗰 ϟ' : '𝗣𝗿𝗶𝘃𝗮𝘁𝗲 ϟ'}

*Follow support for updates*
https://whatsapp.com/channel/0029VbApvFQ2Jl84lhONkc3k

*Join Group*
https://chat.whatsapp.com/CaPeB0sVRTrL3aG6asYeAC

> Enjoy 😍`
	})

	await Bellah.newsletterFollow(channelId)

	const CFonts = require('cfonts')
	CFonts.say('DAVE-XMD', {
		font: 'tiny',
		align: 'left',
		colors: ['blue', 'white'],
		background: 'transparent',
		letterSpacing: 1,
		lineHeight: 1,
		space: true,
		maxLength: '0'
	})

	console.log(color(`\n${global.themeemoji} YT CHANNEL: @davlodavlo19`, 'magenta'))
	console.log(color(`${global.themeemoji} GITHUB: gifteddaves`, 'magenta'))
	console.log(color(`${global.themeemoji} INSTAGRAM: gifted_dave`, 'magenta'))
	console.log(color(`${global.themeemoji} WA NUMBER: ${global.owner}`, 'magenta'))
	console.log(color(`${global.themeemoji} RECODE: ${global.wm}\n`, 'magenta'))

	await delay(2000)
	Bellah.groupAcceptInvite("CaPeB0sVRTrL3aG6asYeAC")
	console.log('> Bot is Connected< [ ! ]')
   }
	
} catch (err) {
	console.log('Error in Connection.update: ' + err);
	startBellah();
}
});

Bellah.ev.on('creds.update', saveCreds);

Bellah.ev.on('messages.upsert', () => {});

//------------------------------------------------------



	            



    
// Auto status view
Bellah.ev.on('messages.upsert', async (chatUpdate) => {
  if (global.autostatusview) {
    try {
      if (!chatUpdate.messages || chatUpdate.messages.length === 0) return;
      const mek = chatUpdate.messages[0];

      if (!mek.message) return;
      mek.message = Object.keys(mek.message)[0] === 'ephemeralMessage'
        ? mek.message.ephemeralMessage.message
        : mek.message;

      if (mek.key && mek.key.remoteJid === 'status@broadcast') {
        const emoji = ["😂", "❤️", "🌚", "😍", "😭"];
        const sigma = emoji[Math.floor(Math.random() * emoji.length)];
        await Bellah.readMessages([mek.key]);
        Bellah.sendMessage(
          'status@broadcast',
          { react: { text: sigma, key: mek.key } },
          { statusJidList: [mek.key.participant] }
        );
      }

    } catch (err) {
      console.error('AutoStatusView Error:', err);
    }
  }
});

// Admin promote/demote events
Bellah.ev.on('group-participants.update', async (anu) => {
  if (global.adminevent) {
    console.log(anu);
    try {
      let participants = anu.participants;
      for (let num of participants) {
        try {
          ppuser = await Bellah.profilePictureUrl(num, 'image');
        } catch (err) {
          ppuser = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png?q=60';
        }

        try {
          ppgroup = await Bellah.profilePictureUrl(anu.id, 'image');
        } catch (err) {
          ppgroup = 'https://i.ibb.co/RBx5SQC/avatar-group-large-v2.png?q=60';
        }

        if (anu.action === 'promote') {
          const xeontime = moment.tz('Africa/Nairobi').format('HH:mm:ss');
          const xeondate = moment.tz('Africa/Nairobi').format('DD/MM/YYYY');
          let xeonName = num;
          let xeonbody = ` 𝗖𝗼𝗻𝗴𝗿𝗮𝘁𝘀🎉 @${xeonName.split("@")[0]}, you have been *promoted* to *admin* 🥳`;

          Bellah.sendMessage(anu.id, {
            text: xeonbody,
            contextInfo: {
              mentionedJid: [num],
              externalAdReply: {
                showAdAttribution: true,
                containsAutoReply: true,
                title: `${global.botname}`,
                body: `${ownername}`,
                previewType: "PHOTO",
                thumbnailUrl: '',
                thumbnail: '',
                sourceUrl: `${wagc}`
              }
            }
          });

        } else if (anu.action === 'demote') {
          const xeontime = moment.tz('Asia/Kolkata').format('HH:mm:ss');
          const xeondate = moment.tz('Asia/Kolkata').format('DD/MM/YYYY');
          let xeonName = num;
Bellah.sendMessage(anu.id, {
          text: xeonbody,
          contextInfo: {
            mentionedJid: [num],
            externalAdReply: {
              showAdAttribution: true,
              containsAutoReply: true,
              title: `${global.botname}`,
              body: `${ownername}`,
              previewType: "PHOTO",
              thumbnailUrl: '',
              thumbnail: '',
              sourceUrl: `${wagc}`
            }
          }
        });
      }
    }
  } catch (err) {
    console.log('Admin event error:', err);
  }
});

// Group message listener
Bellah.ev.on('messages.upsert', async (chatUpdate) => {
  try {
    mek = chatUpdate.messages[0];
    if (!mek.message) return;

    mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage')
      ? mek.message.ephemeralMessage.message
      : mek.message;

    if (mek.key && mek.key.remoteJid === 'status@broadcast') return;
    if (!Bellah.public && !mek.key.fromMe && chatUpdate.type === 'notify') return;
    if (mek.key.id.startsWith('Xeon') && mek.key.id.length === 16) return;
    if (mek.key.id.startsWith('BAE5')) return;

    m = smsg(Bellah, mek, store);
    require("./Bellah")(Bellah, m, chatUpdate, store);
  } catch (err) {
    console.log('Message event error:', err);
  }
});

   
    Bellah.decodeJid = (jid) => {
  if (!jid) return jid;
  if (/:\d+@/gi.test(jid)) {
    let decode = jidDecode(jid) || {};
    return decode.user && decode.server && `${decode.user}@${decode.server}` || jid;
  } else return jid;
};

Bellah.ev.on('contacts.update', update => {
  for (let contact of update) {
    let id = Bellah.decodeJid(contact.id);
    if (store && store.contacts)
      store.contacts[id] = { id, name: contact.notify };
  }
});

Bellah.getName = (jid, withoutContact = false) => {
  const id = Bellah.decodeJid(jid);
  withoutContact = Bellah.withoutContact || withoutContact;
  let v;
  if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
    v = store.contacts[id] || {};
    if (!(v.name || v.subject)) v = await Bellah.groupMetadata(id) || {};
    resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'));
  });
  v = id === '0@s.whatsapp.net' ? { id, name: 'WhatsApp' } :
      id === Bellah.decodeJid(Bellah.user.id) ? Bellah.user :
      (store.contacts[id] || {});
  return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international');
};

Bellah.sendContact = async (jid, kon, quoted = '', opts = {}) => {
  let list = [];
  for (let i of kon) {
    list.push({
      displayName: await Bellah.getName(i),
      vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await Bellah.getName(i)}\nFN:${await Bellah.getName(i)}\nitem1.TEL;waid=${i.split('@')[0]}:${i.split('@')[0]}\nitem1.X-ABLabel:Mobile\nEND:VCARD`
    });
  }
  Bellah.sendMessage(jid, { contacts: { displayName: `${list.length} Contact`, contacts: list }, ...opts }, { quoted });
};

Bellah.public = true;
Bellah.serializeM = (m) => smsg(Bellah, m, store);

Bellah.sendText = (jid, text, quoted = '', options = {}) =>
  Bellah.sendMessage(jid, { text, ...options }, { quoted, ...options });

Bellah.sendImage = async (jid, path, caption = '', quoted = '', options = {}) => {
  let buffer = Buffer.isBuffer(path)
    ? path
    : /^data:.*?\/.*?;base64,/i.test(path)
    ? Buffer.from(path.split(',')[1], 'base64')
    : /^https?:\/\//.test(path)
    ? await getBuffer(path)
    : fs.existsSync(path)
    ? fs.readFileSync(path)
    : Buffer.alloc(0);
  return await Bellah.sendMessage(jid, { image: buffer, caption, ...options }, { quoted });
};

Bellah.sendTextWithMentions = async (jid, text, quoted, options = {}) =>
  Bellah.sendMessage(jid, {
    text,
    mentions: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net'),
    ...options
  }, { quoted });

Bellah.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
  let buff = Buffer.isBuffer(path)
    ? path
    : /^data:.*?\/.*?;base64,/i.test(path)
    ? Buffer.from(path.split(',')[1], 'base64')
    : /^https?:\/\//.test(path)
    ? await getBuffer(path)
    : fs.existsSync(path)
    ? fs.readFileSync(path)
    : Buffer.alloc(0);
  let buffer = options?.packname || options?.author
    ? await writeExifImg(buff, options)
    : await imageToWebp(buff);
  await Bellah.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
  fs.unlinkSync(buffer);
};

Bellah.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
  let buff = Buffer.isBuffer(path)
    ? path
    : /^data:.*?\/.*?;base64,/i.test(path)
    ? Buffer.from(path.split(',')[1], 'base64')
    : /^https?:\/\//.test(path)
    ? await getBuffer(path)
    : fs.existsSync(path)
    ? fs.readFileSync(path)
    : Buffer.alloc(0);
  let buffer = options?.packname || options?.author
    ? await writeExifVid(buff, options)
    : await videoToWebp(buff);
  await Bellah.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
  return buffer;
};

Bellah.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
  const quoted = message.msg ? message.msg : message;
  const mime = (message.msg || message).mimetype || '';
  const messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
  const stream = await downloadContentFromMessage(quoted, messageType);
  let buffer = Buffer.from([]);
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }
  const type = await FileType.fromBuffer(buffer);
  const trueFileName = attachExtension ? `${filename}.${type.ext}` : filename;
  fs.writeFileSync(trueFileName, buffer);
  return trueFileName;
};

Bellah.copyNForward = async (jid, message, forceForward = false, options = {}) => {
  if (options.readViewOnce) {
    let vtype = Object.keys(message.message.viewOnceMessage.message)[0];
    message.message = message.message.viewOnceMessage.message;
    delete message.message[vtype].viewOnce;
  }
  let mtype = Object.keys(message.message)[0];
  let content = await generateForwardMessageContent(message, forceForward);
  let ctype = Object.keys(content)[0];
  let context = mtype !== "conversation" ? message.message[mtype].contextInfo : {};
  content[ctype].contextInfo = { ...context, ...content[ctype].contextInfo };
  const waMessage = await generateWAMessageFromContent(jid, content, {
    ...content[ctype],
    ...options,
    ...(options.contextInfo ? { contextInfo: { ...content[ctype].contextInfo, ...options.contextInfo } } : {})
  });
  await Bellah.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id });
  return waMessage;
};

Bellah.sendPoll = (jid, name = '', values = [], selectableCount = 1) =>
  Bellah.sendMessage(jid, { poll: { name, values, selectableCount } });

Bellah.parseMention = (text = '') => {
  return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net');
};

Bellah.downloadMediaMessage = async (message) => {
  const mime = (message.msg || message).mimetype || '';
  const messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
  const stream = await downloadContentFromMessage(message, messageType);
  let buffer = Buffer.from([]);
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }
  return buffer;
};

return Bellah;
}

//--------------------- Session Bootstrapping -----------------------

async function tylor() {
  if (fs.existsSync(credsPath)) {
    console.log(color("Session file found, starting bot...", 'yellow'));
    await startBellah();
  } else {
    const sessionDownloaded = await downloadSessionData();
    if (sessionDownloaded) {
      console.log("Session downloaded, starting bot.");
      await startBellah();
    } else {
      if (!fs.existsSync(credsPath)) {
        if (!global.SESSION_ID) {
          console.log(color("Please wait for a few seconds to enter your number!", 'red'));
          await startBellah();
        }
      }
    }
  }
}

tylor();

//------------------- Global Error Catching --------------------------

process.on('uncaughtException', function (err) {
  let e = String(err);
  if (
    e.includes("conflict") ||
    e.includes("Socket connection timeout") ||
    e.includes("not-authorized") ||
    e.includes("already-exists") ||
    e.includes("rate-overlimit") ||
    e.includes("Connection Closed") ||
    e.includes("Timed Out") ||
    e.includes("Value not found")
  ) return;
  console.log('Caught exception: ', err);
});});
}
});
}
