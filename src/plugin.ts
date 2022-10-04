import {Client, EventMap} from "@cummins/oicq";
import {readdirSync, statSync} from "fs";
import {join} from "path";
import {config} from "./config";
import {Admin, file} from "./utils";

interface permission {
	master: number;
	admin: Array<number>;
}

interface fun {
	e: any;
	trigger: string;
	param: string;
}

interface plugincache {
	path: string;
	pluginInstance: PluginINSTANCE;
}

export class PluginError extends Error {

	public name: string;

	constructor(msg: string) {
		super(msg);
		this.name = "PluginError";
	}
}

export class PluginINSTANCE {
	private _name?: string;
	private _desc?: string;
	private _cmd?: string[] | null;
	private _event!: Array<keyof EventMap>;
	private permission?: keyof permission | Array<number | any>;
	// private fun!: (...args: any) => void;
	private bot!: Client;
	// 实验性多监听
	private funArr: Array<(...args: any) => void> = [];
	private _enablehookfun?: (...args: Array<any>) => void;
	private _disablehookfun?: (...args: Array<any>) => void;

	public name(namestr: string): this {
		this._name = namestr;
		return this;
	}

	public desc(descstr: string): this {
		this._desc = descstr;
		return this;
	}

	// public command<T extends string, E extends keyof EventMap, P extends keyof permission>(cmd: T | null, event: E, permission?: P): this {
	// 	// this.cmd = cmd;
	// 	this.cmd = cmd?.split(" ").filter(e => !e.includes("<"));
	// 	this.event = event;
	// 	this.permission = permission;
	// 	return this;
	// }

	// public action<T extends (...args: any) => void>(fun: T): this {
	// 	if (this.cmd) {
	// 		if (this.permission) {
	// 			if (this.permission === "master")
	// 				this.permission = Admin.getmasterArr;
	// 			else if (this.permission === "admin")
	// 				this.permission = Admin.getadmins;
	// 			this.fun = (e: any) => {
	// 				if (this.permission?.includes(e.user_id)) {
	// 					// if (e.raw_message.split(" ")[0] || e.raw_message.startsWith(<string>this.cmd)) {
	// 					const msgArr = e.raw_message.trim().split(" ");
	// 					let trigger;
	// 					if (this.cmd?.includes(msgArr[0])) {
	// 						fun.call(this.bot, e, msgArr[0], msgArr[1]);
	// 						return;
	// 					} else if (this.cmd?.some(item => {
	// 						trigger = item;
	// 						return e.raw_message.startsWith(item);
	// 					})) {
	// 						fun.call(this.bot, e, trigger, e.raw_message.replace(trigger, "").trim());
	// 						trigger = null;
	// 						return;
	// 					}
	// 				}
	// 			};
	// 			return this;
	// 		}
	// 		this.fun = (e: any) => {
	// 			// if (e.raw_message.split(" ")[0] === this.cmd || e.raw_message.startsWith(<string>this.cmd)) {
	// 			const msgArr = e.raw_message.trim().split(" ");
	// 			let trigger;
	// 			if (this.cmd?.includes(msgArr[0])) {
	// 				fun.call(this.bot, e, msgArr[0], msgArr[1]);
	// 				return;
	// 			} else if (this.cmd?.some(item => {
	// 				trigger = item;
	// 				return e.raw_message.startsWith(item);
	// 			})) {
	// 				fun.call(this.bot, e, trigger, e.raw_message.replace(trigger, "").trim());
	// 				trigger = null;
	// 				return;
	// 			}
	// 		};
	// 		return this;
	// 	}
	// 	if (this.permission) {
	// 		if (this.permission === "master")
	// 			this.permission = Admin.getmasterArr;
	// 		else if (this.permission === "admin")
	// 			this.permission = Admin.getadmins;
	// 		this.fun = (e: any) => {
	// 			if (this.permission?.includes(e.user_id)) {
	// 				fun(e);
	// 				return;
	// 			}
	// 		};
	// 	}
	// 	this.fun = fun;
	// 	return this;
	// }

	// **********************************************************//

	// 实验性多监听
	public command<T extends string, E extends Array<keyof EventMap>, P extends keyof permission>(cmd: T | null, event: E | string | null, permission?: P): this {
		this._cmd = cmd?.split(" ").filter(e => !e.includes("<"));
		if (event === null)
			return this;
		if (Array.isArray(event))
			this._event = event;
		else
			this._event = event.split(" ") as Array<keyof EventMap>;
		this.permission = permission;
		return this;
	}

	public action<T extends Array<(...args: any) => void>>(...args: T): this {
		args.map(fun => {
			if (this._cmd) {
				if (this.permission) {
					if (this.permission === "master")
						this.permission = Admin.getmasterArr;
					else if (this.permission === "admin")
						this.permission = Admin.getadmins;
					this.funArr.push((e: any) => {
						if (this.permission?.includes(e.user_id)) {
							const msgArr = e.raw_message.trim().split(" ");
							let trigger;
							if (this._cmd?.includes(msgArr[0])) {
								fun.call(this.bot, e, msgArr[0], msgArr[1]);
								return;
							} else if (this._cmd?.some(item => {
								trigger = item;
								return e.raw_message.startsWith(item);
							})) {
								fun.call(this.bot, e, trigger, e.raw_message.replace(trigger, "").trim());
								trigger = null;
								return;
							}
						}
					});
					return this;
				}
				this.funArr.push((e: any) => {
					// if (e.raw_message.split(" ")[0] === this.cmd || e.raw_message.startsWith(<string>this.cmd)) {
					const msgArr = e.raw_message.trim().split(" ");
					let trigger;
					if (this._cmd?.includes(msgArr[0])) {
						fun.call(this.bot, e, msgArr[0], msgArr[1]);
						return;
					} else if (this._cmd?.some(item => {
						trigger = item;
						return e.raw_message.startsWith(item);
					})) {
						fun.call(this.bot, e, trigger, e.raw_message.replace(trigger, "").trim());
						trigger = null;
						return;
					}
				});
				return this;
			}
			if (this.permission) {
				if (this.permission === "master")
					this.permission = Admin.getmasterArr;
				else if (this.permission === "admin")
					this.permission = Admin.getadmins;
				this.funArr.push((e: any) => {
					if (this.permission?.includes(e.user_id)) {
						fun(e);
						return;
					}
				});
			}
			this.funArr.push(fun);
		});

		return this;
	}

	public build(bot: Client) {
		this.bot = bot;
		if (this._event === undefined || this._event === null) return;
		this._event.map((e: any, index: number) => {
			bot.on(e, this.funArr[index]);
		});
	}

	public enablehook<T extends (...args: Array<any>) => void>(fun: T): this {
		this._enablehookfun = fun;
		return this;
	}

	public disablehook<T extends (...args: Array<any>) => void>(fun: T): this {
		this._disablehookfun = fun;
		return this;
	}

	public get getEvent(): Array<keyof EventMap> {
		return this._event;
	}

	public get disable(): void {
		if (this._event === undefined || this._event === null) return;
		this._event.map((e: any, index: number) => {
			this.bot.off(e, this.funArr[index]);
		});
		return;
	}

	public get getname(): string {
		return this._name as string;
	}

	public get getdesc(): string {
		return <string>this._desc;
	}

	public get getcmd(): string[] | null | undefined {
		return this._cmd;
	}

	public get getenablehookfun(): ((...args: any[]) => void) | undefined {
		return this._enablehookfun;
	}

	public get getdisablehookfun(): ((...args: any[]) => void) | undefined {
		return this._disablehookfun;
	}
}

export class Plugin {
	private static _pluginFile = join(__dirname, "../plugin");
	private static config: any;
	private static pluginFileList = file.readdir(this._pluginFile);
	private static _EnabledPluginList: Array<string>;
	private static pluginDirectoryList: Array<string>;
	private static EnabledPluginMap: Map<string, plugincache> = new Map<string, plugincache>();
	private static _EnabledPluginSet: Set<string> = new Set();
	private static startTime: number;
	private static endTime: number;

	// private static bot: Client;

	public static loadPlugin(bot: Client) {
		this.config = config.returnconfig();
		this._EnabledPluginList = config.returnconfig().plugins;
	}

	public static disable(bot: Client, targetPlugin: string): string {
		if (!this._EnabledPluginSet.has(targetPlugin)) throw new PluginError("ERR: 没有启用这个插件");
		const Plugincache = this.EnabledPluginMap.get(targetPlugin)!;
		require(Plugincache.path);
		const mod = require.cache[Plugincache.path];
		const plugin: PluginINSTANCE = mod?.exports.plugin;
		if (typeof plugin.getdisablehookfun === "function")
			plugin.getdisablehookfun.call(bot);
		plugin.disable;
		delete require.cache[Plugincache.path];
		this.handlerMap(targetPlugin, Plugincache, "delete");
		this.handlerSet(targetPlugin, "delete");
		this.config.plugins = Array.from(this._EnabledPluginSet);
		file.writeFile(join(__dirname, "../config.json"), this.config);
		bot.logger.warn(`已卸载${plugin.getname}`);
		return `已卸载`;

	}

	private static Enable(bot: Client, fullpath: string, targetPlugin: string | undefined): void {
		require(fullpath);
		const mod = require.cache[fullpath];
		const plugin: Plugin = mod?.exports.plugin;
		if (!(plugin instanceof PluginINSTANCE)) return;
		if (targetPlugin)
			if (plugin.getname === targetPlugin) {
				if (this._EnabledPluginSet.has(plugin.getname)) throw new PluginError(`ERR: 已载入${plugin.getname}`);
				if (typeof plugin.getenablehookfun === "function")
					plugin.getenablehookfun.call(bot);
				plugin.build(bot);
				this.handlerMap(plugin.getname, {path: fullpath, pluginInstance: plugin}, "set");
				this.handlerSet(plugin.getname, "add");
				this.config.plugins = Array.from(this._EnabledPluginSet);
				file.writeFile(join(__dirname, "../config.json"), this.config);
				this.endTime = +new Date();
				bot.logger.warn(`已载入 ${plugin.getname} ${this.endTime - this.startTime}ms`);
				throw new PluginError(`已载入 ${plugin.getname}`);
			} else
				return;
		if (this._EnabledPluginList.includes(plugin.getname)) {
			if (typeof plugin.getenablehookfun === "function")
				plugin.getenablehookfun.call(bot);
			plugin.build(bot);
			this.handlerMap(plugin.getname, {path: fullpath, pluginInstance: plugin}, "set");
			this.handlerSet(plugin.getname, "add");
			this.endTime = +new Date();
			bot.logger.warn(`已载入 ${plugin.getname} ${this.endTime - this.startTime}ms`);
		}
		return;
	}

	private static handlerMap(pluginname: string, cache: plugincache, method: "set" | "delete") {
		this.EnabledPluginMap[method](pluginname, cache);
	}

	private static handlerSet(pluginname: string, method: "add" | "delete") {
		this._EnabledPluginSet[method](pluginname);
	}

	/**
	 * 扫描插件目录
	 * @param fun 目录
	 * @param fun1 文件
	 * @param args
	 */
	public static scan<F extends (...args: Array<any>) => any, F1 extends (...args: Array<any>) => any, T>(fun: F, fun1: F1, ...args: Array<T>) {
		this.pluginFileList.map(e => {
			const fullpath = join(this._pluginFile, e);
			const stat = statSync(fullpath);
			if (stat.isDirectory()) {
				this.pluginDirectoryList = readdirSync(fullpath);
				this.pluginDirectoryList.map(E => {
					if (E.endsWith(".js")) {
						fun.call(this, fullpath, E);
					}
				});
			} else {
				if (e.endsWith(".js")) {
					fun1.call(this, fullpath, e);
				}
			}
		});
	}

	public static scanPluginFile(bot: Client, targetPlugin?: string): void {
		// this.bot = bot;
		bot.logger.warn("开始扫描插件目录...");
		this.pluginFileList.map(e => {
			this.startTime = +new Date();
			const fullpath = join(this._pluginFile, e);
			const data = statSync(fullpath);
			if (data.isDirectory()) {
				this.pluginDirectoryList = readdirSync(fullpath);
				this.pluginDirectoryList.map(E => {
					if (E.endsWith(".js"))
						return this.Enable(bot, join(fullpath, E), targetPlugin);
				});
			} else if (data.isFile()) {
				if (e.endsWith(".js"))
					return this.Enable(bot, fullpath, targetPlugin);
			}
		});
		return;
	}

	public static get EnabledPluginSet(): Set<string> {
		return this._EnabledPluginSet;
	}

	public static get pluginFile(): string {
		return this._pluginFile;
	}

	public static get pluginList() {
		const pluginlist: Array<string> = [];
		this.pluginFileList.map(e => {
			const fullpath = join(this._pluginFile, e);
			const stat = statSync(fullpath);
			if (stat.isDirectory()) {
				this.pluginDirectoryList = readdirSync(fullpath);
				this.pluginDirectoryList.map(E => {
					if (E.endsWith(".js")) {
						require(join(fullpath, E));
						const mod = require.cache[join(fullpath, E)];
						const plugin: PluginINSTANCE = mod?.exports.plugin;
						if (!(plugin instanceof PluginINSTANCE)) return;
						if (this._EnabledPluginSet.has(plugin.getname))
							pluginlist.push(`●${plugin.getname}\n`);
						else
							pluginlist.push(`○${plugin.getname}\n`);
					}
				});
			} else {
				if (e.endsWith(".js")) {
					require(fullpath);
					const mod = require.cache[fullpath];
					const plugin: PluginINSTANCE = mod?.exports.plugin;
					if (!(plugin instanceof PluginINSTANCE)) return;
					if (this._EnabledPluginSet.has(plugin.getname))
						pluginlist.push(`●${plugin.getname}\n`);
					else
						pluginlist.push(`○${plugin.getname}\n`);
				}
			}
		});
		return pluginlist;
	}
}

export class PluginInterface {
	public static enableplugin(bot: Client, targetplugin: string) {
		try {
			Plugin.scanPluginFile(bot, targetplugin);
		} catch (err: any) {
			return err.message;
		}
	}

	public static disableplugin(bot: Client, targetplugin: string) {
		return Plugin.disable(bot, targetplugin);
	}

	public static reload(this: Client, targetplugin: string): string | void {
		Plugin.disable(this, targetplugin);
		try {
			Plugin.scanPluginFile(this, targetplugin);
		} catch (err: any) {
			return err.message;
		}
		return;
	}

	/**
	 * 扫描插件目录
	 * @param fun 目录
	 * @param fun1 文件
	 * @param args
	 */
	public static scan<F extends (...args: Array<any>) => any, F1 extends (...args: Array<any>) => any, T>(fun: F, fun1: F1, ...args: Array<T>) {
		Plugin.scan(fun, fun1, ...args);
		return;
	}

	public static get EnabledPluginSet(): Set<string> {
		return Plugin.EnabledPluginSet;
	}

	/**
	 * 加载插件
	 * @param bot
	 */
	public static loadPlugin(bot: Client): void {
		Plugin.loadPlugin(bot);
		Plugin.scanPluginFile(bot);
		return;
	}

	public static get pluginFile(): string {
		return Plugin.pluginFile;
	}

	public static get pluginList() {
		return Plugin.pluginList;
	}
}