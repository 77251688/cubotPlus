"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.random = exports.file = exports.system = exports.Admin = void 0;
const fs = __importStar(require("fs"));
const fs_1 = require("fs");
const os = __importStar(require("os"));
const config_1 = require("./config");
class Admin {
    static get getmaster() {
        const { admins } = config_1.config.returnconfig();
        return admins[0];
    }
    static get getadmins() {
        const { admins } = config_1.config.returnconfig();
        return admins;
    }
    static setAdmin(uid) {
        try {
            const config_ = config_1.config.returnconfig();
            if (this.getadmins().includes(uid)) {
                return `❌${uid}已经设置过了你想怎样?`;
            }
            config_.admins.push(uid);
            const status = config_1.config.writeconfig(config_);
            if (status) {
                return "✅设置成功!";
            }
            else {
                return "❌设置失败! 原因未知";
            }
        }
        catch (e) {
            console.log(e);
        }
    }
    static removeAdmin(uid) {
        try {
            const config_ = config_1.config.returnconfig();
            const { admins } = config_;
            if (!admins.includes(uid))
                return "❌删除失败! 没有这个管理员!";
            const i = admins.indexOf(uid);
            admins.splice(i, 1);
            config_.admins = admins;
            const status = config_1.config.writeconfig(config_);
            if (status) {
                return "✅删除成功!";
            }
            else {
                return "❌删除失败! 原因未知";
            }
        }
        catch (e) {
            console.log(e);
        }
    }
}
exports.Admin = Admin;
class system {
    /** cpu */
    static get cpu() {
        const cpus = os.cpus();
        /** arch */
        const arch = os.arch();
        /** core */
        const core = cpus.length;
        /** model */
        const cpumodel = cpus[0].model;
        return { arch, core, cpumodel };
    }
    /** memory */
    static get memory() {
        /** All mem */
        const memory_ = os.totalmem();
        const memory__ = memory_ / 1024 / 1024 / 1024;
        const memory = slice_(memory__);
        /** Free mem */
        const freemem_ = os.freemem();
        const _freemem = freemem_ / 1024 / 1024 / 1024;
        const freemem__ = _freemem > 1 ? _freemem : _freemem * 1024;
        const freemem = slice_(freemem__);
        /** Uesd mem */
        const usedmem_ = (memory_ - freemem_) / 1024 / 1024 / 1024;
        const usedmem__ = usedmem_ > 1 ? usedmem_ : usedmem_ * 1024;
        const usedmem = slice_(usedmem__);
        /** percent */
        const usepercent__ = usedmem__ / memory__ * 100;
        const usepercent = slice_(usepercent__);
        console.log({ memory, freemem, usedmem, usepercent });
        return { memory, freemem, usedmem, usepercent };
    }
    /** OS */
    static get OStype() {
        const sys = os.type();
        switch (sys) {
            case `Windows_NT`:
                return `Windows`;
            case `Linux`:
                return `Linux`;
            case `Darwin`:
                return `Mac`;
        }
    }
}
exports.system = system;
const slice_ = (e) => {
    const str = e.toString();
    const index_ = str.indexOf(".") + 3;
    const result = str.slice(0, index_);
    return result;
};
/**
 * File类
 */
class file {
    /**
     * 读取json文件, 返回格式化后的json
     * @param file
     */
    static returnFile(file) {
        const f = fs.readFileSync(file, "utf-8");
        return JSON.parse(f);
    }
    /**
     * 把json写入文件, 不需要传格式化后的json, 直接传json
     * @param file
     * @param data
     */
    static writeFile(file, data) {
        const data_ = JSON.stringify(data, null, "\t");
        fs.writeFileSync(file, data_);
    }
    /**
     * 封装读取目录
     * @param path
     */
    static readdir(path) {
        try {
            return fs_1.readdirSync(path);
        }
        catch (err) {
            console.log(err);
            return [];
        }
    }
}
exports.file = file;
/** random */
class random {
    /** 随机整数包含两个数 */
    static intrandom(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}
exports.random = random;
/** timestamp */
