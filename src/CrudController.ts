import { Model, Document, PopulateOptions } from 'mongoose';
import { Request } from 'express';
import { ModelConfig } from './MongooseModel.js';

interface CustomRequest extends Request {
    user?: any;
    origin?: any;
    clientIP?: any;
}

export default class CrudController<T extends Document> {
    #model: Model<T>;
    _request: CustomRequest = {} as CustomRequest;

    constructor(model: Model<T>) {
        this.#model = model;
    }

    get config(): ModelConfig {
        return (this.#model.schema as any)._config || {
            softDelete: true,
            multitenant: true,
            auditEnforce: true,
            timestamps: true
        };
    }

    /**
     * Validates that the request has an origin if multitenant is enabled.
     */
    protected validateRequest(): void {
        if (this.config.multitenant && !this.request?.origin) {
            throw new Error("[CrudController Error]: Request 'origin' is missing and is required for this operation.");
        }
    }

    /**
     * Validates that the request has user information if auditEnforce is enabled.
     */
    protected validateUser(): void {
        if (this.config.auditEnforce && !this.request?.user?._id) {
            throw new Error("[CrudController Error]: User identification ('user._id') is missing and is required for this operation.");
        }
    }

    get commonFilters() {
        const filters: any = {
            isActive: true
        };

        if (this.config.softDelete) {
            filters.isDeleted = false;
        }

        if (this.config.multitenant) {
            this.validateRequest();
            filters.origin = this.request.origin;
        }

        return filters;
    }

    set request(req: CustomRequest) {
        this._request = req;
    }

    get request(): CustomRequest {
        return this._request;
    }

    get model(): Model<T> {
        return this.#model;
    }

    set model(model: Model<T>) {
        this.#model = model;
    }

    async upsert(match: any, upsert: any) {
        const query = { ...match };
        if (this.config.multitenant) {
            this.validateRequest();
            query.origin = this.request.origin;
        }

        let temp = await this.#model.findOne(query);
        if (!temp) return await this.create(upsert);
        return await this.update((temp as any)._id, upsert);
    }

    async create(data: any): Promise<T> {
        this.validateRequest();
        this.validateUser();
        try {
            let temp = { ...data };

            if (this.config.auditEnforce) {
                temp.created = {
                    By: this.request.user._id,
                    From: this.request.clientIP || 'unknown'
                };
            }

            if (this.config.multitenant) {
                temp.origin = this.request.origin;
            }

            const newItem = await this.#model.create(temp);
            return newItem;
        } catch (error: any) {
            throw new Error(`[CrudController Error]: ${error.message}`);
        }
    }

    async read(id: string, populateFields: PopulateOptions | (string | PopulateOptions)[] | null = null): Promise<T | null> {
        const query: any = { _id: id };
        if (this.config.multitenant) {
            this.validateRequest();
            query.origin = this.request.origin;
        }

        try {
            let item;
            if (!populateFields)
                item = await this.#model.findOne(query);
            else
                item = await this.#model.findOne(query).populate(populateFields);
            
            if (!item) {
                throw new Error('Item not found');
            }
            return item;
        } catch (error: any) {
            throw new Error(`[CrudController Error]: ${error.message}`);
        }
    }

    async update(id: string, data: any): Promise<T | null> {
        this.validateRequest();
        this.validateUser();

        const query: any = { _id: id };
        if (this.config.multitenant) {
            query.origin = this.request.origin;
        }

        try {
            const updatePayload: any = { ...data };
            if (this.config.auditEnforce) {
                updatePayload.updated = { 
                    By: this.request.user._id, 
                    From: this.request.clientIP || 'unknown' 
                };
            }

            const updatedItem = await this.#model.findOneAndUpdate(
                query,
                updatePayload,
                { new: true }
            );
            if (!updatedItem) {
                throw new Error('Item not found');
            }
            return updatedItem;
        } catch (error: any) {
            throw new Error(`[CrudController Error]: ${error.message}`);
        }
    }

    async activate(id: string): Promise<T | null> {
        this.validateRequest();
        this.validateUser();

        const query: any = { _id: id };
        if (this.config.multitenant) {
            query.origin = this.request.origin;
        }

        try {
            const updatePayload: any = { isActive: true };
            if (this.config.auditEnforce) {
                updatePayload.updated = { 
                    By: this.request.user._id, 
                    From: this.request.clientIP || 'unknown' 
                };
            }

            const activatedItem = await this.#model.findOneAndUpdate(
                query,
                updatePayload,
                { new: true }
            );
            if (!activatedItem) {
                throw new Error('Item not found');
            }
            return activatedItem;
        } catch (error: any) {
            throw new Error(`[CrudController Error]: ${error.message}`);
        }
    }

    async deactivate(id: string): Promise<T | null> {
        this.validateRequest();
        this.validateUser();

        const query: any = { _id: id };
        if (this.config.multitenant) {
            query.origin = this.request.origin;
        }

        try {
            const updatePayload: any = { isActive: false };
            if (this.config.auditEnforce) {
                updatePayload.updated = { 
                    By: this.request.user._id, 
                    From: this.request.clientIP || 'unknown' 
                };
            }

            const deactivatedItem = await this.#model.findOneAndUpdate(
                query,
                updatePayload,
                { new: true }
            );
            if (!deactivatedItem) {
                throw new Error('Item not found');
            }
            return deactivatedItem;
        } catch (error: any) {
            throw new Error(`[CrudController Error]: ${error.message}`);
        }
    }

    async delete(id: string): Promise<T | null> {
        this.validateRequest();
        this.validateUser();

        const query: any = { _id: id };
        if (this.config.multitenant) {
            query.origin = this.request.origin;
        }

        try {
            const updatePayload: any = {};
            if (this.config.softDelete) {
                updatePayload.isDeleted = true;
                updatePayload.deleted = { At: new Date(), By: this.request?.user?._id };
            }

            const deletedItem = await this.#model.findOneAndUpdate(
                query,
                this.config.softDelete ? updatePayload : { $set: { isDeleted: true } }, // fallback if softDelete logic differs
                { new: true }
            );

            // If softDelete is disabled in config, but we called delete, 
            // the user might expect a hard delete or it might fail if field doesn't exist.
            // For now, we respect the softDelete flag.
            if (!this.config.softDelete) {
                 return await this.#model.findOneAndDelete(query);
            }

            if (!deletedItem) {
                throw new Error('Item not found');
            }
            return deletedItem;
        } catch (error: any) {
            throw new Error(`[CrudController Error]: ${error.message}`);
        }
    }

    async list(query: any = {}, populateFields: PopulateOptions | (string | PopulateOptions)[] | null = null, sort: any = {}, project: any = null): Promise<T[]> {
        try {
            let sortOrder = { isActive: -1, sortOrder: -1, ...sort } as any;
            if (this.config.timestamps) {
                sortOrder.createdAt = -1;
            }

            let temp = this.#model.find({
                ...this.commonFilters,
                ...query
            });
            temp = temp.sort(sortOrder);
            if (populateFields) temp = temp.populate(populateFields);
            if (!!project) temp = temp.select(project);

            return await temp.exec();
        } catch (error: any) {
            throw new Error(`[CrudController Error]: ${error.message}`);
        }
    }

    async count(query: any = {}): Promise<number> {
        try {
            const count = await this.#model.countDocuments({ ...this.commonFilters, ...query });
            return count;
        } catch (error: any) {
            throw new Error(`[CrudController Error]: ${error.message}`);
        }
    }

    async findOne(query: any, populateFields: PopulateOptions | (string | PopulateOptions)[] | null = null): Promise<T | null> {
        try {
            if (!populateFields)
                return await this.#model.findOne({ ...this.commonFilters, ...query });
            return await this.#model.findOne({ ...this.commonFilters, ...query }).populate(populateFields);
        } catch (error: any) {
            throw new Error(`[CrudController Error]: ${error.message}`);
        }
    }

    async cleanup() {
        const query: any = {};
        if (this.config.multitenant) {
            this.validateRequest();
            query.origin = this.request.origin;
        }

        try {
            return await this.#model.deleteMany(query);
        } catch (error: any) {
            throw new Error(`[CrudController Error]: ${error.message}`);
        }
    }
}
