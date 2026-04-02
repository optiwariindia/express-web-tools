import { exec } from "child_process";
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

class fsLogger {
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
        setInterval(async () => {
            await this.createFile(path);
        }, weeks(1));
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
            exec(`tar -cJf  ${this.#path}-$(date +%Y-%m-%d-%H%M%S).tar.xz ${this.#path}; rm -f ${this.#path}`, (err, stdout, stderr) => {
                if (err) reject(err);
                resolve(stdout);
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
const logpath=process.env.logpath ?? `${process.env.PWD}/logs`
export default new fsLogger(logpath, {
    locale: "en-IN",
    timezone: "IST"
});