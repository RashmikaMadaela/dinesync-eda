# DineSync Build Roadmap

Step-by-step checklist derived from [ARCHITECTURE.md](./ARCHITECTURE.md). Work top to bottom — later phases depend on earlier ones (Floor Service before Ordering, shared types before everything).

## Phase 0 — Foundations

- [ ] Scaffold `packages/dinesync-types`: `package.json` + `tsconfig.json` extending `packages/typescript-config`, wire into pnpm workspace build graph.
- [ ] Define shared entity interfaces: `Table`, `Session`, `CartItem`, `Order`, `Ticket`, `MenuItem`, `Bill`.
- [ ] Define shared Kafka event payloads: `TableOpened`, `OrderPlaced`, `OrderCooking`, `OrderReady`, `WaiterRequested`, `ManualItemAdded`, `TablePaid`.
- [ ] Add a `KafkaTopics` const enum in `dinesync-types` so producers/consumers reference the same topic names.
- [ ] Add root `.env.example` documenting Postgres/Redis/Kafka/JWT vars used by `docker-compose.yml`.
- [ ] Run `docker compose up -d` and verify Postgres/Redis/Kafka/kafka-ui are reachable on `127.0.0.1`.
- [ ] Add a Postgres init script creating one schema + one least-privilege DB role per service (catalog, ordering, kitchen, floor, billing).

## Phase 1 — Floor Service

> Owns the live leader/session source of truth — must exist before Ordering Service authorization can work.

- [ ] `nest new` scaffold in `apps/floor-service`.
- [ ] Add TypeORM/Prisma (Postgres), `@nestjs/config`, Redis client, `@nestjs/microservices` Kafka module.
- [ ] Create `Table` entity/repo with `OPEN` / `CLOSED` / `AWAITING_FOOD` states.
- [ ] Endpoint: staff opens table → set `OPEN`, generate `sessionId`, emit `TableOpened` (Kafka key = `tableId`).
- [ ] QR-scan endpoint: reject scans if table is `CLOSED`.
- [ ] QR-scan endpoint: first scanner becomes `LEADER` in a Redis session record; later scanners go to a waiting-room state.
- [ ] WebSocket gateway (Redis adapter from the start) for leader approve/deny of waiting-room users.
- [ ] Heartbeat tracking + 30s disconnect timeout that promotes the next-oldest member.
- [ ] Broadcast leader-change events to all session members (no token reissue required).
- [ ] Auth guard for `LEADER`-gated routes that checks the live Redis record, not JWT claims.
- [ ] "Call Waiter" endpoint.
- [ ] Consumer for `OrderReady` → update table state and ping floor dashboard.
- [ ] Manual override endpoint (staff destroys an active session).
- [ ] Consumer for `TablePaid` → reset table to `CLOSED`.
- [ ] Testcontainers integration tests for table state machine + leader migration race.

## Phase 2 — API Gateway

- [ ] JWT issue/validate with identity-only claims (`sessionId`, `userId`); short-lived/refreshable.
- [ ] Rate limiting keyed on `sessionId + IP` (not IP alone).
- [ ] WebSocket gateway with Redis pub/sub adapter for cross-instance fan-out.
- [ ] Idempotency interceptor: atomic `SETNX key IN_PROGRESS EX ttl` → publish event → mark `DONE`.
- [ ] Idempotency interceptor: short-circuit duplicate requests (`IN_PROGRESS` or `DONE`) without republishing.
- [ ] Propagate W3C `traceparent` header into Kafka message headers.
- [ ] Wire up the Kafka client module (`@nestjs/microservices` + `kafkajs`, already installed) and confirm connectivity to the compose broker.

## Phase 3 — Catalog Service

- [ ] Scaffold `apps/catalog-service`.
- [ ] Postgres schema for menu items/categories.
- [ ] Redis cache-aside layer for menu reads.
- [ ] Event-driven cache invalidation on menu updates.
- [ ] CRUD endpoints (staff) + read endpoint (guest).

## Phase 4 — Ordering Service

- [ ] Scaffold `apps/ordering-service`.
- [ ] Redis-backed hot cart state; Postgres for persisted orders.
- [ ] Cart add/remove endpoints, synced over WebSocket via the gateway.
- [ ] Cart freeze/unfreeze restricted to current leader (validated against Floor Service's live leader record).
- [ ] Order submission endpoint: idempotent, emits `OrderPlaced` (Kafka key = `tableId`).
- [ ] Consumer for `TableOpened` → initialize a cart session.
- [ ] Consumer for `ManualItemAdded` → sync staff-injected items into the cart.

## Phase 5 — Kitchen Service (KDS)

- [ ] Scaffold `apps/kitchen-service`.
- [ ] Postgres schema for tickets.
- [ ] Consumer for `OrderPlaced`, deduped by `orderId` → create ticket `PENDING`.
- [ ] Ticket/item state transitions: `PENDING → COOKING → READY`.
- [ ] Emit `OrderCooking` on transition to cooking.
- [ ] Emit `OrderReady` on transition to ready.
- [ ] List virtualization / backpressure-aware handling for high-volume bursts.

## Phase 6 — Billing Service

- [ ] Scaffold `apps/billing-service`.
- [ ] Postgres schema for running bills.
- [ ] Consumer for `OrderPlaced` → append line items to the table's bill.
- [ ] "Mark paid" endpoint → emit `TablePaid`.

## Phase 7 — Frontends

- [ ] `customer-web` (Next.js + Zustand): QR landing page, waiting room UI, collaborative cart, freeze/review UI, call-waiter button.
- [ ] `cashier-dashboard`: running bill view + mark-paid action.
- [ ] Decide where the Floor Dashboard UI lives (no `apps/` stub exists yet) and scaffold it: table grid + waiter pings.
- [ ] Decide where the KDS Dashboard UI lives and scaffold it: virtualized ticket board with drag/tap state transitions.

## Phase 8 — Cross-Cutting Hardening

- [ ] Dead Letter Queue routing after 3 failed retries per consumer.
- [ ] Testcontainers integration suites across all services.
- [ ] OpenTelemetry tracing wired end-to-end; local Jaeger/Tempo for visualization.
- [ ] Correlation-id logging alongside trace propagation.
- [ ] Security review: confirm DB/Redis/Kafka are never bound to `0.0.0.0`.
- [ ] Security review: confirm per-service DB roles/schemas are enforced.
- [ ] Chaos check: kill Kitchen/Billing containers and confirm Ordering Service still accepts new orders.

## Phase 9 — Deployment

- [ ] Write a `Dockerfile` per service.
- [ ] Full-stack `docker compose` smoke test with all services running together.
- [ ] Fill in `turbo.json` pipelines (build/lint/test/check-types) per package.
- [ ] ECS Fargate task definitions + ALB routing.
- [ ] Private-subnet placement for Postgres/Redis/Kafka; security groups scoped to the ECS task security group.
- [ ] Secrets (DB credentials, JWT signing keys) in AWS Secrets Manager / SSM, injected at runtime.
- [ ] CI pipeline (build, lint, test, Testcontainers) gating deploys.
