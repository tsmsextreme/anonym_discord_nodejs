const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config();
const default_Channelid = process.env.TOKUMEI_CHANNELID;
const { Client } = require('pg')
const req_num = process.env.REQ_NUM;


// 以下の形式にすることで、他のファイルでインポートして使用できるようになります。
module.exports = {
	data: new SlashCommandBuilder()
		.setName('特定しますた')
		.setDescription(`${req_num}ポイント貯まる (${req_num}人から実行される) とそのメッセージの投稿者が晒し上げられます`)
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
			let sql = "SELECT * FROM logs WHERE message_id = $1;"
			const { rows } = await pgclient.query(sql, [message_id])
			if (rows.length < 1) {
				await interaction.reply({ content: ">>> 存在しないメッセージidです", ephemeral: true });
				return 0;
			}
			let message = rows[0]
			let moderator_list_ = message.moderator ? message.moderator.split(",") : [];
			if (moderator_list_.includes(interaction.user.username)) {
				await interaction.reply({
					embeds: [{
						title: "/特定しますた　⚠️警告",
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
					}], ephemeral: true });
				return 0;
			}

			moderator_list_.push(interaction.user.username);
			sql = "UPDATE logs SET moderator = $1 WHERE message_id = $2;"
			await pgclient.query(sql, [moderator_list_.join(","), message_id])
			await interaction.reply({ embeds : [{
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
};
