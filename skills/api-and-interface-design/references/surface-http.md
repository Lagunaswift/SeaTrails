# Surface: HTTP and REST APIs

The shared principles translate onto HTTP with specific conventions that callers already expect from every other web API they've used. Meeting those expectations is free usability; violating them is gratuitous friction. This file is the HTTP translation of the principle files, not a replacement for them.

## Resources and verbs

REST models the interface as resources (nouns) acted on by a small set of HTTP methods (verbs), rather than as arbitrary actions:

- **URLs name resources, not actions.** `/users/4823` and `/users/4823/orders`, not `/getUser?id=4823` or `/createOrderForUser`. The method says what you're doing; the path says what to. An action verb in the URL usually signals you're tunnelling RPC through HTTP and losing the predictability REST gives callers.
- **Methods carry consistent meaning**, and callers rely on it: `GET` reads (and must be safe, no side effects), `POST` creates or triggers, `PUT` replaces, `PATCH` partially updates, `DELETE` removes. Using `GET` for something with side effects, or `POST` for a pure read, breaks caller and infrastructure assumptions (caching, retries, prefetching all assume `GET` is safe).
- **Collections and members follow a pattern**: `/orders` is the collection, `/orders/{id}` is a member, and the operations on each are predictable (`GET /orders` lists, `POST /orders` creates, `GET /orders/{id}` reads one, and so on). This consistency (see `consistency.md`) lets a caller who learns one resource predict all the others.

## Status codes: use the standard semantics

HTTP status codes are a shared vocabulary for outcomes; callers and infrastructure both depend on them being used correctly (this is the HTTP form of `failure-as-contract.md`):

- **2xx success**, **4xx the caller's fault**, **5xx your fault.** This top-level split tells the caller whether to fix their request or retry/escalate. Returning `200` with an error in the body, or `500` for a validation problem, breaks the caller's ability to react correctly and defeats every tool that reads status.
- **Use the specific codes callers distinguish**: `400` (malformed), `401` (not authenticated), `403` (authenticated but not allowed), `404` (not found), `409` (conflict), `422` (validation failed), `429` (rate limited). Each tells the caller a different thing to do. Collapsing them all into `400` or `500` denies them that.
- **`4xx` is permanent, `5xx` and `429` are often transient**, which maps onto the retry decision in the error-handling skill. Callers use the code to decide whether retrying is sane; correct codes make their resilience logic work.

## Response and error shape

- **Consistent success shape** across endpoints (see `consistency.md`): list endpoints share a shape, single-resource endpoints share a shape. Don't return a bare array from one list and `{data: [...]}` from another.
- **Consistent, structured error body** for failures: a stable machine-readable error code, a human-readable message, and where useful a field-level breakdown for validation and a correlation id for support. Every error across the API should share this shape so callers write one error handler. (The correlation id bridges the sanitised caller-facing error and your full internal logs, see the error-handling skill's surfacing file.)
- **Don't leak internals in errors** (see `information-hiding.md`): no stack traces, no raw database errors, no internal hostnames in the response body. Those go to your logs, not across the boundary.

## Pagination, filtering, and large collections

- **Never return an unbounded collection.** A list endpoint that returns everything works in the demo and dies when the collection grows (the same unbounded-growth trap as data-modelling). Paginate from the start, even when the data is small now.
- **Be consistent in the pagination mechanism** across all list endpoints. Cursor-based pagination handles large and changing datasets more robustly than offset-based (which can skip or repeat items when data changes between pages), but either works if applied uniformly. The caller should learn your pagination once.
- **Filtering and sorting via query parameters**, consistently named across endpoints. The same filter concept should use the same parameter name everywhere.

## Idempotency and safety

- **`GET`, `PUT`, `DELETE` should be idempotent**: calling them repeatedly has the same effect as calling once. Callers and networks retry these freely on the assumption they're safe to repeat (this is the HTTP expression of the idempotency principle in the error-handling skill).
- **`POST` is not idempotent by default**, so a retried `POST` can create duplicates. For operations where a retry must not double-act (payments, orders), support an **idempotency key**: the caller sends a unique key, you return the original result on a repeat rather than acting again. This is how you make `POST` safe to retry, which callers will do whether you planned for it or not.

## Statelessness

Each request should carry everything needed to process it; don't rely on server-side session state from previous requests in the API. Stateless requests can be routed to any instance, retried safely, and scaled horizontally. An API that depends on a sequence of stateful requests is fragile (a lost middle request breaks the sequence) and hard to scale. Carry the state in the request, not in server memory between requests.

## Versioning on HTTP

When a breaking change is unavoidable (see `versioning-and-compatibility.md`), the common mechanisms are a version in the URL path (`/v2/...`, visible and simple) or in a header (cleaner URLs, less visible). Either works; pick one and be consistent. Keep the old version serving while callers migrate, and prefer additive changes (new optional fields, new endpoints) that need no version bump at all, relying on callers being tolerant readers who ignore unfamiliar response fields.
