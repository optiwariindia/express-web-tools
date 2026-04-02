# express-web-tools

A lightweight framework-style library for Express applications using Mongoose. Includes reusable classes such as CrudController, CrudRouter, MongooseSchema, and JWT helpers to enforce consistent API structure and reduce boilerplate.

## Installation

To install `express-web-tools`, use npm:

```bash
npm install express-web-tools
```

## Usage

### `CrudController`

A base controller for CRUD operations on Mongoose models.

```typescript
import { CrudController } from 'express-web-tools';
import { Model, Document } from 'mongoose';

interface MyDocument extends Document {
    name: string;
    // ... other properties
}

class MyController extends CrudController<MyDocument> {
    constructor(model: Model<MyDocument>) {
        super(model);
    }
    // You can override or add custom methods here
}

// Example:
// const myController = new MyController(MyModel);
// const newItem = await myController.create({ name: "Test Item" });
```

### `CrudRoutes`

Generates Express routes for CRUD operations using a `CrudController`.

```typescript
import { CrudRoutes, CrudController } from 'express-web-tools';
import { Router } from 'express';
import { Model, Document } from 'mongoose';

interface MyDocument extends Document {
    name: string;
    // ... other properties
}

// Assume MyModel is a Mongoose Model and myController is an instance of CrudController<MyDocument>
// const myCrudRoutes = new CrudRoutes<MyDocument>('/api/my-resource', myController);
// const router: Router = myCrudRoutes.publish();
// app.use('/', router);
```

### `ExpressServer`

A utility class to set up and manage an Express server.

```typescript
import { ExpressServer } from 'express-web-tools';
import express from 'express';

const app = new ExpressServer();

// Add middleware
app.addMiddleware(express.json());

// Set up views (optional)
app.views('pug', './views');

// Add routes
// app.addRoute('/api', myCrudRouter);

// Start the server
// app.start(3000);
```

### `fsLogger`

A file system-based logger with archiving capabilities.

```typescript
import { fsLogger } from 'express-web-tools';

fsLogger.Log('This is a log message.');
fsLogger.Log('User logged in', { userId: '123', ip: '192.168.1.1' });

// To archive logs (e.g., weekly, as configured internally)
// await fsLogger.Archive();
```

### `Token`

Utility for generating and verifying JWT tokens.

```typescript
import { Token } from 'express-web-tools';

const userPayload = { id: 'user123', role: 'admin' };
const jwtToken = Token.generate(userPayload, '1h'); // Token expires in 1 hour

try {
    const decoded = Token.verify(jwtToken);
    console.log('Decoded token:', decoded);
} catch (error) {
    console.error('Token verification failed:', error.message);
}
```

### `Mutate`

Deep clones an object using JSON serialization.

```typescript
import { Mutate } from 'express-web-tools';

const originalObject = { a: 1, b: { c: 2 } };
const clonedObject = Mutate(originalObject);

clonedObject.b.c = 3;
console.log('Original:', originalObject); // { a: 1, b: { c: 2 } }
console.log('Cloned:', clonedObject);     // { a: 1, b: { c: 3 } }
```

### `HttpError`

A custom HTTP error class.

```typescript
import { HttpError } from 'express-web-tools';

try {
    throw new HttpError('Resource not found', 404);
} catch (error) {
    if (error instanceof HttpError) {
        console.error(`HTTP Error: ${error.message}, Code: ${error.code}`);
    } else {
        console.error('An unexpected error occurred:', error);
    }
}
```

### `MongooseModel`

A wrapper for Mongoose schemas and models, adding common fields and hooks.

```typescript
import { MongooseModel } from 'express-web-tools';
import mongoose, { Schema, Document } from 'mongoose';

interface UserDocument extends Document {
    username: string;
    email: string;
}

const userSchema = new Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
});

const userMongooseModel = new MongooseModel<UserDocument>(
    'User',
    userSchema
);

const User = userMongooseModel.model(); // This is your Mongoose Model
```

## API Reference

The library exposes the following main components:

*   **`fsLogger`**: A singleton instance for file system logging.
*   **`CrudController<T extends Document>`**: Generic class for Mongoose CRUD operations.
*   **`CrudRoutes<T extends Document>`**: Generic class to generate Express routes for CRUD.
*   **`MongooseModel<T extends Document>`**: Generic class to define Mongoose models with extended features.
*   **`ExpressServer`**: Class to set up and manage an Express application.
*   **`HttpError`**: Custom error class for HTTP-specific errors.
*   **`Token`**: Object containing `generate` and `verify` functions for JWT.
*   **`Mutate`**: Function for deep cloning objects.

## Keywords

express, mongoose, crud, crud-controller, crud-router, rest-api, api-framework, jwt, authentication, authorization, middleware, schema, validation, boilerplate-reduction, nodejs

## License

This project is licensed under the ISC License.
