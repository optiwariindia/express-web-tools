import { Model, Document, PopulateOptions } from 'mongoose';
import { Request } from 'express';

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

    get commonFilters() {
        return {
            isActive: true,
            isDeleted: false,
            origin: this.request.origin
        }
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
        let temp = await this.#model.findOne(match);
        if (!temp) return await this.create(upsert);
        return await this.update((temp as any)._id, upsert);
    }

    async create(data: any): Promise<T> {
        try {
            let temp = {
                created: {
                    By: this.request.user._id,
                    From: this.request.clientIP
                },
                ...data,
                origin: this.request.origin,
            };
            const newItem = await this.#model.create(temp);
            return newItem;
        } catch (error: any) {
            throw new Error('Error creating item: ' + error.message);
        }
    }

    async read(id: string, populateFields: PopulateOptions | (string | PopulateOptions)[] | null = null): Promise<T | null> {
        try {
            let item;
            if (!populateFields)
                item = await this.#model.findById(id);
            else
                item = await this.#model.findById(id).populate(populateFields);
            if (!item) {
                throw new Error('Item not found');
            }
            return item;
        } catch (error: any) {
            throw new Error('Error reading item: ' + error.message);
        }
    }

    async update(id: string, data: any): Promise<T | null> {
        try {
            const updatedItem = await this.#model.findByIdAndUpdate(id, { ...data, updated: { By: this.request.user._id, From: this.request.clientIP } }, { new: true });
            if (!updatedItem) {
                throw new Error('Item not found');
            }
            return updatedItem;
        } catch (error: any) {
            throw new Error('Error updating item: ' + error.message);
        }
    }

    async activate(id: string): Promise<T | null> {
        const activatedItem = await this.#model.findByIdAndUpdate(id, { isActive: true, updated: { By: this.request.user._id, From: this.request.clientIP } });
        if (!activatedItem) {
            throw new Error('Item not found');
        }
        return activatedItem;
    }

    async deactivate(id: string): Promise<T | null> {
        const deactivatedItem = await this.#model.findByIdAndUpdate(id, { isActive: false, updated: { By: this.request.user._id, From: this.request.clientIP } });
        if (!deactivatedItem) {
            throw new Error('Item not found');
        }
        return deactivatedItem;
    }

    async delete(id: string): Promise<T | null> {
        try {
            const deletedItem = await this.#model.findByIdAndUpdate(id, { isDeleted: true, deleted: { At: new Date(), By: this.request.user._id } });
            if (!deletedItem) {
                throw new Error('Item not found');
            }
            return deletedItem;
        } catch (error: any) {
            throw new Error('Error deleting item: ' + error.message);
        }
    }

    async list(query: any = {}, populateFields: PopulateOptions | (string | PopulateOptions)[] | null = null, sort: any = {}, project: any = null): Promise<T[]> {
        try {
            let sortOrder = { isActive: -1, sortOrder: -1, ...sort, createdAt: -1, };
            let temp = this.#model.find({
                isActive: true,
                isDeleted: false,
                ...query,
                origin: this.request.origin
            });
            temp = temp.sort(sortOrder);
            if (populateFields) temp = temp.populate(populateFields);
            if (!!project) temp = temp.select(project);

            return await temp.exec();
        } catch (error: any) {
            throw new Error('Error listing items: ' + error.message);
        }
    }

    async count(query: any = {}): Promise<number> {
        try {
            const count = await this.#model.countDocuments({ isActive: true, isDeleted: false, ...query, origin: this.request.origin });
            return count;
        } catch (error: any) {
            throw new Error('Error counting items: ' + error.message);
        }
    }

    async findOne(query: any, populateFields: PopulateOptions | (string | PopulateOptions)[] | null = null): Promise<T | null> {
        try {
            if (!populateFields)
                return await this.#model.findOne({ isActive: true, isDeleted: false, ...query, origin: this.request.origin });
            return await this.#model.findOne({ isActive: true, isDeleted: false, ...query, origin: this.request.origin }).populate(populateFields);
        } catch (error: any) {
            throw new Error('Error finding item: ' + error.message);
        }
    }

    async cleanup() {
        try {
            const deletedItem = await this.#model.deleteMany({});
            if (!deletedItem) {
                throw new Error('Item not found');
            }
            return deletedItem;
        } catch (error: any) {
            throw new Error('Error deleting item: ' + error.message);
        }
    }
}