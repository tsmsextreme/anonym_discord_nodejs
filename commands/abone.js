const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config();
const default_Channelid = process.env.TOKUMEI_CHANNELID;
const { Client } = require('pg')


// 以下の形式にすることで、他のファイルでインポートして使用できるようになります。
module.exports = {
	data: new SlashCommandBuilder()
		.setName('あぼーん')
		.setDescription('メッセージIDを入れると消せます')
		.addStringOption(option => {
			return option.setName('message_id')
				.setDescription('わからなければ「discord メッセージid 取得 方法」で調べてください')
				.setRequired(true)
		}),
	execute: async function (interaction) {
		const pgclient = new Client({
			connectionString: process.env.DBURL,
			ssl: {
				rejectUnauthorized: false
			}
		})
		pgclient.connect()

		try {
			const message_id = interaction.options.getString("message_id");
			await interaction.guild.channels.fetch(process.env.TOKUMEI_CHANNELID)
				.then(channel => channel.messages.fetch(message_id)
					.then(async message => {
						await message.delete()
						const sql = "DELETE FROM logs WHERE message_id = $1;"
						pgclient.query(sql, [message_id], (err) => {
							if (err) console.error(err)
						})
					}))
			await interaction.reply({ content: `>>> あぼーんしたので`, ephemeral: true })
		} catch (err) {
			console.error(err)
			await interaction.reply({ content: `>>> エラーです！すみません！内容:${err}`, ephemeral: true })
		}

		pgclient.end()
	},
};