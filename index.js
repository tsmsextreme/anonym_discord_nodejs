const fs = require('fs')
const { Client, Events, GatewayIntentBits, Partials} = require('discord.js'); 
require('dotenv').config();
const TOKEN = process.env.TOKEN;
const SERVERID = process.env.SERVERID;

const client = new Client({	intents: [		
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.MessageContent],
partials: [
    Partials.User,
    Partials.Channel,
    Partials.GuildMember,
    Partials.Message,
    Partials.Reaction,
    Partials.ThreadMember,
]});

let Commands = [];
let CommandFileNames = fs.readdirSync("./commands", {withFileTypes: true});
CommandFileNames.forEach((commandPath)=>{
    Commands.push(require(`./commands/${commandPath.name}`));
})

client.once("ready", async c => {
	console.log(`準備OKです! ${c.user.tag}がログインします。`);
});

client.on(Events.InteractionCreate, interaction => {

    if (!interaction.isChatInputCommand()) return;

    isCommandExisted = false;
    
    Commands.forEach(async command => {
        if(interaction.commandName == command.data.name){
            isCommandExisted = true;
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'コマンド実行時にエラーになりました。', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'コマンド実行時にエラーになりました。', ephemeral: true });
                }
            }
        }
    });
    if(!isCommandExisted) console.error(`${interaction.commandName}というコマンドには対応していません。`)
});

client.login(TOKEN);

console.log("OK")