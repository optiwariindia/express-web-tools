# Suggestions for Removing Specific Version Dependencies

## Current State
The library currently has `express` and `mongoose` listed as direct `dependencies` in `package.json`:
- `express`: `^4.18.2`
- `mongoose`: `^8.0.0`

This forces consumers to use these specific versions (or compatible ranges), which can lead to version conflicts (multiple versions of the same library in `node_modules`) if the consumer project uses different versions.

## Proposed View
As a library designed to be used within other Express/Mongoose applications, `express-web-tools` should not bundle or strictly require a specific version of these "framework" libraries. Instead, it should:
1.  **Treat them as Peer Dependencies:** Expect the consumer to provide them.
2.  **Support a Broad Range:** Allow multiple major versions if the codebase is compatible.

## Plan of Action

### 1. Update `package.json`
- Move `express` and `mongoose` from `dependencies` to `peerDependencies`.
- Broaden the version ranges in `peerDependencies`:
    - `express`: `>=4.0.0` (Express 4 is very stable and widely used).
    - `mongoose`: `>=6.0.0` (Supporting 6, 7, and 8).
- Keep (or update) them in `devDependencies` to ensure the library can still be built and tested locally.
- Fix type definition version mismatches in `devDependencies`.

### 2. Verify Compatibility
- The current codebase uses standard features of Express (Router, Request, Response, Middleware) and Mongoose (Schema, Model, Hooks, Querying). These have remained largely consistent across recent major versions.
- **Mongoose 6 vs 7 vs 8:** Key differences are often around TypeScript types and internal handling, but the core API used in `MongooseModel.ts` and `CrudController.ts` appears compatible.

### 3. Implementation Steps
1.  **Refactor `package.json`**:
    ```json
    "peerDependencies": {
      "express": ">=4.0.0",
      "mongoose": ">=6.0.0"
    },
    "devDependencies": {
      "express": "^4.18.2",
      "mongoose": "^8.0.0",
      ...
    }
    ```
2.  **Remove from `dependencies`**:
    ```bash
    npm uninstall express mongoose
    ```
3.  **Install as `devDependencies`**:
    ```bash
    npm install express mongoose --save-dev
    ```

## Benefits
- **Reduced Bundle Size/Complexity:** No risk of installing duplicate versions in the consumer's `node_modules`.
- **Flexibility:** Consumers can upgrade their own `express` or `mongoose` versions without waiting for a library update, as long as the API remains compatible.
- **Better Ecosystem Alignment:** This is the standard practice for middleware and extension libraries in the Node.js ecosystem.

---
**Lead Engineer:** Sanket
**Date:** May 8, 2026
