import mongoose, { Schema, Document, Model } from "mongoose";

interface HookActions {
    [key: string]: Function;
}

interface Hooks {
    pre?: HookActions;
    post?: HookActions;
    method?: HookActions;
    virtuals?: HookActions;
}

export interface ModelConfig {
    softDelete?: boolean;
    multitenant?: boolean;
    auditEnforce?: boolean;
    timestamps?: boolean;
}

export default class MongooseModel<T extends Document> {
    #modelName: string;
    #schema: Schema;
    #index: any[];
    #hooks: Hooks | null;
    #userSchema: string = "User";
    #config: ModelConfig;

    get modelName() { return this.#modelName }
    get userSchema() { return this.#userSchema; }
    set userSchema(value: string) { this.#userSchema = value; }

    constructor(
        modelName: string,
        schema: Schema,
        index: any[] | null = null,
        hooks: Hooks | null = null,
        config: ModelConfig = {}
    ) {
        this.#modelName = modelName;
        this.#schema = schema;
        this.#index = index || [];
        this.#hooks = hooks;
        this.#config = {
            softDelete: true,
            multitenant: true,
            auditEnforce: true,
            timestamps: true,
            ...config
        };
    }

    addIndex(newIndex: any) {
        if (!this.#index) {
            this.#index = [];
        }
        this.#index.push(newIndex);
    }

    addPreHook(name: string, action: Function) {
        if (!this.#hooks) this.#hooks = {};
        if (!("pre" in this.#hooks)) this.#hooks = { ...this.#hooks, pre: {} };
        this.#hooks.pre = { ...this.#hooks.pre, [name]: action };
    }

    addPostHook(name: string, action: Function) {
        if (!this.#hooks) this.#hooks = {};
        if (!("post" in this.#hooks)) this.#hooks = { ...this.#hooks, post: {} };
        this.#hooks.post = { ...this.#hooks.post, [name]: action };
    }

    addMethod(name: string, action: Function) {
        if (!this.#hooks) this.#hooks = {};
        if (!("method" in this.#hooks)) this.#hooks = { ...this.#hooks, method: {} };
        this.#hooks.method = { ...this.#hooks.method, [name]: action };
    }

    addVirtuals(name: string, action: Function) {
        if (!this.#hooks) this.#hooks = {};
        if (!("virtuals" in this.#hooks)) this.#hooks = { ...this.#hooks, virtuals: {} };
        this.#hooks.virtuals = { ...this.#hooks.virtuals, [name]: action };
    }

    baseSchema() {
        const schemaDef: any = {
            sortOrder: {
                type: Number,
                default: 0,
                select: true
            },
            isActive: {
                type: Boolean,
                default: true,
                select: false
            }
        };

        if (this.#config.multitenant) {
            schemaDef.origin = {
                type: String,
                required: true,
            };
        }

        if (this.#config.softDelete) {
            schemaDef.isDeleted = {
                type: Boolean,
                default: false,
                select: false
            };
            schemaDef.deleted = {
                At: {
                    type: Date
                },
                By: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: this.#userSchema,
                }
            };
        }

        if (this.#config.auditEnforce) {
            schemaDef.created = {
                By: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: this.#userSchema,
                },
                From: {
                    type: String,
                },
            };
            schemaDef.updated = {
                By: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: this.#userSchema,
                },
                From: {
                    type: String
                }
            };
        }

        return schemaDef;
    }

    model(): Model<T> {
        const modelName = this.#modelName;
        const schema = this.#schema;
        const index = this.#index;
        const hooks = this.#hooks;

        const schemaObject = new mongoose.Schema<T>(
            {
                ...schema.obj,
                ...this.baseSchema()
            },
            {
                timestamps: this.#config.timestamps,
                versionKey: false,
                collection: modelName,
                toObject: {
                    virtuals: true,
                },
                toJSON: {
                    virtuals: true,
                },
            }
        );

        // Attached config to the model for reference in Controllers
        (schemaObject as any)._config = this.#config;

        if (index && index.length > 0) {
            index.forEach((item) => {
                schemaObject.index(item);
            });
        }

        const baseIndex: any = { sortOrder: 1, isActive: 1 };
        if (this.#config.softDelete) baseIndex.isDeleted = 1;
        schemaObject.index(baseIndex);

        if (hooks && hooks.pre) {
            Object.keys(hooks.pre).forEach((hook) => {
                if (hooks.pre) {
                    schemaObject.pre(hook as any, hooks.pre[hook] as any);
                }
            });
        }
        if (hooks && hooks.post) {
            Object.keys(hooks.post).forEach((hook) => {
                if (hooks.post) {
                    schemaObject.post(hook as any, hooks.post[hook] as any);
                }
            });
        }
        if (hooks && hooks.method) {
            Object.keys(hooks.method).forEach((hook) => {
                if (hooks.method) {
                    schemaObject.methods[hook] = hooks.method[hook];
                }
            });
        }
        if (hooks && hooks.virtuals) {
            Object.keys(hooks.virtuals).forEach((virtual) => {
                schemaObject.virtual(virtual).get(hooks.virtuals![virtual] as any);
            });
            schemaObject.set("toJSON", {
                virtuals: true,
            });
            schemaObject.set("toObject", {
                virtuals: true,
            });
        }
        return mongoose.model<T>(modelName, schemaObject);
    }
}
