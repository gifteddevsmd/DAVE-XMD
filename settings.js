//base by DGXeon
//recode by GIFTED DAVE 
//YouTube: @davlodavlo19


const fs = require('fs')
const chalk = require('chalk')
if (fs.existsSync('.env')) require('dotenv').config({ path: __dirname+'/.env' })


global.SESSION_ID = process.env.SESSION_ID || 'Bellah~m2xDSJAS#cXaReUMFXZBxDu0kZ8ck_cgjIEBgC2_-AUY-3go8qwM' 
//owmner v card
global.ytname = "YT: davlodavlo19" //ur yt chanel name
global.socialm = "IG: @_gifted_dave" //ur github or insta name
global.location = "Kenya" //ur location

//new
global.botname = process.env.BOT_NAME ||'DAVE-XMD' //enter your  bot name here
global.ownernumber = process.env.OWNER_NUMBER ||'254784517274' //ur owner number
global.ownername = '© GIFTEDDAVES' //ur owner name
global.websitex = "https://whatsapp.com/channel/0029VbApvFQ2Jl84lhONkc3k" //"https://chat.whatsapp.com/FCwOCmmS3unCOA5w0ehWfC?mode=r_t"
global.wagc = "https://chat.whatsapp.com/FCwOCmmS3unCOA5w0ehWfC?mode=r_t" //"https://chat.whatsapp.com/FCwOCmmS3unCOA5w0ehWfC?mode=r_t"
global.themeemoji = '🪀'
global.wm = "GIFTED DAVE"
global.botscript = 'https://whatsapp.com/channel/0029VbApvFQ2Jl84lhONkc3k' //'https://chat.whatsapp.com/FCwOCmmS3unCOA5w0ehWfC?mode=r_t' //script link
global.packname = process.env.PACK_NAME ||"DAVE-XMD" //enter your stickers author name here
global.author = "Gifted-Dave"
global.creator = "254784517274@s.whatsapp.net"
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
