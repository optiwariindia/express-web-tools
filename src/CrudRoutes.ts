import { asyncHandler } from "./asyncHandler.js";
import { Router, Request, Response, RequestHandler } from "express";
import CrudController from "./CrudController.js";
import { HttpError } from "./HTTPError.js";

export interface CrudMiddleware {
    global?: RequestHandler[];
    listAll?: RequestHandler[];
    list?: RequestHandler[];
    add?: RequestHandler[];
    read?: RequestHandler[];
    update?: RequestHandler[];
    delete?: RequestHandler[];
    order?: RequestHandler[];
}

export default class CrudRoutes<T> {
    #router: Router;
    #endpoint: string;
    #controller: CrudController<T>;
    #middleware: CrudMiddleware;

    constructor(endpoint: string, controller: CrudController<T>, middleware: CrudMiddleware = {}) {
        this.#router = Router();
        this.#endpoint = endpoint;
        this.#controller = controller;
        this.#middleware = middleware;
    }

    addMiddleware(type: keyof CrudMiddleware, middleware: RequestHandler | RequestHandler[]) {
        if (!this.#middleware[type]) {
            this.#middleware[type] = [];
        }
        if (Array.isArray(middleware)) {
            this.#middleware[type]!.push(...middleware);
        } else {
            this.#middleware[type]!.push(middleware);
        }
    }

    setRequest(req: Request) {
        this.#controller.request = req;
    }

    response(res: Response, data: any, message = "Success", code = 200) {
        return res.status(code).json({
            status: "success",
            message,
            data
        });
    }

    async listAll(req: Request, res: Response) {
        this.setRequest(req);
        let data = await this.#controller.list();
        return this.response(res, data, (req as any).overrideMessage ?? `Total ${data.length} records found`);
    }

    async list(req: Request, res: Response) {
        this.setRequest(req);
        let data = await this.#controller.list(req.body);
        return this.response(res, data, `Total ${data.length} records found`);
    }

    async add(req: Request, res: Response) {
        this.setRequest(req);
        let data = await this.#controller.create(req.body);
        return this.response(res, data, "Added successfully", 201);
    }

    async read(req: Request, res: Response) {
        this.setRequest(req);
        let data = await this.#controller.read(req.params.id as string);
        return this.response(res, data, "");
    }

    async update(req: Request, res: Response) {
        this.setRequest(req);
        let data = await this.#controller.update(req.params.id as string, req.body);
        return this.response(res, data, "Updated successfully");
    }

    async delete(req: Request, res: Response) {
        this.setRequest(req);
        let data = await this.#controller.delete(req.params.id as string);
        return this.response(res, data, "Deleted successfully");
    }
    async reorder(req: Request, res: Response) {
        this.setRequest(req);
        const { action } = req.body;
        if (!action) throw new HttpError(401, "Invalid request");
        let data;
        switch (action) {
            case "move-up":
                data = await this.moveUp(req.params.id as string);
                break;
            case "move-down":
                data = await this.moveDown(req.params.id as string);
                break;

            default:
                break;
        }
        return this.response(res, data, "");
    }
    async moveUp(id: string) {
        return await this.#controller.moveUp(id);
    }
    async moveDown(id: string) {
        return await this.#controller.moveDown(id);
    }
    publish(): Router {
        let endpoint = this.#endpoint;
        if (!endpoint.endsWith("/")) {
            endpoint += "/"
        }
        const m = this.#middleware;
        const g = m.global || [];

        this.#router
            .route(endpoint)
            .get(
                ...g,
                ...(m.listAll || []),
                asyncHandler(this.listAll.bind(this))
            )
            .post(
                ...g,
                ...(m.list || []),
                asyncHandler(this.list.bind(this))
            )
            .put(
                ...g,
                ...(m.add || []),
                asyncHandler(this.add.bind(this))
            );
        endpoint += ":id";
        this.#router
            .route(endpoint)
            .get(
                ...g,
                ...(m.read || []),
                asyncHandler(this.read.bind(this))
            )
            .put(
                ...g,
                ...(m.update || []),
                asyncHandler(this.update.bind(this))
            )
            .patch(
                ...g,
                ...(m.order || []),
                asyncHandler(this.reorder.bind(this))
            )
            .delete(
                ...g,
                ...(m.delete || []),
                asyncHandler(this.delete.bind(this))
            );

        return this.#router;
    }
}
