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

export default class MongooseModel<T extends Document> {
    #modelName: string;
    #schema: Schema;
    #index: any[]; // mongoose.IndexDefinition[] | null;
    #hooks: Hooks | null;

    constructor(
        modelName: string,
        schema: Schema,
        index: any[] | null = null, // mongoose.IndexDefinition[] | null = null,
        hooks: Hooks | null = null
    ) {
        this.#modelName = modelName;
        this.#schema = schema;
        this.#index = index || [];
        this.#hooks = hooks;
    }

    addIndex(newIndex: any) { // newIndex: mongoose.IndexDefinition
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

    model(): Model<T> {
        const modelName = this.#modelName;
        const schema = this.#schema;
        const index = this.#index;
        const hooks = this.#hooks;

        const schemaObject = new mongoose.Schema<T>(
            {
                ...schema.obj, // Use .obj to get the schema definition
                origin: {
                    type: String,
                    required: true,
                },
                sortOrder: {
                    type: Number,
                    default: 0,
                    select: true
                },
                isActive: {
                    type: Boolean,
                    default: true,
                    select: false
                },
                isDeleted: {
                    type: Boolean,
                    default: false,
                    select: false
                },
                deleted: {
                    At: {
                        type: Date
                    },
                    By: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "User"
                    }
                },
                created: {
                    By: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "User",
                    },
                    From: {
                        type: String,
                    },
                },
                updated: {
                    By: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "User",
                    },
                    From: {
                        type: String
                    }
                }
            },
            {
                timestamps: true,
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

        if (index && index.length > 0) {
            index.forEach((item) => {
                schemaObject.index(item); // Corrected: passing item directly
            });
        }
        schemaObject.index({ sortOrder: 1, isActive: 1, isDeleted: 1 });

        if (hooks && hooks.pre) {
            Object.keys(hooks.pre).forEach((hook) => {
                if (hooks.pre) { // Additional check
                    schemaObject.pre(hook as any, hooks.pre[hook] as any);
                }
            });
        }
        if (hooks && hooks.post) {
            Object.keys(hooks.post).forEach((hook) => {
                if (hooks.post) { // Additional check
                    schemaObject.post(hook as any, hooks.post[hook] as any);
                }
            });
        }
        if (hooks && hooks.method) {
            Object.keys(hooks.method).forEach((hook) => {
                if (hooks.method) { // Additional check
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