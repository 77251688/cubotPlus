"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginInterface = exports.Plugin = exports.PluginINSTANCE = void 0;
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
class PluginINSTANCE {
    _name;
    _desc;
    cmd;
    event;
    permission;
    fun;
    bot;
    name(namestr) {
        this._name = namestr;
        return this;
    }
    desc(descstr) {
        this._desc = descstr;
        return this;
    }
    command(cmd, event, permission) {
        this.cmd = cmd;
        this.event = event;
        this.permission = permission;
        return this;
    }
    action(fun) {
        if (this.cmd) {
            if (this.permission) {
                if (this.permission === "master")
                    this.permission = utils_1.Admin.getmaster;
                else if (this.permission === "admin")
                    this.permission = utils_1.Admin.getadmins;
                this.fun = (e) => {
                    if (e.user_id === this.permission || this.permission?.includes(e.user_id))
                        if (e.raw_message.split(" ")[0] === this.cmd || e.raw_message.startsWith(this.cmd)) {
                            fun(e);
                        }
                };
                return this;
            }
            this.fun = (e) => {
                if (e.raw_message.split(" ")[0] === this.cmd || e.raw_message.startsWith(this.cmd)) {
                    fun(e);
                }
            };
            return this;
        }
        if (this.permission) {
            if (this.permission === "master")
                this.permission = utils_1.Admin.getmaster;
            else if (this.permission === "admin")
                this.permission = utils_1.Admin.getadmins;
            this.fun = (e) => {
                if (e.user_id === this.permission || this.permission?.includes(e.user_id))
                    fun(e);
            };
        }
        this.fun = fun;
        return this;
    }
    build(bot) {
        this.bot = bot;
        bot.on(this.event, this.fun);
    }
    get disable() {
        this.bot.off(this.event, this.fun);
        return;
    }
    get getname() {
        return this._name;
    }
    get getdesc() {
        return this._desc;
    }
}
exports.PluginINSTANCE = PluginINSTANCE;
class Plugin {
    static pluginFile = path_1.join(__dirname, "../plugin");
    static config = config_1.config.returnconfig();
    static pluginFileList = utils_1.file.readdir(this.pluginFile);
    static EnabledPluginList = config_1.config.returnconfig().plugins;
    static pluginDirectoryList;
    static EnabledPluginMap = new Map();
    static EnabledPluginSet = new Set();
    static startTime;
    static endTime;
    // private static bot: Client;
    static disable(bot, targetPlugin) {
        if (!this.EnabledPluginSet.has(targetPlugin))
            throw new PluginError("ERR: 没有启用这个插件");
        const Plugincache = this.EnabledPluginMap.get(targetPlugin);
        require(Plugincache.path);
        const mod = require.cache[Plugincache.path];
        const plugin = mod?.exports.plugin;
        plugin.disable;
        delete require.cache[Plugincache.path];
        this.handlerMap(targetPlugin, Plugincache, "delete");
        this.handlerSet(targetPlugin, "delete");
        this.config.plugins = Array.from(this.EnabledPluginSet);
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
                if (this.EnabledPluginSet.has(plugin.getname))
                    throw new PluginError(`ERR: 已载入${plugin.getname}`);
                plugin.build(bot);
                this.handlerMap(plugin.getname, { path: fullpath, pluginInstance: plugin }, "set");
                this.handlerSet(plugin.getname, "add");
                this.config.plugins = Array.from(this.EnabledPluginSet);
                utils_1.file.writeFile(path_1.join(process.cwd(), "../config.json"), this.config);
                bot.logger.warn(`已载入 ${plugin.getname}`);
                this.endTime = +new Date();
                bot.logger.warn(`${this.endTime - this.startTime}ms`);
                throw new PluginError(`已载入 ${plugin.getname}`);
            }
            else
                return;
        if (this.EnabledPluginList.includes(plugin.getname)) {
            plugin.build(bot);
            this.handlerMap(plugin.getname, { path: fullpath, pluginInstance: plugin }, "set");
            this.handlerSet(plugin.getname, "add");
            bot.logger.warn(`已载入 ${plugin.getname}`);
            this.endTime = +new Date();
            bot.logger.warn(`${this.endTime - this.startTime}ms`);
        }
        return;
    }
    static handlerMap(pluginname, cache, method) {
        this.EnabledPluginMap[method](pluginname, cache);
    }
    static handlerSet(pluginname, method) {
        this.EnabledPluginSet[method](pluginname);
    }
    static scan(fun, fun1, ...args) {
        this.pluginFileList.map(e => {
            const fullpath = path_1.join(this.pluginFile, e);
            const stat = fs_1.statSync(fullpath);
            if (stat.isDirectory()) {
                this.pluginDirectoryList = fs_1.readdirSync(fullpath);
                this.pluginDirectoryList.map(E => {
                    if (E.endsWith(".js")) {
                        fun.call(this);
                    }
                });
            }
            else {
                if (e.endsWith(".js")) {
                    fun1.call(this);
                }
            }
        });
    }
    static scanPluginFile(bot, targetPlugin) {
        // this.bot = bot;
        bot.logger.warn("开始扫描插件目录...");
        this.pluginFileList.map(e => {
            this.startTime = +new Date();
            const fullpath = path_1.join(this.pluginFile, e);
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
    static get pluginList() {
        const pluginlist = [];
        this.pluginFileList.map(e => {
            const fullpath = path_1.join(this.pluginFile, e);
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
                        if (this.EnabledPluginSet.has(plugin.getname))
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
    static disableplugin(bot, targetplugin) {
        return Plugin.disable(bot, targetplugin);
    }
    scan(fun, fun1, ...args) {
        Plugin.scan(fun, fun1, ...args);
        return;
    }
    static scanPluginFile(bot, targetPlugin) {
        return Plugin.scanPluginFile(bot, targetPlugin);
    }
    static get pluginList() {
        return Plugin.pluginList;
    }
}
exports.PluginInterface = PluginInterface;
