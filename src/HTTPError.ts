export class HttpError extends Error {
    #code: number;

    constructor(code: number, message: string = "Internal Server Error") {
        super(message);
        this.#code = code;
    }

    get code(): number {
        return this.#code;
    }
}