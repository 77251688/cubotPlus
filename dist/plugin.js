"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginInterface = exports.Plugin = exports.PluginINSTANCE = exports.PluginError = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const config_1 = require("./config");
const utils_1 = require("./utils");
class PluginError extends Error {
    name;
    constructor(msg) {
        super(msg);
        this.name = "PluginError";
    }
}
exports.PluginError = PluginError;
class PluginINSTANCE {
    _name;
    _desc;
    _cmd;
    _event;
    permission;
    // private fun!: (...args: any) => void;
    bot;
    // 实验性多监听
    funArr = [];
    _enablehookfun;
    _disablehookfun;
    name(namestr) {
        this._name = namestr;
        return this;
    }
    desc(descstr) {
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
    command(cmd, event, permission) {
        this._cmd = cmd?.split(" ").filter(e => !e.includes("<"));
        if (event === null)
            return this;
        if (Array.isArray(event))
            this._event = event;
        else
            this._event = event.split(" ");
        this.permission = permission;
        return this;
    }
    action(...args) {
        args.map(fun => {
            if (this._cmd) {
                if (this.permission) {
                    if (this.permission === "master")
                        this.permission = utils_1.Admin.getmasterArr;
                    else if (this.permission === "admin")
                        this.permission = utils_1.Admin.getadmins;
                    this.funArr.push((e) => {
                        if (this.permission?.includes(e.user_id)) {
                            const msgArr = e.raw_message.trim().split(" ");
                            let trigger;
                            if (this._cmd?.includes(msgArr[0])) {
                                fun.call(this.bot, e, msgArr[0], msgArr[1]);
                                return;
                            }
                            else if (this._cmd?.some(item => {
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
                this.funArr.push((e) => {
                    // if (e.raw_message.split(" ")[0] === this.cmd || e.raw_message.startsWith(<string>this.cmd)) {
                    const msgArr = e.raw_message.trim().split(" ");
                    let trigger;
                    if (this._cmd?.includes(msgArr[0])) {
                        fun.call(this.bot, e, msgArr[0], msgArr[1]);
                        return;
                    }
                    else if (this._cmd?.some(item => {
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
                    this.permission = utils_1.Admin.getmasterArr;
                else if (this.permission === "admin")
                    this.permission = utils_1.Admin.getadmins;
                this.funArr.push((e) => {
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
    build(bot) {
        this.bot = bot;
        if (this._event === undefined || this._event === null)
            return;
        this._event.map((e, index) => {
            bot.on(e, this.funArr[index]);
        });
    }
    enablehook(fun) {
        this._enablehookfun = fun;
        return this;
    }
    disablehook(fun) {
        this._disablehookfun = fun;
        return this;
    }
    get getEvent() {
        return this._event;
    }
    get disable() {
        if (this._event === undefined || this._event === null)
            return;
        this._event.map((e, index) => {
            this.bot.off(e, this.funArr[index]);
        });
        return;
    }
    get getname() {
        return this._name;
    }
    get getdesc() {
        return this._desc;
    }
    get getcmd() {
        return this._cmd;
    }
    get getenablehookfun() {
        return this._enablehookfun;
    }
    get getdisablehookfun() {
        return this._disablehookfun;
    }
}
exports.PluginINSTANCE = PluginINSTANCE;
class Plugin {
    static _pluginFile = path_1.join(__dirname, "../plugin");
    static config;
    static pluginFileList = utils_1.file.readdir(this._pluginFile);
    static _EnabledPluginList;
    static pluginDirectoryList;
    static EnabledPluginMap = new Map();
    static _EnabledPluginSet = new Set();
    static startTime;
    static endTime;
    // private static bot: Client;
    static loadPlugin(bot) {
        this.config = config_1.config.returnconfig();
        this._EnabledPluginList = config_1.config.returnconfig().plugins;
    }
    static disable(bot, targetPlugin) {
        if (!this._EnabledPluginSet.has(targetPlugin))
            throw new PluginError("ERR: 没有启用这个插件");
        const Plugincache = this.EnabledPluginMap.get(targetPlugin);
        require(Plugincache.path);
        const mod = require.cache[Plugincache.path];
        const plugin = mod?.exports.plugin;
        if (typeof plugin.getdisablehookfun === "function")
            plugin.getdisablehookfun.call(bot);
        plugin.disable;
        delete require.cache[Plugincache.path];
        this.handlerMap(targetPlugin, Plugincache, "delete");
        this.handlerSet(targetPlugin, "delete");
        this.config.plugins = Array.from(this._EnabledPluginSet);
        utils_1.file.writeFile(path_1.join(process.cwd(), "../config.json"), this.config);
        bot.logger.warn(`已卸载${plugin.getname}`);
        return `已卸载`;
    }
    static Enable(bot, fullpath, targetPlugin) {
        require(fullpath);
        const mod = require.cache[fullpath];
        const plugin = mod?.exports.plugin;
        if (!(plugin instanceof PluginINSTANCE))
            return;
        if (targetPlugin)
            if (plugin.getname === targetPlugin) {
                if (this._EnabledPluginSet.has(plugin.getname))
                    throw new PluginError(`ERR: 已载入${plugin.getname}`);
                if (typeof plugin.getenablehookfun === "function")
                    plugin.getenablehookfun.call(bot);
                plugin.build(bot);
                this.handlerMap(plugin.getname, { path: fullpath, pluginInstance: plugin }, "set");
                this.handlerSet(plugin.getname, "add");
                this.config.plugins = Array.from(this._EnabledPluginSet);
                utils_1.file.writeFile(path_1.join(process.cwd(), "../config.json"), this.config);
                this.endTime = +new Date();
                bot.logger.warn(`已载入 ${plugin.getname} ${this.endTime - this.startTime}ms`);
                throw new PluginError(`已载入 ${plugin.getname}`);
            }
            else
                return;
        if (this._EnabledPluginList.includes(plugin.getname)) {
            if (typeof plugin.getenablehookfun === "function")
                plugin.getenablehookfun.call(bot);
            plugin.build(bot);
            this.handlerMap(plugin.getname, { path: fullpath, pluginInstance: plugin }, "set");
            this.handlerSet(plugin.getname, "add");
            this.endTime = +new Date();
            bot.logger.warn(`已载入 ${plugin.getname} ${this.endTime - this.startTime}ms`);
        }
        return;
    }
    static handlerMap(pluginname, cache, method) {
        this.EnabledPluginMap[method](pluginname, cache);
    }
    static handlerSet(pluginname, method) {
        this._EnabledPluginSet[method](pluginname);
    }
    /**
     * 扫描插件目录
     * @param fun 目录
     * @param fun1 文件
     * @param args
     */
    static scan(fun, fun1, ...args) {
        this.pluginFileList.map(e => {
            const fullpath = path_1.join(this._pluginFile, e);
            const stat = fs_1.statSync(fullpath);
            if (stat.isDirectory()) {
                this.pluginDirectoryList = fs_1.readdirSync(fullpath);
                this.pluginDirectoryList.map(E => {
                    if (E.endsWith(".js")) {
                        fun.call(this, fullpath, E);
                    }
                });
            }
            else {
                if (e.endsWith(".js")) {
                    fun1.call(this, fullpath, e);
                }
            }
        });
    }
    static scanPluginFile(bot, targetPlugin) {
        // this.bot = bot;
        bot.logger.warn("开始扫描插件目录...");
        this.pluginFileList.map(e => {
            this.startTime = +new Date();
            const fullpath = path_1.join(this._pluginFile, e);
            const data = fs_1.statSync(fullpath);
            if (data.isDirectory()) {
                this.pluginDirectoryList = fs_1.readdirSync(fullpath);
                this.pluginDirectoryList.map(E => {
                    if (E.endsWith(".js"))
                        return this.Enable(bot, path_1.join(fullpath, E), targetPlugin);
                });
            }
            else if (data.isFile()) {
                if (e.endsWith(".js"))
                    return this.Enable(bot, fullpath, targetPlugin);
            }
        });
        return;
    }
    static get EnabledPluginSet() {
        return this._EnabledPluginSet;
    }
    static get pluginFile() {
        return this._pluginFile;
    }
    static get pluginList() {
        const pluginlist = [];
        this.pluginFileList.map(e => {
            const fullpath = path_1.join(this._pluginFile, e);
            const stat = fs_1.statSync(fullpath);
            if (stat.isDirectory()) {
                this.pluginDirectoryList = fs_1.readdirSync(fullpath);
                this.pluginDirectoryList.map(E => {
                    if (E.endsWith(".js")) {
                        require(path_1.join(fullpath, E));
                        const mod = require.cache[path_1.join(fullpath, E)];
                        const plugin = mod?.exports.plugin;
                        if (!(plugin instanceof PluginINSTANCE))
                            return;
                        if (this._EnabledPluginSet.has(plugin.getname))
                            pluginlist.push(`●${plugin.getname}\n`);
                        else
                            pluginlist.push(`○${plugin.getname}\n`);
                    }
                });
            }
            else {
                if (e.endsWith(".js")) {
                    require(fullpath);
                    const mod = require.cache[fullpath];
                    const plugin = mod?.exports.plugin;
                    if (!(plugin instanceof PluginINSTANCE))
                        return;
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
exports.Plugin = Plugin;
class PluginInterface {
    static enableplugin(bot, targetplugin) {
        try {
            Plugin.scanPluginFile(bot, targetplugin);
        }
        catch (err) {
            return err.message;
        }
    }
    static disableplugin(bot, targetplugin) {
        return Plugin.disable(bot, targetplugin);
    }
    static reload(targetplugin) {
        Plugin.disable(this, targetplugin);
        try {
            Plugin.scanPluginFile(this, targetplugin);
        }
        catch (err) {
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
    static scan(fun, fun1, ...args) {
        Plugin.scan(fun, fun1, ...args);
        return;
    }
    static get EnabledPluginSet() {
        return Plugin.EnabledPluginSet;
    }
    /**
     * 加载插件
     * @param bot
     */
    static loadPlugin(bot) {
        Plugin.loadPlugin(bot);
        Plugin.scanPluginFile(bot);
        return;
    }
    static get pluginFile() {
        return Plugin.pluginFile;
    }
    static get pluginList() {
        return Plugin.pluginList;
    }
}
exports.PluginInterface = PluginInterface;
