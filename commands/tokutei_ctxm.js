const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');
require('dotenv').config();
const default_Channelid = process.env.TOKUMEI_CHANNELID;
const { Client } = require('pg')
const req_num = process.env.REQ_NUM;




module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName("(特定)このメッセージに投票/状況確認")
        .setType(ApplicationCommandType.Message),

    execute: async (interaction) => {

        const pgclient = new Client({
            connectionString: process.env.DBURL,
            ssl: {
                rejectUnauthorized: false
            }
        })
        pgclient.connect()

        try {
            const message_id = interaction.options._hoistedOptions[0].value
            let sql = "SELECT * FROM logs WHERE message_id = $1;"
            const { rows } = await pgclient.query(sql, [message_id])
            if (rows.length < 1) {
                await interaction.reply({ content: ">>> 存在しないメッセージidです", ephemeral: true });
                return 0;
            }
            let message = rows[0];
            let moderator_list_ = message.moderator ? message.moderator.split(",") : [];
            if (moderator_list_.includes(interaction.user.username)) {
                await interaction.reply({
                    embeds: [{
                        title: "/特定しますた　👀状況",
                        discription: "__あなたはすでに特定ポイントを追加しています__",
                        color: 0x00bfff,
                        fields: [
                            {
                                name: "送信日時",
                                value: message.time
                            },
                            {
                                name: "内容",
                                value: message.content
                            },
                            {
                                name: "累計特定Pt",
                                value: moderator_list_.length
                            }],
                        footer: {
                            text: "made by willoh"
                        }
                    }], ephemeral: true
                });
                return 0;
            }

            moderator_list_.push(interaction.user.username);
            sql = "UPDATE logs SET moderator = $1 WHERE message_id = $2;"
            await pgclient.query(sql, [moderator_list_.join(","), message_id])
            await interaction.reply({
                embeds: [{
                    title: "/特定しますた　⬆追加",
                    discription: "__特定ポイントを追加しました__",
                    color: 0x00bfff,
                    fields: [
                        {
                            name: "送信日時",
                            value: message.time
                        },
                        {
                            name: "内容",
                            value: message.content
                        },
                        {
                            name: "累計特定Pt",
                            value: moderator_list_.length
                        }],
                    footer: {
                        text: "made by willoh"
                    }
                }], ephemeral: true
            });
            if (moderator_list_.length < req_num) return 0;

            await interaction.guild.channels.cache.get(process.env.TOKUTEI_NOTIFY_CHANNELID).send({
                embeds: [{
                    title: "/特定しますた　🧨発動",
                    discription: "__特定ポイントがたまりました！🎉__",
                    color: 0x00bfff,
                    fields: [
                        {
                            name: "送信日時",
                            value: message.time
                        },
                        {
                            name: "内容",
                            value: message.content
                        },
                        {
                            name: "送信者",
                            value: `||${message.author}||`
                        }],
                    footer: {
                        text: "made by willoh"
                    }
                }]
            });
        } catch (err) {
            console.error(err)
            await interaction.reply({ content: `>>> エラーです！すみません！内容:${err}`, ephemeral: true })
        }

        pgclient.end()
    },
}
