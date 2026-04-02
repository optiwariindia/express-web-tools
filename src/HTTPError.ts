export class HttpError extends Error {
    #code: number;

    constructor(message: string, code = 500) {
        super(message);
        this.#code = code;
    }

    get code(): number {
        return this.#code;
    }
}