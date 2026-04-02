import { asyncHandler } from "./asyncHandler.js";
import { Router, Request, Response } from "express";
import CrudController from "./CrudController.js";
import { Document } from "mongoose";

export default class CrudRoutes<T extends Document> {
    #router: Router;
    #endpoint: string;
    #controller: CrudController<T>;

    constructor(endpoint: string, controller: CrudController<T>) {
        this.#router = Router();
        this.#endpoint = endpoint;
        this.#controller = controller;
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

    publish(): Router {
        this.#router
            .route(this.#endpoint)
            .get(
                asyncHandler(this.listAll.bind(this))
            )
            .post(
                asyncHandler(this.list.bind(this))
            )
            .put(
                asyncHandler(this.add.bind(this))
            );
        this.#router
            .route(`${this.#endpoint}/:id`)
            .get(
                asyncHandler(this.read.bind(this))
            )
            .put(
                asyncHandler(this.update.bind(this))
            )
            .delete(
                asyncHandler(this.delete.bind(this))
            );
        return this.#router;
    }
}
