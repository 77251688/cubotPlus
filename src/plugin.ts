import {Client, EventMap} from "@cummins/oicq";
import {readdirSync, statSync} from "fs";
import {join} from "path";
import {config} from "./config";
import {Admin, file} from "./utils";
import * as util from "util";

interface permission {
	master: number;
	admin: Array<number>;
}

interface plugincache {
	path: string;
	pluginInstance: PluginINSTANCE;
}

class PluginError extends Error {

	public name: string;

	constructor(msg: string) {
		super(msg);
		this.name = "PluginError";
	}
}

export class PluginINSTANCE {

	private _name?: string;
	private _desc?: string;
	private cmd?: string | null;
	private event!: keyof EventMap;
	private permission?: keyof permission;
	private fun!: (...args: any) => unknown;
	private bot!: Client;

	public name(namestr: string): this {
		this._name = namestr;
		return this;
	}

	private desc(descstr: string): this {
		this._desc = descstr;
		return this;
	}

	public command<T extends string, E extends keyof EventMap, P extends keyof permission>(cmd: T | null, event: E, permission?: P): this {
		this.cmd = cmd;
		this.event = event;
		this.permission = permission;
		return this;
	}

	public action<T extends (...args: any) => void>(fun: T): this {
		if (this.cmd) {
			if (this.permission) {
				if (this.permission === "master")
					this.permission = Admin.getmaster;
				else if (this.permission === "admin")
					this.permission = Admin.getadmins;
				this.fun = (e: any) => {
					if (e.user_id === this.permission || this.permission?.includes(e.user_id))
						if (e.raw_message.split(" ")[0] === this.cmd || e.raw_message.startsWith(<string>this.cmd)) {
							fun(e);
						}
				};
				return this;
			}
			this.fun = (e: any) => {
				if (e.raw_message.split(" ")[0] === this.cmd || e.raw_message.startsWith(<string>this.cmd)) {
					fun(e);
				}
			};
			return this;
		}
		if (this.permission) {
			if (this.permission === "master")
				this.permission = Admin.getmaster;
			else if (this.permission === "admin")
				this.permission = Admin.getadmins;
			this.fun = (e: any) => {
				if (e.user_id === this.permission || this.permission?.includes(e.user_id))
					fun(e);
			};
		}
		this.fun = fun;
		return this;
	}

	public build(bot: Client) {
		this.bot = bot;
		bot.on(this.event, this.fun);
	}

	public get disable(): void {
		this.bot.off(this.event, this.fun);
		return;
	}

	public get getname(): string {
		return this._name as string;
	}

	public get getdesc(): string {
		return <string>this._desc;
	}
}

export class Plugin {
	private static pluginFile = join(__dirname, "../plugin");
	private static config = config.returnconfig();
	private static pluginFileList = file.readdir(this.pluginFile);
	private static EnabledPluginList = config.returnconfig().plugins;
	private static pluginDirectoryList: Array<string>;
	private static EnabledPluginMap: Map<string, plugincache> = new Map<string, plugincache>();
	private static EnabledPluginSet: Set<string> = new Set();
	private static startTime: number;
	private static endTime: number;

	// private static bot: Client;

	public static disable(bot: Client, targetPlugin: string): string {
		if (!this.EnabledPluginSet.has(targetPlugin)) throw new PluginError("ERR: 没有启用这个插件");
		const Plugincache = this.EnabledPluginMap.get(targetPlugin)!;
		require(Plugincache.path);
		const mod = require.cache[Plugincache.path];
		const plugin: PluginINSTANCE = mod?.exports.plugin;
		plugin.disable;
		delete require.cache[Plugincache.path];
		this.handlerMap(targetPlugin, Plugincache, "delete");
		this.handlerSet(targetPlugin, "delete");
		this.config.plugins = Array.from(this.EnabledPluginSet);
		file.writeFile(join(process.cwd(), "../config.json"), this.config);
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
				if (this.EnabledPluginSet.has(plugin.getname)) throw new PluginError(`ERR: 已载入${plugin.getname}`);
				plugin.build(bot);
				this.handlerMap(plugin.getname, {path: fullpath, pluginInstance: plugin}, "set");
				this.handlerSet(plugin.getname, "add");
				this.config.plugins = Array.from(this.EnabledPluginSet);
				file.writeFile(join(process.cwd(), "../config.json"), this.config);
				bot.logger.warn(`已载入 ${plugin.getname}`);
				this.endTime = +new Date();
				bot.logger.warn(`${this.endTime - this.startTime}ms`);
				throw new PluginError(`已载入 ${plugin.getname}`);
			} else
				return;
		if (this.EnabledPluginList.includes(plugin.getname)) {
			plugin.build(bot);
			this.handlerMap(plugin.getname, {path: fullpath, pluginInstance: plugin}, "set");
			this.handlerSet(plugin.getname, "add");
			bot.logger.warn(`已载入 ${plugin.getname}`);
			this.endTime = +new Date();
			bot.logger.warn(`${this.endTime - this.startTime}ms`);
		}
		return;
	}

	private static handlerMap(pluginname: string, cache: plugincache, method: "set" | "delete") {
		this.EnabledPluginMap[method](pluginname, cache);
	}

	private static handlerSet(pluginname: string, method: "add" | "delete") {
		this.EnabledPluginSet[method](pluginname);
	}

	public static scan<F extends (...args: Array<any>) => any, F1 extends (...args: Array<any>) => any, T>(fun: F, fun1: F1, ...args: Array<T>) {
		this.pluginFileList.map(e => {
			const fullpath = join(this.pluginFile, e);
			const stat = statSync(fullpath);
			if (stat.isDirectory()) {
				this.pluginDirectoryList = readdirSync(fullpath);
				this.pluginDirectoryList.map(E => {
					if (E.endsWith(".js")) {
						fun.call(this);
					}
				});
			} else {
				if (e.endsWith(".js")) {
					fun1.call(this);
				}
			}
		});
	}

	public static scanPluginFile(bot: Client, targetPlugin?: string): void {
		// this.bot = bot;
		bot.logger.warn("开始扫描插件目录...");
		this.pluginFileList.map(e => {
			this.startTime = +new Date();
			const fullpath = join(this.pluginFile, e);
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

	public static get pluginList() {
		const pluginlist: Array<string> = [];
		this.pluginFileList.map(e => {
			const fullpath = join(this.pluginFile, e);
			const stat = statSync(fullpath);
			if (stat.isDirectory()) {
				this.pluginDirectoryList = readdirSync(fullpath);
				this.pluginDirectoryList.map(E => {
					if (E.endsWith(".js")) {
						require(join(fullpath, E));
						const mod = require.cache[join(fullpath, E)];
						const plugin: PluginINSTANCE = mod?.exports.plugin;
						if (!(plugin instanceof PluginINSTANCE)) return;
						if (this.EnabledPluginSet.has(plugin.getname))
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
					if (this.EnabledPluginSet.has(plugin.getname))
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

	public static reload(this: Client, targetplugin: string): string | void {
		Plugin.disable(this, targetplugin);
		try {
			Plugin.scanPluginFile(this, targetplugin);
		} catch (err) {
			return err.message;
		}
		return;
	}

	public static disableplugin(bot: Client, targetplugin: string) {
		return Plugin.disable(bot, targetplugin);
	}

	public scan<F extends (...args: Array<any>) => any, F1 extends (...args: Array<any>) => any, T>(fun: F, fun1: F1, ...args: Array<T>) {
		Plugin.scan(fun, fun1, ...args);
		return;
	}

	public static scanPluginFile(bot: Client, targetPlugin?: string) {
		return Plugin.scanPluginFile(bot, targetPlugin);
	}

	public static get pluginList() {
		return Plugin.pluginList;
	}
}