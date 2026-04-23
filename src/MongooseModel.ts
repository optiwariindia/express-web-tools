import mongoose, { Schema, Document, Model } from "mongoose";

type AnyFn = (...args: any[]) => any;

type StaticMethod<T extends Document> = (this: Model<T>, ...args: any[]) => any;

interface Hooks<T extends Document> {
    pre?: Record<string, AnyFn>;
    post?: Record<string, AnyFn>;
    method?: Record<string, AnyFn>;
    virtuals?: Record<string, AnyFn>;
    statics?: Record<string, StaticMethod<T>>;
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
    #hooks: Hooks<T> | null;
    #userSchema: string = "User";
    #config: ModelConfig;

    constructor(
        modelName: string,
        schema: Schema,
        index: any[] | null = null,
        hooks: Hooks<T> | null = null,
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

    // ---------------- Hooks Adders ----------------

    addPreHook(name: string, fn: AnyFn) {
        this.#hooks ??= {};
        this.#hooks.pre ??= {};
        this.#hooks.pre[name] = fn;
    }

    addPostHook(name: string, fn: AnyFn) {
        this.#hooks ??= {};
        this.#hooks.post ??= {};
        this.#hooks.post[name] = fn;
    }

    addMethod(name: string, fn: AnyFn) {
        this.#hooks ??= {};
        this.#hooks.method ??= {};
        this.#hooks.method[name] = fn;
    }

    addVirtual(name: string, fn: AnyFn) {
        this.#hooks ??= {};
        this.#hooks.virtuals ??= {};
        this.#hooks.virtuals[name] = fn;
    }

    addStatic(name: string, fn: StaticMethod<T>) {
        this.#hooks ??= {};
        this.#hooks.statics ??= {};
        this.#hooks.statics[name] = fn;
    }

    addIndex(newIndex: any) {
        this.#index.push(newIndex);
    }

    // ---------------- Base Schema ----------------

    baseSchema() {
        const schemaDef: any = {
            sortOrder: { type: Number, default: 0 },
            isActive: { type: Boolean, default: true, select: false }
        };

        if (this.#config.multitenant) {
            schemaDef.origin = { type: String, required: true };
        }

        if (this.#config.softDelete) {
            schemaDef.isDeleted = { type: Boolean, default: false, select: false };
        }

        return schemaDef;
    }

    // ---------------- Build Model ----------------

    model(): Model<T> {
        const schemaObject = new mongoose.Schema<T>(
            {
                ...this.#schema.obj,
                ...this.baseSchema()
            },
            {
                timestamps: this.#config.timestamps,
                versionKey: false,
                collection: this.#modelName,
                toJSON: { virtuals: true },
                toObject: { virtuals: true }
            }
        );

        // indexes
        this.#index.forEach(i => {
            if (Array.isArray(i)) {
                schemaObject.index(i[0], i[1]);
            } else {
                schemaObject.index(i);
            }
        });

        // hooks
        if (this.#hooks?.pre) {
            Object.entries(this.#hooks.pre).forEach(([k, v]) =>
                schemaObject.pre(k as any, v)
            );
        }

        if (this.#hooks?.post) {
            Object.entries(this.#hooks.post).forEach(([k, v]) =>
                schemaObject.post(k as any, v)
            );
        }

        // methods
        if (this.#hooks?.method) {
            Object.entries(this.#hooks.method).forEach(([k, v]) => {
                schemaObject.methods[k] = v;
            });
        }

        // statics ✅ FIXED
        if (this.#hooks?.statics) {
            Object.entries(this.#hooks.statics).forEach(([k, v]) => {
                (schemaObject.statics as any)[k] = v;
            });
        }

        // virtuals
        if (this.#hooks?.virtuals) {
            Object.entries(this.#hooks.virtuals).forEach(([k, v]) => {
                schemaObject.virtual(k).get(v as any);
            });
        }

        (schemaObject as any)._config = this.#config;

        return mongoose.model<T>(this.#modelName, schemaObject);
    }
}