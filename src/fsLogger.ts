import { spawn } from "child_process";
import fs from "fs";

function seconds(n: number): number {
    if (typeof n !== "number") throw new Error("Number Required");
    return 1000 * n;
}

function minutes(n: number): number {
    if (typeof n !== "number") throw new Error("Number Required");
    return seconds(60) * n;
}

function hours(n: number): number {
    if (typeof n !== "number") throw new Error("Number Required");
    return minutes(60) * n;
}

function days(n: number): number {
    if (typeof n !== "number") throw new Error("Number Required");
    return hours(24) * n;
}

function weeks(n: number): number {
    if (typeof n !== "number") throw new Error("Number Required");
    return days(7) * n;
}

class FSLogger {
    #path: string;
    #timezone: string;
    #locale: string;

    async createFile(path: string): Promise<void> {
        if (!fs.existsSync(path)) {
            fs.writeFileSync(path, "", "utf-8");
        }
    }

    #write(message: string): void {
        if (typeof message !== "string") throw new Error("Invalid log expression.");
        fs.appendFileSync(this.#path, message, "utf-8");
    }

    constructor(path: string, { locale = "en-US", timezone = "UTC" }: { locale?: string, timezone?: string }) {
        this.#path = path;
        this.#locale = locale;
        this.#timezone = timezone;
        this.createFile(path);
    }

    set Locale(locale: string) {
        this.#locale = locale;
    }

    set Timezone(timezone: string) {
        this.#timezone = timezone;
    }

    get Date(): string {
        const now = new Date();
        const Formatter = new Intl.DateTimeFormat(
            this.#locale,
            {
                hour: "numeric",
                minute: "numeric",
                second: "numeric",
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: this.#timezone,
                timeZoneName: "short",
                hour12: false,
            }
        );
        return Formatter.format(now);
    }

    Archive(): Promise<string> {
        return new Promise((resolve, reject) => {
            const sourcePath = fs.realpathSync(this.#path);
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const archivePath = `${sourcePath}-${timestamp}.tar.xz`;
            const tar = spawn("tar", ["-cJf", archivePath, "--", sourcePath]);
            let settled = false;

            tar.once("error", (error) => {
                settled = true;
                reject(error);
            });

            tar.once("close", async (code, signal) => {
                if (settled) return;
                if (code !== 0) {
                    settled = true;
                    reject(new Error(`tar failed${signal ? ` (signal ${signal})` : ` with exit code ${code}`}`));
                    return;
                }

                try {
                    await fs.promises.unlink(sourcePath);
                    settled = true;
                    resolve(archivePath);
                } catch (error) {
                    settled = true;
                    reject(error);
                }
            });
        });
    }

    Log(message = "", object: any = {}): void {
        let output = `\n\n[${this.Date}]: ${message}`;
        if (object && (Object.keys(object).length > 0 || Array.isArray(object))) {
            output += `\n${JSON.stringify(object, null, 4)}`;
        }
        console.log(output);
        this.#write(output);
    }
}

const logpath = process.env.logpath ?? `${process.cwd()}/logs`
const fsLogger = new FSLogger(logpath, {
    locale: "en-IN",
    timezone: "IST"
});
export default fsLogger;
export {
    FSLogger
}
