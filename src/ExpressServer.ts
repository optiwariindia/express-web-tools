import express, { Express, Router, Request, Response, NextFunction } from "express";
import fsLogger from "./fsLogger.js";

export default class ExpressServer {
    #app: Express;

    constructor() {
        this.#app = express();
    }

    views(engine = "twig", path = "views") {
        this.#app
            .set("view-engine", engine)
            .set("views", path);
    }

    addMiddleware(callback: (req: Request, res: Response, next: NextFunction) => void) {
        this.#app.use(callback);
    }

    addRoute(endpoint: string, router: Router) {
        this.#app.use(endpoint, router);
    }

    errorHandler(errorHandlerFunction: (err: any, req: Request, res: Response, next: NextFunction) => void) {
        this.#app.use(errorHandlerFunction);
    }

    fallbackRouter(fallbackFunction: (req: Request, res: Response) => void) {
        this.#app.use(fallbackFunction);
    }

    start(port: number) {
        this.#app.listen(port, () => {
            fsLogger.Log(`Server started on port ${port}`);
        });
    }
}