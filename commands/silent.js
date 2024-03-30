const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config();
const default_Channelid = process.env.TOKUMEI_CHANNELID;
const { Client } = require('pg')


module.exports = {
	data: new SlashCommandBuilder()
		.setName('silent')
		.setDescription('@silentしなくてもいいし入力中も出ないしどのチャンネルからでも匿名に書き込めるかわりにファイル添付はできないコマンド')
		.addStringOption(option => {
			return option.setName('input')
				.setDescription('発言(必須)')
				.setRequired(true)
		})
		/*.addStringOption(option => {
			return option.setName("channnel")
				.setDescription("チャンネル指定(既定値:匿名チャンネル)")
				.addChoices(
					{ name: '匿名', value: process.env.TOKUMEI_CHANNELID },
				)
		})*/,
	execute: async function (interaction) {
		const pgclient = new Client({
			connectionString: process.env.DBURL,
			ssl: {
				rejectUnauthorized: false
			}
		})
		pgclient.connect()

		try {
			const content = interaction.options.getString("input");
			//console.log(interaction);
			const author = interaction.user.username;
			let Channelid = interaction.options.getString("channel");
			if (!Channelid) Channelid = default_Channelid;

			const sent = await interaction.guild.channels.cache.get(Channelid).send(`>>> ${content}`);
			let messageId = sent.id;
			let nowDate = new Date(sent.createdTimestamp);
			//nowDate.setHours(nowDate.getHours()+9);
			nowtime = nowDate.toLocaleString('ja-JP');
			const sql = "INSERT INTO logs (message_id, author, content, time, moderator) VALUES ($1, $2, $3, $4, NULL);"
			console.log("a", sql, messageId, author, content.replace(/\n/g, '\\n'), nowtime)

			await pgclient.query(sql, [messageId, author, content.replace(/\n/g, '\\n'), nowtime])
			// チンポ大回転
			console.log("Success!")
			await interaction.reply({ content: '>>> 送信済 すぐにこのメッセージは消えます', ephemeral: true });
			await interaction.deleteReply();
		} catch (err) {
			console.error(err)
			await interaction.reply({ content: `>>> エラーです！すみません！内容:${err}`, ephemeral: true })
		}

		pgclient.end()
	}
};