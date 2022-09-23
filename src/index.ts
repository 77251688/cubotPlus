import {Client} from "@cummins/oicq";
import {client} from "./bot";
import {Admin} from "./utils";
import {PluginInterface} from "./plugin";

function onMessage(this: Client, e: any) {
	const admin = Admin.getmaster;
	const cmdstartstr = "#";
	const {raw_message: msg, user_id: uid} = e;
	if (!(uid == admin))
		return;
	if (!msg.startsWith(cmdstartstr))
		return;
	const cmdArr = msg.trim().replace("#", "").split(" ");
	const cmd = cmdArr[0];
	const params = cmdArr.slice(1);
	const msg_ = cmdHanders.call(this, cmd, params);
	if (msg_ == 0)
		return;
	e.reply(msg_);
}

/** online push */
function online(this: Client) {
	sendadmins(this, "✅重连成功");
}

function onlineActivity(bot: Client) {
	try {
		let msg = "";
		// const size = onlineActivate(bot);
		msg += `✅上线成功!可以愉快玩耍了!\n`;
		// msg += `✅启用了${size}个插件`;
		sendadmins(bot, msg);
	} catch (e: any) {
		console.log(e);
		sendadmins(bot, e.message);
	}
}

/** sendmsg all admins */
async function sendadmins(bot: Client, msg: string) {
	try {
		const admins = Admin.getadmins;
		for (const e of admins) {
			if (bot.fl.has(e)) {
				await bot.sendPrivateMsg(e, msg);
			} else {
				const {nickname: stranger} = await bot.getStrangerInfo(e);
				bot.logger.warn(`❌${stranger}不是你的好友!无法发送消息!`);
				await bot.sendPrivateMsg(admins[0], `管理员"${stranger}"不是你的好友!无法发送消息!`);
			}
		}
	} catch (e) {
		console.log(e);

	}
}

function adminsEvents(bot: Client) {
	bot.on("system.online", online);
}

function events(bot: Client) {
	bot.on("message", onMessage);
}

function cmdHanders(this: Client, cmd: string, params: string) {
	const cmd_ = params[0];
	const cmd__ = params[1];
	try {
		let msg = "";
		if (cmd === "帮助" || cmd === "help") {
			msg += `#详情 [机器人详情]\n`;
			msg += `#插件 [插件帮助]\n`;
			msg += `\n`;
			return msg;
		}
		if (cmd === "插件" || cmd === "plugin") {
			if (cmd_) {
				switch (cmd_) {
				case "ls":
					return PluginInterface.pluginList;
				case "启用":
					if (!cmd__)
						return `没带参数?`;
					return PluginInterface.enableplugin(this, cmd__);

				case "load":
					if (!cmd__)
						return `没带参数?`;
					return PluginInterface.enableplugin(this, cmd__);

				case "禁用":
					if (!cmd__)
						return `没带参数?`;
					return PluginInterface.disableplugin(this, cmd__);

				case "remove":
					if (!cmd__)
						return `没带参数?`;
					return PluginInterface.disableplugin(this, cmd__);
				default:
					return `你没带参数? 如: cmd cmd_ data`;
				}
			}
			msg += `#${cmd} ls\n`;
			msg += `#${cmd} 启用 插件名\n`;
			msg += `$${cmd}\n`;
			return msg;
		}
		if (cmd === "重载" || cmd === "r->" || cmd === "reload") {
			if (!cmd_)
				return `#${cmd} 插件名`;
			return PluginInterface.reload.call(this, cmd_);
		}
		return 0;
	} catch (e: any) {
		console.log(e.stack);
		return `error: ${e.message}`;
	}
}

/** create client🥥 */
(async function step() {
	process.on("uncaughtException", error => {
		console.log(`未捕获的错误:\n${error}`);
		console.log(error.stack);
	});
	const bot = await client.create();
	bot.once("system.online", async () => {
		bot.logger.mark("上线成功!");
		onlineActivity(bot);
		adminsEvents(bot);
		events(bot);
		bot.logger.error(+new Date());
		PluginInterface.scanPluginFile(bot);
		bot.logger.error(+new Date());
	});
})();


