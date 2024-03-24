const fs = require('fs')
const { Client, Events, GatewayIntentBits, Partials } = require('discord.js');
require('dotenv').config();
const TOKEN = process.env.TOKEN;
const { Client: PGClient } = require('pg')

const client = new Client({
    intents: [
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent
    ],
    partials: [
        Partials.Channel,
        Partials.GuildMember,
        Partials.GuildScheduledEvent,
        Partials.Message,
        Partials.Reaction,
        Partials.ThreadMember,
        Partials.User
    ]
});


let Commands = [];
let CommandFileNames = fs.readdirSync("./commands", { withFileTypes: true });
CommandFileNames.forEach((commandPath) => {
    Commands.push(require(`./commands/${commandPath.name}`));
})

client.once("ready", c => {
    if (parseInt(process.env.DELETE_COMMAND)) {
        client.guilds.fetch(process.env.SERVERID).then((guild) => {
            guild.commands.fetch().then(console.log).catch(console.error);
            guild.commands.set([])
                .then(console.log)
                .catch(console.error);
        });
    }
    if (parseInt(process.env.UPDATE_MESSAGEID)) {
        (async () => {
            const channel = client.channels.cache.get(process.env.TOKUMEI_CHANNELID);
            let message = await channel.messages
                .fetch({ limit: 1 })
                .then(messagePage => (messagePage.size === 1 ? messagePage.at(0) : null));
            while (message) {
                const pgclient = new PGClient({
                    connectionString: process.env.DBURL,
                    ssl: {
                        rejectUnauthorized: false
                    }
                })
                await pgclient.connect()

                await channel.messages
                    .fetch({ limit: 100, before: message.id })
                    .then(messagePage => {
                        messagePage.forEach(msg => {
                            let message_create_at_JST_date = new Date(msg.createdTimestamp);
                            let message_create_at_JST = message_create_at_JST_date.toLocaleString('ja-JP')
                            const sql = `UPDATE logs SET message_id = $1 WHERE time <= $2 ORDER BY time DESC LIMIT 1;`
                            pgclient.query(sql, [msg.id, message_create_at_JST], (err) => {
                                if (err) console.error(err)
                            })
                        });
                        message = 0 < messagePage.size ? messagePage.at(messagePage.size - 1) : null;
                })

                await pgclient.end()
            }
        })();
    }
    console.log(`準備OKです! ${c.user.tag}がログインします。`);
});

client.on("messageCreate", async message => {
    if (message.channelId !== process.env.TOKUMEI_CHANNELID ||
        message.author.bot ||
        message.author.id === process.env.APPLICATIONID) return 0;
    const message_copy = structuredClone(message);
    message.delete()
        .then(async (deleteMessage) => {
            const pgclient = new PGClient({
                connectionString: process.env.DBURL,
                ssl: {
                    rejectUnauthorized: false
                }
            })
            pgclient.connect()

            let content = message_copy.content.replaceAll("@silent", "");
            let attachments_urls = [];
            message_copy.attachments.forEach(attachment => attachments_urls.push(attachment.url))
            if (message_copy.content == "" && attachments_urls.length == 0) return 0;
            let bot_post = `>>> ${content} ${attachments_urls.join("\n")}`;
            if (message_copy.content == "") bot_post = `>>> ${attachments_urls.join("\n")}`
            const sent = await client.channels.cache.get(message_copy.channelId).send(bot_post);
            let nowDate = new Date(message_copy.createdTimestamp);
            nowDate.setHours(nowDate.getHours() + 9);
            nowtime = nowDate.toLocaleString('ja-JP');
            const sql = "INSERT INTO logs VALUES($1, $2, $3, $4, NULL)"
            await pgclient.query(sql, [sent.id, message_copy.author.username, bot_post.replace(/\n/g, '\\n'), nowtime])
            // await pgclient.query(sql, [sent.id, message_copy.author.username, bot_post.replace(/\n/g, '\\n'), nowtime], (err) => {
            //     console.log("sql debugger = " + err)
            //     if (err) {
            //         console.error("sql debugger = " + err)
            //     }
            // })

            pgclient.end()
        }).catch((error) => console.log("こちらのメッセージは既に削除されていました。", error));
});

client.on(Events.InteractionCreate, interaction => {
    if (!interaction.isCommand()) return;
    isCommandExisted = false;
    Commands.forEach(async command => {
        if (interaction.commandName == command.data.name) {
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
    if (!isCommandExisted) console.error(`${interaction.commandName}というコマンドには対応していません。`)
});

client.login(TOKEN);

// 死活監視用サーバー
const http = require("http");
const port = process.env.PORT || 3000;

const server = http.createServer((request, response) => {
    response.writeHead(200);

    const responseMessage = "now ON!";
    response.end(responseMessage);
});

server.listen(port);

console.log("OK")