// base by DGXeon
// modified and maintained by Dave (https://github.com/gifteddaves/DAVE-XMD)

const fs = require('fs');
const { color } = require('./color');

/**
 * Uncaches a required module to allow for live reload
 * @param {string} module - Path to the module
 */
async function uncache(module = '.') {
    return new Promise((resolve, reject) => {
        try {
            delete require.cache[require.resolve(module)];
            resolve();
        } catch (e) {
            reject(e);
        }
    });
}

/**
 * Watches a file and reloads it on change
 * @param {string} module - Path to the module
 * @param {function} cb - Callback when reloaded
 */
async function nocache(module, cb = () => {}) {
    console.log(color('Module', 'blue'), color(`'${module} is up to date!'`, 'cyan'));
    fs.watchFile(require.resolve(module), async () => {
        await uncache(require.resolve(module));
        cb(module);
    });
}

// ✅ Auto-load and hot-reload Bellah.js
try {
    const bellahPath = require.resolve('../Bellah.js');
    require(bellahPath);
    nocache(bellahPath, (module) =>
        console.log(color('[ CHANGE ]', 'green'), color(`'${module}'`, 'green'), 'Updated')
    );
} catch (err) {
    console.error(color('[ ERROR ]', 'red'), `Bellah.js not found or failed to load.`);
}

module.exports = {
    uncache,
    nocache
};
