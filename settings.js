//base by DGXeon
//recode by GIFTED DAVE
//YouTube: @davlodavlo19


const fs = require('fs')
// Line 7 removed: broken require()

// Load .env if available
if (fs.existsSync('.env')) {
  require('dotenv').config({ path: __dirname + '/.env' })
}

// SESSION ID handling
global.SESSION_ID = process.env.SESSION_ID || ''

// Owner info (for vCard)
global.ytname = "YT: davlodavl19"      // Your YouTube channel
global.socialm = "IG: @gifted_dave"    // Instagram or GitHub
global.location = "Kenya"              // Your location
//new
global.botname = process.env.BOT_NAME ||' 𝐃𝐀𝐕𝐄-𝐗𝐌𝐃' //enter your  bot name here
global.ownernumber = process.env.OWNER_NUMBER ||'254104260236' //ur owner number
global.ownername = '© GIFTED DAVE' //ur owner name
global.websitex = "https://whatsapp.com/channel/0029VaPZWbY1iUxVVRIIOm0D" //"https://chat.whatsapp.com/Hs0AwkOaFzbGi5sjicdeTR"
global.wagc = "https://chat.whatsapp.com/Hs0AwkOaFzbGi5sjicdeTR" //"https://chat.whatsapp.com/Hs0AwkOaFzbGi5sjicdeTR"
global.themeemoji = '🪀'
global.wm = "GIFTED DAVE"
global.botscript = 'https://whatsapp.com/channel/0029VaPZWbY1iUxVVRIIOm0D' //'https://chat.whatsapp.com/Hs0AwkOaFzbGi5sjicdeTR' //script link
global.packname = process.env.PACK_NAME ||"DAVE-XMD" //enter your stickers author name here
global.author = "Gifted-Dave"
global.creator = "254104260236@s.whatsapp.net"
global.xprefix = process.env.BOT_PREFIX ||'.'
global.hituet = 0

//bot settings 
global.autoblocknumber = process.env.AUTOBLOCK_NUMBER || '263,234' //set autoblock country code
global.antiforeignnumber = process.env.ANTIFOREIGN_NUMBER || '' //set anti foreign number country code
global.mode = process.env.MODE || 'public' //set bot public/private
const antilinkgc = process.env.ANTILINK_GC || 'TRUE';
global.anticall = process.env.ANTI_CALL || 'false' //bot blocks user when called
global.autostatusview = process.env.AUTOSW_VIEW || 'true' //auto status/story view
global.adminevent = true //show promote/demote message
global.groupevent = process.env.GROUP_EVENT || 'false' //show update messages in group chat
//msg
const appname = process.env.APP_NAME || '';
const herokuapi = process.env.HEROKU_API;

global.mess = {
	limit: 'Your limit is up <\>',
	nsfw: 'Nsfw is disabled in this group, Please tell the admin to enable',
	owner: 'DAVE-XMD owner only<\>',
    admin: 'Bot is not admin<\>',
    group: 'feature for group only<\>',
    done: 'Done ✓',
    error: 'Error !',
    success: 'Succes •'
}
//thumbnail


let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update'${__filename}'`))
    delete require.cache[file]
    require(file)
})
	
