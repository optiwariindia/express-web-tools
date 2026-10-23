import http from "http";
import https from "https";
import { Response } from "express";

type Headers = Record<string, string>;

class API {
    private baseURL: URL = new URL("http://localhost"); // Default value
    private defaultHeaders: Headers = {};
    private client: typeof http | typeof https = http;

    constructor({ baseURL, headers = {}, useHttps }: { baseURL: string, headers?: Headers, useHttps?: boolean }) {
        this.baseURL = new URL(baseURL);
        if (this.baseURL.protocol !== "http:" && this.baseURL.protocol !== "https:") {
            throw new Error(`Unsupported API URL protocol: ${this.baseURL.protocol}`);
        }

        const isHttps = this.baseURL.protocol === "https:";
        if (useHttps !== undefined && useHttps !== isHttps) {
            throw new Error(`useHttps must match the baseURL protocol (${this.baseURL.protocol})`);
        }

        // Keep a trailing slash so relative request paths resolve beneath a base path.
        if (!this.baseURL.pathname.endsWith("/")) this.baseURL.pathname += "/";

        this.defaultHeaders = headers;
        this.client = isHttps ? https : http;
    }

    static json(res: Response, data: any, message = "Success", code = 200) {
        return res.status(code).json({
            status: "success",
            message,
            data
        });
    }

    static html(res: Response, data: any, code = 200) {
        return res.status(code).send(data);
    }

    request(method: string, path: string, body: any = null, headers: Headers = {}): Promise<{ status: number | undefined, data: any }> {
        return new Promise((resolve, reject) => {
            let url: URL;
            try {
                url = new URL(path, this.baseURL);
            } catch (error) {
                reject(error);
                return;
            }

            const options = {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json, text/html, text/plain",
                    ...this.defaultHeaders,
                    ...headers,
                },
            };
            const req = this.client.request(url, options, (res) => {
                let data = "";

                res.on("data", (chunk) => {
                    data += chunk;
                });

                res.on("end", () => {
                    const contentType = res.headers["content-type"] || "";
                    if (contentType.includes("application/json")) {
                        try {
                            const parsed = data ? JSON.parse(data) : {};
                            resolve({ status: res.statusCode, data: parsed });
                        } catch (err) {
                            resolve({ status: res.statusCode, data });
                        }
                    } else {
                        resolve({ status: res.statusCode, data });
                    }
                });
            });

            req.on("error", (err) => reject(err));

            if (body) {
                req.write(typeof body === "string" ? body : JSON.stringify(body));
            }

            req.end();
        });
    }

    get(path: string, headers: Headers = {}) {
        return this.request("GET", path, null, headers);
    }

    post(path: string, body: any, headers: Headers = {}) {
        return this.request("POST", path, body, headers);
    }

    put(path: string, body: any, headers: Headers = {}) {
        return this.request("PUT", path, body, headers);
    }

    patch(path: string, body: any, headers: Headers = {}) {
        return this.request("PATCH", path, body, headers);
    }

    delete(path: string, headers: Headers = {}) {
        return this.request("DELETE", path, null, headers);
    }
}

export default API;
