const Discord = require('discord.js');
const dotenv = require('dotenv');
const Keyv = require('keyv');

dotenv.config();

const client = new Discord.Client();
const storage = new Keyv('sqlite://settings.sqlite');

const getDefaultSettings = () => ({
  'room_a': null,
  'room_b': null,
  'auto_return': true,
  'move_delay': 500,
  'default_moves': 5,
});

const settingsParams = {
  'room_a': {
    'type': 'string',
  },
  'room_b': {
    'type': 'string'
  },
  'auto_return': {
    'type': 'bool',
  },
  'move_delay': {
    'type': 'int',
    'min': 0,
    'max': 2000
  },
  'default_moves': {
    'type': 'int',
    'min': 1,
    'max': 10
  }
}

// Calls when connected to API
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);

  // Set activity for help
  client.user.setActivity("!poke @Name", {
    type: "LISTENING",
  });
});

client.on('message', async (msg) => {
  if (!msg.guild) {
    // DM
    return;
  }

  let settings = await storage.get(msg.guild.id);

  if (!settings) {
    // Set default settings for this server
    settings = getDefaultSettings();
    await storage.set(msg.guild.id, settings);
  }

  if (!msg.content.startsWith('!') || msg.author.bot) return;

  const args = msg.content.slice(1).trim().split(' ');
  const command = args.shift().toLowerCase();

  if (command === 'poke') {
    if (args.length > 0 && args[0] === 'settings' && msg.member.hasPermission("ADMINISTRATOR")) {
      if (args.length > 1) {
        const param = settingsParams[args[1]];
        if (typeof param !== 'undefined') {
          if (args.length > 2) {
            const value = args[2];

            if (param.type === 'string') {
              settings[args[1]] = value;
            }
            else if (param.type === 'bool') {
              if (value === 'yes') {
                settings[args[1]] = true;
              }
              else if (value === 'no') {
                settings[args[1]] = false;
              }
              else {
                // Error
                msg.reply('Jsou povoleny hodnoty yes nebo no');
                return;
              }
            }
            else if (param.type === 'int') {
              const parsed = parseInt(value);

              if (typeof parsed === 'number' && parsed >= param.min && parsed <= param.max) {
                settings[args[1]] = parsed;
              } else {
                // Error
                msg.reply(`Musí se jednat o číslo <${param.min};${param.max}>`)
                return
              }
            }

            await storage.set(msg.guild.id, settings);
            msg.reply('Nastavení uloženo');
          } else {
            msg.reply(`\`${args[1]}: ${settings[args[1]]}\``)
          }
        } else {
          msg.reply('Toto nastavení neexistuje!');
        }
      } else {
        let buffer = []
        for (let key in settings) {
          buffer.push(`${key}: ${settings[key]}\n`);
        }
        msg.reply('```' + buffer.join('\n') + '```');
      }

      return;
    }

    if (settings.room_a === null || settings.room_b === null) {
      msg.reply('Nejdřív nastav id roomek!');
    }

    const user = msg.mentions.members.first();

    if (user) {
      if (user.voice.channel) {
        const orgId = user.voice.channelID;

        msg.channel.send(`👉 <@${user.id}>`);
        if (args.length > 1) {
          const count = parseInt(args[1]);
          if (count > 0 && count <= 10) {
            moveUser(count, user, orgId, settings);
          } else {
            msg.reply('Dej tam normální počet týpku!');
          }
        } else {
          moveUser(settings.default_moves, user, orgId, settings);
        }
      } else {
        msg.reply('Týpek není připojenej v žádným channelu!');
      }
    } else {
      msg.reply('Musíš napsat jméno!');
    }
  }
});

function moveUser(count, user, orgId, settings) {
  if (count === 0) {
    if (settings.auto_return) {
      user.voice.setChannel(orgId);
    }
    return;
  }

  setTimeout(() => {
    user.voice.setChannel(count % 2 == 0 ? settings.room_a : settings.room_b)

    moveUser(count - 1, user, orgId, settings);
  }, settings.move_delay);
}

client.login(process.env.TOKEN);
