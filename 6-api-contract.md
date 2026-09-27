# Acadly API Contract — v1 Draft

**Purpose:** Define the JSON interface between the Acadly client and a future backend. This contract covers the current MVP: account access, subjects, tasks, dashboard/progress, Focus Space, and Daily Motivation.

**Status:** Specification only. The current prototype has no connected API; it stores demo data in this browser. Base URL and authentication provider are deployment choices.

## 1. Request flow

```text
Sign in → Bearer token → /api/v1 resources
                            ├─ Subjects → Tasks → Dashboard / Progress
                            ├─ Focus session → Pause / Resume → Complete
                            └─ Daily quote (student local date)
```

## 2. API conventions

| Concern | Contract |
|---|---|
| Base path | `/api/v1` |
| Format | JSON request and response bodies; UTF-8 |
| Auth | `Authorization: Bearer <accessToken>` for all user resources |
| User ownership | Derive `userId` from the authenticated token; never trust a client-supplied owner ID |
| Timestamps | RFC 3339 UTC, e.g. `2026-09-27T10:15:30Z` |
| Due dates | Date-only `YYYY-MM-DD`; evaluate in the user's IANA timezone, e.g. `Asia/Kolkata` |
| Lists | `limit` default 20, maximum 100; opaque `cursor`; response includes `nextCursor` or `null` |
| Safe retries | Accept `Idempotency-Key` on create and completion requests to prevent duplicate tasks/sessions |
| Unknown fields | Reject with `400 VALIDATION_ERROR`; do not silently store them |

## 3. Resource shapes

### Subject

```json
{
  "id": "sub_01J...",
  "name": "Data Structures",
  "color": "sage",
  "createdAt": "2026-09-27T10:15:30Z",
  "updatedAt": "2026-09-27T10:15:30Z"
}
```

`color`: `sage | clay | stone | blue | rose`.

### Task

```json
{
  "id": "task_01J...",
  "title": "Trees & graphs problem set",
  "subjectId": "sub_01J...",
  "type": "Assignment",
  "dueDate": "2026-09-28",
  "timezone": "Asia/Kolkata",
  "priority": "High",
  "status": "In Progress",
  "note": "Finish questions 4–8.",
  "createdAt": "2026-09-27T10:15:30Z",
  "updatedAt": "2026-09-27T10:15:30Z"
}
```

`type`: `Assignment | Quiz | Exam`; `priority`: `High | Medium | Low`; `status`: `Pending | In Progress | Completed`. `note` may be empty or omitted.

### Focus session

```json
{
  "id": "focus_01J...",
  "taskId": "task_01J...",
  "status": "in_progress",
  "plannedSeconds": 1500,
  "focusedSeconds": 0,
  "ambientSound": "rain",
  "startedAt": "2026-09-27T10:15:30Z",
  "endedAt": null
}
```

`taskId` may be `null`; `status`: `in_progress | paused | completed | cancelled`; `ambientSound`: `none | rain | forest | brown`. The server calculates `focusedSeconds` from active intervals so paused time is excluded.

## 4. Endpoint map

| Method | Path | Purpose | Success |
|---|---|---|---|
| `POST` | `/auth/signup` | Create student account | `201` |
| `POST` | `/auth/login` | Start account session | `200` |
| `POST` | `/auth/refresh` | Renew access token | `200` |
| `POST` | `/auth/logout` | Revoke current refresh session | `204` |
| `POST` | `/auth/password-reset` | Request a reset email; response does not reveal account existence | `202` |
| `GET` | `/subjects` | List current user's subjects | `200` |
| `POST` | `/subjects` | Create subject | `201` |
| `GET` | `/subjects/{subjectId}` | Read one subject | `200` |
| `PATCH` | `/subjects/{subjectId}` | Update subject name/color | `200` |
| `DELETE` | `/subjects/{subjectId}` | Delete an unused subject | `204` |
| `GET` | `/tasks` | List/filter current user's tasks | `200` |
| `POST` | `/tasks` | Create task | `201` |
| `GET` | `/tasks/{taskId}` | Read one task | `200` |
| `PATCH` | `/tasks/{taskId}` | Update task fields/status | `200` |
| `DELETE` | `/tasks/{taskId}` | Delete task | `204` |
| `GET` | `/dashboard` | Get summary, next-up tasks, and weekly workload | `200` |
| `GET` | `/progress` | Get completion and subject progress | `200` |
| `GET` | `/daily-quote` | Get quote for a local calendar date | `200` |
| `POST` | `/focus-sessions` | Start a session | `201` |
| `POST` | `/focus-sessions/{sessionId}/pause` | Pause active session | `200` |
| `POST` | `/focus-sessions/{sessionId}/resume` | Resume paused session | `200` |
| `POST` | `/focus-sessions/{sessionId}/complete` | End and record focused time | `200` |
| `POST` | `/focus-sessions/{sessionId}/cancel` | Discard an uncompleted session | `200` |
| `GET` | `/focus-sessions` | List recorded sessions | `200` |

## 5. Account access

### Sign up — `POST /auth/signup`

```json
{ "fullName": "Aarav Sharma", "email": "aarav@example.com", "password": "at-least-8-characters" }
```

Returns `{ "data": { "user": { "id": "usr_01J...", "fullName": "Aarav Sharma", "email": "aarav@example.com" }, "accessToken": "…", "expiresAt": "2026-09-27T11:15:30Z", "refreshToken": "…" } }`.

### Log in — `POST /auth/login`

```json
{ "email": "aarav@example.com", "password": "…" }
```

Returns the same `data` user and token shape as sign up. For invalid credentials return a generic `401 INVALID_CREDENTIALS` and preserve the email in the client form.

### Password reset — `POST /auth/password-reset`

```json
{ "email": "aarav@example.com" }
```

Always return `202` with `{ "data": { "message": "If an account exists for this email, reset instructions will be sent." } }`.

## 6. Subject and task operations

### Create subject — `POST /subjects`

```json
{ "name": "Data Structures", "color": "sage" }
```

### Task filters — `GET /tasks`

Supported query parameters: `status`, `priority`, `subjectId`, `dueFrom`, `dueTo`, `q`, `sort`, `limit`, `cursor`. `sort` defaults to `dueDate`; same-date tasks sort by priority High → Medium → Low, then title. Completed tasks are not classified as overdue.

### Create task — `POST /tasks`

```json
{
  "title": "Trees & graphs problem set",
  "subjectId": "sub_01J...",
  "type": "Assignment",
  "dueDate": "2026-09-28",
  "timezone": "Asia/Kolkata",
  "priority": "High",
  "status": "Pending",
  "note": "Finish questions 4–8."
}
```

All fields except `note` are required at creation. `title` is trimmed and 1–80 characters; `note` is limited to 300 characters. The referenced subject must belong to the same user. Return the created `Task` object.

`PATCH /tasks/{taskId}` accepts any non-empty subset of mutable fields from the create shape. Return the complete updated `Task`. Deleting a task returns `204` with no response body.

### Subject deletion

Deleting a subject that still has tasks returns `409 SUBJECT_HAS_TASKS`; the client must first move or delete those tasks. This avoids silently orphaning academic work.

## 7. Dashboard and progress

### `GET /dashboard?date=2026-09-27&timezone=Asia%2FKolkata`

Returns a date-scoped view:

```json
{
  "date": "2026-09-27",
  "summary": { "dueToday": 1, "overdue": 1, "active": 5, "completed": 4, "completionPercent": 44 },
  "nextUp": [],
  "weeklyWorkload": [{ "date": "2026-09-27", "due": 2, "completed": 1 }],
  "focusMinutesToday": 25
}
```

`GET /progress?range=week&timezone=Asia%2FKolkata` accepts `range=week|month` and returns totals, due-date buckets, and per-subject completed/total counts. Percentages are derived from tasks; clients must not write them back.

### `GET /daily-quote?date=2026-09-27&timezone=Asia%2FKolkata`

Returns the same quote for the same local calendar date, across refreshes and devices:

```json
{ "data": { "date": "2026-09-27", "text": "Small progress is still progress.", "attribution": "Acadly" } }
```

## 8. Focus Space lifecycle

### Start — `POST /focus-sessions`

```json
{ "taskId": "task_01J...", "plannedSeconds": 1500, "ambientSound": "rain" }
```

Use `taskId: null` for independent study. `plannedSeconds` must be 60–14,400. `ambientSound` defaults to `none`. The server sets `startedAt` and returns status `in_progress`.

### Pause / resume

Send an empty JSON object to `/focus-sessions/{sessionId}/pause` or `/resume`. Only `in_progress → paused` and `paused → in_progress` transitions are valid. Return the updated session with server-calculated `focusedSeconds`.

### Complete / cancel

Send `{}` to `/focus-sessions/{sessionId}/complete` to record actual active seconds and return status `completed`; the server sets `endedAt`. The client may complete early. Paused intervals do not add focused time. To discard instead, call `/cancel`; return status `cancelled` and do not count it as focused progress. A completed task remains unchanged: focus completion never completes an academic task automatically.

### Session history — `GET /focus-sessions?from=2026-09-01&to=2026-09-30&limit=20&cursor=…`

Return completed sessions newest first, plus pagination metadata. Do not include cancelled sessions in focus-minute totals.

## 9. Response and error shapes

Successful reads/writes return `{ "data": <resource-or-value> }`, except `204` responses. List responses return `{ "data": [], "page": { "nextCursor": null } }`.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Check the highlighted fields.",
    "fields": { "dueDate": "Choose a valid due date." },
    "requestId": "req_01J..."
  }
}
```

| HTTP | Example code | Client behavior |
|---:|---|---|
| `400` | `VALIDATION_ERROR` | Show inline field messages; keep entered values. |
| `401` | `INVALID_CREDENTIALS` / `SESSION_EXPIRED` | Show generic sign-in error or refresh session. |
| `403` | `FORBIDDEN` | Do not expose another user's record. |
| `404` | `NOT_FOUND` | Return to list and refresh. |
| `409` | `SUBJECT_HAS_TASKS` / `INVALID_SESSION_STATE` | Explain what must change; do not lose data. |
| `429` | `RATE_LIMITED` | Keep form data and offer retry after server delay. |
| `500` | `INTERNAL_ERROR` | Show a friendly retry message and request ID. |

## 10. Reliability and access rules

- Every subject, task, and focus-session read/write is scoped to the authenticated user.
- Validate relationships and focus-session state transitions on the server, not only in the browser.
- Use database transactions for operations that update multiple records.
- Return stable error codes; user-facing text can be localized in the client.
- Store due dates as local calendar dates plus IANA timezone; store event timestamps in UTC.
- Keep focus session timer recovery separate from task status; a network retry must not create duplicate sessions.
- Derive dashboard counts, overdue status, and progress on the server from canonical task records.
- Support export/backup before treating the service as the only copy of a student's planner.
