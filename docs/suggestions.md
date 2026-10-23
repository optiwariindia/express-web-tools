# Code Review Updates

Work through these items sequentially. Each item should be implemented and reviewed before starting the next.

## 1. Enforce tenant scoping on record mutations — High — Complete
- Add the current tenant (`origin`) to the database filters used by `update`, `delete`, `activate`, `deactivate`, `moveUp`, and `moveDown` when multitenancy is enabled.
- Ensure a missing or cross-tenant record produces the existing not-found behavior and cannot be modified.
- Review `upsert` and any other ID-based mutations for the same issue.
- Explicitly convert string IDs to `mongoose.Types.ObjectId` in the shared ID filter, and strip `origin` from direct and operator-style update payloads.

## 2. Prevent caller filters from overriding access filters — High — Complete
- Change `list`, `count`, and `findOne` so caller-supplied query fields cannot override enforced `origin`, `isActive`, or `isDeleted` filters.
- Conflicting fields are safely overridden by the controller's access filters.

## 3. Protect system-managed fields during updates — High - Complete
- Prevent update payloads from changing `origin`, deletion/activation state, sort order, timestamps, and audit metadata unless an explicit trusted API is intended to allow it.
- Keep server-generated audit fields authoritative.
- **Complete:** `allowSystemFieldUpdates` configures whether `sortOrder`, `isActive`, and `isDeleted` may be set through `update`; `origin` remains protected.

## 4. Make reorder operations safe — Medium — Complete
- Return not-found when the target item does not exist.
- Scope both the target and adjacent-item lookup/update to the current tenant.
- Find the nearest item in the requested direction rather than assuming sort orders are contiguous; leave boundary items and items with invalid sort orders unchanged.
- Swap both sort orders in a transaction with conditional updates to avoid concurrent reorder corruption. MongoDB transactions require a replica set or sharded cluster.

## 5. Correct API URL and protocol handling — Medium — Complete
- Select `http` or `https` from the parsed `baseURL` protocol, or validate that `useHttps` agrees with it.
- Build the request URL with URL resolution so base paths, leading slashes, query strings, and encoded path segments behave consistently.
- Reject unsupported protocols with a clear error.

## 6. Restore HTTPS certificate validation — Medium — Complete
- Removed the custom HTTPS agent that disabled certificate validation. HTTPS now uses Node's validated TLS defaults; there is no custom certificate option.

## 7. Remove shell interpolation from log archival — Medium — Complete
- Replaced the interpolated `tar`/`rm` command in `FSLogger.Archive()` with `spawn()` and an argument array.
- The source log is removed only after archive creation succeeds; archive and source-removal failures reject the promise.

## 8. Clean up CRUD behavior and dead code — Low
- Remove the unreachable second return in `list` and check whether `.select(null)` is intended when no projection is supplied.
- Remove error logging of full exceptions from CRUD methods (or route errors through a configurable logger) to avoid noisy or sensitive console output.
- Clarify the hard-delete path when `softDelete` is disabled; it currently performs an unnecessary update before deleting.

## 9. Verify each change
- Build after each sequential update and add focused regression coverage for tenant isolation, protected fields, reorder boundaries, URL composition, TLS defaults, and archive failures.
