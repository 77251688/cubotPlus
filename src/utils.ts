import * as fs from "fs";
import {readdirSync} from "fs";
import * as os from "os";
import {config} from "./config";

export class Admin {
	static get getmaster() {
		const {admins} = config.returnconfig();
		return admins[0];
	}

	static get getadmins() {
		const {admins} = config.returnconfig();
		return admins;
	}

	static setAdmin(uid: number) {
		try {
			const config_ = config.returnconfig();
			if (this.getadmins().includes(uid)) {
				return `❌${uid}已经设置过了你想怎样?`;
			}
			config_.admins.push(uid);
			const status = config.writeconfig(config_);
			if (status) {
				return "✅设置成功!";
			} else {
				return "❌设置失败! 原因未知";
			}
		} catch (e) {
			console.log(e);
		}
	}

	static removeAdmin(uid: number) {
		try {
			const config_ = config.returnconfig();
			const {admins} = config_;
			if (!admins.includes(uid))
				return "❌删除失败! 没有这个管理员!";
			const i = admins.indexOf(uid);
			admins.splice(i, 1);
			config_.admins = admins;
			const status = config.writeconfig(config_);
			if (status) {
				return "✅删除成功!";
			} else {
				return "❌删除失败! 原因未知";
			}
		} catch (e) {
			console.log(e);
		}
	}
}

export class system {
	/** cpu */
	static get cpu() {
		const cpus = os.cpus();
		/** arch */
		const arch = os.arch();
		/** core */
		const core = cpus.length;
		/** model */
		const cpumodel = cpus[0].model;
		return {arch, core, cpumodel};
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
		console.log({memory, freemem, usedmem, usepercent});
		return {memory, freemem, usedmem, usepercent};
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

const slice_ = (e: number) => {
	const str = e.toString();
	const index_ = str.indexOf(".") + 3;
	const result = str.slice(0, index_);
	return result;
};

/**
 * File类
 */
export class file {
	/**
	 * 读取json文件, 返回格式化后的json
	 * @param file
	 */
	static returnFile<T>(file: string): T {
		const f = fs.readFileSync(file, "utf-8");
		return JSON.parse(f);
	}

	/**
	 * 把json写入文件, 不需要传格式化后的json, 直接传json
	 * @param file
	 * @param data
	 */
	static writeFile(file: string, data: object) {
		const data_ = JSON.stringify(data, null, "\t");
		fs.writeFileSync(file, data_);
	}

	/**
	 * 封装读取目录
	 * @param path
	 */
	static readdir(path: string) {
		try {
			return readdirSync(path);
		} catch (err) {
			console.log(err);
			return [];
		}
	}
}

/** random */
export class random {
	/** 随机整数包含两个数 */
	static intrandom(min: number, max: number) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
}

/** timestamp */
