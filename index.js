const Discord = require('discord.js');
const dotenv = require('dotenv');

dotenv.config();

const client = new Discord.Client();

// Voice channel ids
const id1 = '817359734893445170';
const id2 = '817359978746347530';

// Calls when connected to API
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);

  // Set activity for help
  client.user.setActivity("!poke @Jméno", {
    type: "LISTENING",
  });
});

client.on('message', msg => {
  const prefix = '!';

  if (!msg.content.startsWith(prefix) || msg.author.bot) return;

  const args = msg.content.slice(prefix.length).trim().split(' ');
  const command = args.shift().toLowerCase();

  if (command === 'poke') {
    const user = msg.mentions.members.first();

    if (user) {
      if (user.voice.channel) {
        msg.channel.send(`👉 <@${user.id}>`);
        if (args.length > 1) {
          const count = parseInt(args[1]);
          if (count > 0 && count <= 10) {
            moveUser(count, user);
          } else {
            msg.reply('Dej tam normální počet týpku!');
          }
        } else {
          moveUser(5, user);
        }
      } else {
        msg.reply('Týpek není připojenej v žádným channelu!');
      }
    } else {
      msg.reply('Musíš napsat jméno!');
    }
  }
});

function moveUser(count, user) {
  if (count === 0) {
    return;
  }

  setTimeout(() => {
    user.voice.setChannel(count % 2 == 0 ? id1 : id2)

    moveUser(count - 1, user);
  }, 1);
}

client.login(process.env.TOKEN);
