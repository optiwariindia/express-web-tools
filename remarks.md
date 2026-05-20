# Project Remarks & Suggestions

This document outlines observations and suggested improvements for the `express-web-tools` library.

## 1. Dependency Management & Configuration
- **JWT Secret**: Added `Token.config()` to allow programmatic configuration of the secret and optional secret overrides in `generate` and `verify`. [RESOLVED]
- **Log Path**: `FSLogger` class is now exported, and the default instance uses `process.cwd()`. [RESOLVED]
- **Peer Dependencies**: `express` and `mongoose` have been moved to `peerDependencies` with broadened version ranges (`express: >=4.0.0`, `mongoose: >=6.0.0`) to avoid version conflicts in consumer projects. [RESOLVED]

## 2. Robustness & Error Handling
- **Request Metadata**: `CrudController` now includes `protected validateRequest()` and `validateUser()` methods. These enforce the presence of `origin` and `user._id` while allowing subclasses to override this behavior if those fields are optional. [RESOLVED]
- **Error Wrapping**: `CrudController` methods now wrap errors with standardized prefixes (e.g., `[CrudController Error]:`) while preserving the original error message. [RESOLVED]
- **Validation**: There is still no built-in validation (e.g., using Joi or Zod) for incoming data in `CrudController.create` or `CrudController.update`.

## 3. Singleton Patterns
- **EventStream**: The `EventStream` class is now exported alongside the singleton instance, allowing users to create private buses while still providing a global `eventStream`. [RESOLVED]
- **fsLogger**: The `FSLogger` class is now exported alongside the singleton instance, allowing multiple loggers if needed. [RESOLVED]

## 4. Performance & Modern Standards
- **Deep Cloning**: `Mutate.ts` now uses the modern `structuredClone` (with a `JSON` fallback) for significantly better performance and robustness with `Date`, `RegExp`, etc. [RESOLVED]
- **fsLogger Interval**: The weekly `setInterval` was removed in favor of on-demand file creation/checks, preventing potential memory leaks. [RESOLVED]

## 5. Type Safety
- **Use of `any`**: There are several places where `any` is used (e.g., `CustomRequest`, `EventPayload`, `query` parameters). Defining more specific interfaces or using generics would improve the developer experience and catch bugs at compile-time.
- **Mongoose Types**: Some types in `MongooseModel` are marked as `any[]` (e.g., `#index`). Using Mongoose's built-in types would be safer.

## 6. Architectural Suggestions
- **Dependency Injection**: Instead of classes like `CrudRoutes` internally instantiating things or relying on global state, consider more dependency injection to make the components more testable and decoupled.
- **Response Helper**: The `static json` and `static html` methods in `API.ts` are very useful but feel slightly out of place in a class meant for making *outgoing* requests. Moving them to a `ResponseHelper` or similar would be cleaner.
- **Audit Field Customization**: `MongooseModel` now accepts a `ModelConfig` to enable/disable `softDelete`, `multitenant`, `auditEnforce`, and `timestamps`. `CrudController` automatically adapts its logic and validations based on this configuration. [RESOLVED]

- **Middleware Support**: `CrudRoutes` now supports a `CrudMiddleware` configuration to inject global and per-endpoint middlewares (e.g., for authentication, authorization, and validation). [RESOLVED]

## 7. Minor Code Issues
- **`API` constructor error**: In `API.ts`, the constructor catches errors but only `console.log`s them. This might lead to an improperly initialized instance that fails later.

## 8. Missing Exports
- **`EventStream` not exported**: `EventStream.ts` is now properly exported in `src/index.ts`. [RESOLVED]

## 9. Mongoose Version Compatibility
- **`findOneAndUpdate` Options**: `CrudController` now dynamically selects update options based on the Mongoose version. It uses `returnDocument: 'after'` for Mongoose v6+ and `new: true` for older versions to ensure consistency in returning the updated document. [RESOLVED]
