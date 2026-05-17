# express-web-tools

A lightweight framework-style library for Express applications using Mongoose. It provides reusable classes and utilities to enforce a consistent API structure, automate CRUD operations, and significantly reduce boilerplate code.

## Key Features

- **Configurable Mongoose Models**: Automatically add audit fields, soft-delete logic, and multitenancy support.
- **Automated CRUD**: Generate routes and controllers with built-in validation and metadata tracking.
- **Modern Performance**: Uses `structuredClone` for deep object mutation.
- **Flexible Logging**: File-system logger with support for multiple instances and custom paths.
- **Event Management**: Application-wide or private async event streams.
- **JWT Helpers**: Simple, configurable token generation and verification.

---

## Usage

### 1. `MongooseModel` & Configuration

Define your schemas with automatic audit and multitenancy support.

```typescript
import { MongooseModel } from 'express-web-tools';
import { Schema, Document } from 'mongoose';

interface IUser extends Document {
    username: string;
}

const userSchema = new Schema({ username: String });

// Configuration options (All default to true)
const config = {
    softDelete: true,    // Adds isDeleted flag and deleted metadata
    multitenant: true,   // Adds origin field for data isolation
    auditEnforce: true,  // Adds created/updated (By/From) metadata
    timestamps: true     // Enables native Mongoose timestamps
};

const userModelWrapper = new MongooseModel<IUser>('User', userSchema, null, null, config);
const User = userModelWrapper.model();
```

### 2. `CrudController`

The controller automatically adapts its logic based on the `MongooseModel` configuration.

```typescript
import { CrudController } from 'express-web-tools';
import { User } from './models/User';

class UserController extends CrudController<IUser> {
    constructor() {
        super(User);
    }
    // Logic for 'origin' and 'user._id' validation is handled automatically
}
```

### 3. `CrudRoutes`

Generate standard RESTful endpoints for your controller with optional global and local middlewares.

```typescript
import { CrudRoutes, CrudMiddleware } from 'express-web-tools';
import userController from './controllers/UserController';
import { authenticate, authorize, validateUser } from './middleware';

const middleware: CrudMiddleware = {
    global: [authenticate],     // Applied to all routes
    add: [validateUser],         // Specific to POST /users
    delete: [authorize('admin')] // Specific to DELETE /users/:id
};

const userRoutes = new CrudRoutes('/users', userController, middleware);

// Dynamic middleware addition
userRoutes.addMiddleware('global', [anotherMiddleware]);
userRoutes.addMiddleware('add', validatePayload);

const router = userRoutes.publish();

// Routes generated:
// GET    /users     -> [authenticate] -> List all
// POST   /users     -> [authenticate, validateUser] -> Create new
// DELETE /users/:id -> [authenticate, authorize('admin')] -> Delete
```

### 4. `EventStream`

Singleton or instance-based event emitter with async support.

```typescript
import { eventStream, EventStream } from 'express-web-tools';

// Using the global singleton
eventStream.onEvent('log', async (data) => console.log(data));
eventStream.emitEvent('log', 'Hello World');

// Or create a private stream
const privateBus = new EventStream();
```

### 5. `FSLogger`

Manage application logs with ease.

```typescript
import { fsLogger, FSLogger } from 'express-web-tools';

// Global logger (uses process.env.logpath or ./logs)
fsLogger.Log('Action performed', { userId: 1 });

// Custom logger
const dbLogger = new FSLogger('./logs/db.log');
```

### 6. `Token` (JWT)

Configure your secret once and use it everywhere.

```typescript
import { Token } from 'express-web-tools';

Token.config('your-super-secret-key');

const token = Token.generate({ id: '123' });
const payload = Token.verify(token);
```

---

## API Reference Summary

### `ExpressServer`
A wrapper to simplify Express app setup, including middleware, routing, and view engines.
```typescript
import { ExpressServer } from 'express-web-tools';

const server = new ExpressServer();
server.views('twig', './views');
server.addMiddleware(express.json());
server.addRoute('/api/v1', apiRouter);
server.start(3000);
```

### `API`
Static helpers for standard Express responses and a built-in HTTP/HTTPS client.
```typescript
// Response helpers
API.json(res, { foo: 'bar' }, 'Success message', 200);
API.html(res, '<h1>Hello</h1>');

// HTTP Client
const client = new API({ baseURL: 'https://api.example.com', useHttps: true });
const { status, data } = await client.get('/users');
```

### `MongooseModel` (Advanced)
Easily add hooks, virtuals, and static methods to your models.
```typescript
const userModelWrapper = new MongooseModel<IUser>('User', userSchema);
userModelWrapper.addPreHook('save', function(next) {
    console.log('Saving user...');
    next();
});
userModelWrapper.addStatic('findByUsername', function(username) {
    return this.findOne({ username });
});
const User = userModelWrapper.model();
```

### Other Utilities
- **`Mutate`**: High-performance deep cloning using `structuredClone`.
- **`HttpError`**: Standardized error class for throwing HTTP-specific status codes.
- **`asyncHandler`**: Middleware to wrap async routes and catch errors automatically.
- **`configTest`**: Utility to validate presence of essential environment variables on startup.

### `configTest`
Ensure your application has all required environment variables before starting.
```typescript
import { configTest } from 'express-web-tools';

// Throws a descriptive error if variables are missing
configTest(['MONGO_URI', 'JWT_SECRET', 'PORT']);
```

## Installation

```bash
npm install express-web-tools
```

> **Note**: `express` and `mongoose` are listed as **peer dependencies**. Ensure they are installed in your project:
> ```bash
> npm install express mongoose
> ```

## License

ISC
