# 3 — Features, Modules & MVP Scope

## 1. Feature Definition

A feature is a specific capability that allows the user to complete a particular task.

For Acadly, features are derived from the student's main journey:

```text
Capture → Organize → Prioritize → Focus → Complete → Track → Stay Consistent
````

The feature list is kept limited so that the core product can be completed without scope creep.

---

# 2. Modules & Features

Acadly is divided into 6 logical modules. Daily Motivation is a lightweight Dashboard feature.

| Module               | Feature            | Description                          | CRUD |
| -------------------- | ------------------ | ------------------------------------ | ---- |
| Academic Tasks       | Add Task           | Create an academic task              | C    |
| Academic Tasks       | View Tasks         | View all or selected tasks           | R    |
| Academic Tasks       | Edit Task          | Update task information              | U    |
| Academic Tasks       | Delete Task        | Remove a task                        | D    |
| Academic Tasks       | Update Status      | Change Pending/In Progress/Completed | U    |
| Subjects             | Add Subject        | Create a subject                     | C    |
| Subjects             | View Subjects      | Display available subjects           | R    |
| Subjects             | Edit Subject       | Update subject information           | U    |
| Subjects             | Delete Subject     | Remove a subject                     | D    |
| Deadline & Priority  | Set Deadline       | Assign due date/time                 | C/U  |
| Deadline & Priority  | Set Priority       | Mark High/Medium/Low                 | C/U  |
| Deadline & Priority  | Upcoming Tasks     | Show approaching deadlines           | R    |
| Deadline & Priority  | Overdue Tasks      | Show missed deadlines                | R    |
| Dashboard & Progress | Dashboard          | Show academic workload overview      | R    |
| Dashboard & Progress | Completion Rate    | Calculate completed work             | R    |
| Dashboard & Progress | Subject Progress   | Show subject-wise progress           | R    |
| Progress & Streak    | Streak Maintenance | Track consecutive productive days    | U/R  |
| Focus Space          | Focus Session      | Start, pause, resume, and end a study session | C/U |
| Focus Space          | Task-linked Focus  | Select and display the task being studied | R |
| Focus Space          | Study Timer        | Choose a duration and track elapsed time | C/R |
| Focus Space          | Ambient Sound      | Play or stop a small set of built-in ambient sounds | U |
| Focus Space          | Session Summary    | Record duration and linked task when a session ends | C/R |
| Dashboard & Progress | Daily Motivation   | Show one short quote that changes each local day | R |

### CRUD Legend

```text
C = Create
R = Read
U = Update
D = Delete
```

---

# 3. Module 1 — Academic Task Management

This is the core module of Acadly.

### Task Fields

| Field       | Purpose                            |
| ----------- | ---------------------------------- |
| Title       | Name of the academic task          |
| Subject     | Related subject                    |
| Task Type   | Assignment, Quiz, Exam, Lab, Other |
| Deadline    | Due date                           |
| Priority    | High, Medium, Low                  |
| Status      | Pending, In Progress, Completed    |
| Description | Optional task details              |

### Task Flow

```text
Create Task
     ↓
Add Subject & Type
     ↓
Set Deadline
     ↓
Set Priority
     ↓
Save
     ↓
Track Status
     ↓
Complete
```

---

# 4. Module 2 — Subject Management

Subjects provide the academic structure for tasks.

### Core Features

* Add Subject
* View Subjects
* Edit Subject
* Delete Subject
* View tasks under a subject

Example:

```text
Data Structures
├── Assignment 1
├── Quiz 2
└── Lab File

DBMS
├── Assignment 3
└── Quiz 1
```

---

# 5. Module 3 — Deadline & Priority

Acadly should make it easy to understand what needs attention first.

### Priority

```text
🔴 HIGH      → Immediate attention
🟡 MEDIUM    → Important
🟢 LOW       → Can be handled later
```

### Deadline Logic

```text
Task Created
     ↓
Deadline Assigned
     ↓
 ┌───────────────┐
 │ Deadline      │
 └───────┬───────┘
         ↓
   ┌─────┼─────┐
   ↓     ↓     ↓
 Today Upcoming Overdue
```

Upcoming and overdue tasks should be clearly visible on the dashboard.

---

# 6. Module 4 — Dashboard & Progress

The dashboard provides a single overview of the student's academic workload.

### Dashboard Should Show

* Today's tasks
* Upcoming tasks
* Overdue tasks
* Completion rate
* Subject-wise progress
* Current streak

### Dashboard Structure

```text
┌─────────────────────────────────┐
│           ACADLY                │
├──────────────┬──────────────────┤
│ Today's Work │ 🔥 Streak        │
│ 3 Tasks      │ 6 Days           │
├──────────────┼──────────────────┤
│ Upcoming     │ Overdue          │
│ 5 Tasks      │ 2 Tasks          │
├─────────────────────────────────┤
│ Overall Completion              │
│ ████████░░ 80%                  │
├─────────────────────────────────┤
│ Subject Progress                │
│ DSA      ████████░░ 80%         │
│ DBMS     ██████░░░░ 60%         │
│ Maths    █████░░░░░ 50%         │
├─────────────────────────────────┤
│ ✦ Today’s Motivation            │
│ “Small progress is still progress.”│
│                         — Acadly │
├─────────────────────────────────┤
│ [Open Focus Space]              │
└─────────────────────────────────┘
```

---

# 7. Progress Tracking

Acadly calculates progress from task status.

### Overall Progress

```text
Completed      ████████████████ 80%
In Progress    ███               15%
Pending        █                  5%
```

### Subject Progress

```text
DSA       ████████░░ 80%
DBMS      ██████░░░░ 60%
Maths     █████░░░░░ 50%
```

The dashboard should update automatically when task status changes.

---

# 8. Module 5 — Streak Maintenance

Gamification is **not included in the current MVP**.

A simple streak is retained because it supports consistency with minimal additional complexity.

### Streak Logic

```text
Complete Academic Work
          ↓
    Activity Recorded
          ↓
    Streak Checked
       /       \
      ↓         ↓
 Continue     No Activity
      ↓         ↓
 Streak +1   Streak Ends
```

Example:

```text
🔥 6 Day Streak

You've completed academic work
for 6 consecutive days.
```

The streak is based on meaningful academic activity, not simply opening the application.

---

# 9. Module 6 — Focus Space

Focus Space is a dedicated, distraction-light place to study inside Acadly. Keep the first version simple: one task, one timer, and a few optional ambient sounds.

```text
Dashboard → Focus Space → Select Task → Choose Duration → Choose Sound
                                                        ↓
Progress Updated ← Session Recorded ← End Session ← Study (pause/resume)
```

| MVP feature | Behavior |
|---|---|
| Start / pause / resume / end | Keep timer controls visible and keyboard accessible. Ending requires an intentional action. |
| Task selection | Choose one existing task and show its title and subject throughout. Allow an unlinked session if there is no task to select. |
| Duration | Select a preset or enter a duration; show remaining time clearly. |
| Ambient sound | Offer a few built-in, royalty-free options with Play/Stop. Sound is optional and off by default. |
| Session tracking | Record start, end, elapsed focused minutes, and optional task link. Exclude paused time. |
| Session summary | Show focused time and task; offer a clear return to the task or dashboard. |

```text
Ready → Studying → Paused → Studying → Summary
           ├──────────────→ End early ────────┘
           └── Timer reaches zero → Summary
```

Save completed sessions. If the student ends early, offer to save actual focused time or discard. Do not automatically mark the linked task complete; the student controls task status. Refresh focus-time totals after recording and update a streak only if its existing meaningful-activity rule is met.

---

# 10. Daily Motivation

Place one compact **Today’s Motivation** card below the dashboard’s workload and next-up content. Display one short quote and attribution; choose it by the student’s local calendar date so it changes once a day, not on every refresh. Keep it decorative and optional, with no extra action or gamification dependency.

---

# 11. MVP Scope

Every feature should answer one question:

> If this feature is removed, can the student's main academic tracking journey still be completed?

Features required for the core journey remain in the MVP. Optional features are moved to Post-MVP. 

## Must Have — MVP

| Feature                    | Reason                      |
| -------------------------- | --------------------------- |
| Add/View/Edit/Delete Tasks | Core task management        |
| Subjects                   | Academic organization       |
| Task Types                 | Identify academic work      |
| Deadlines                  | Track due dates             |
| Priority                   | Decide what to do first     |
| Task Status                | Track completion            |
| Dashboard                  | Central workload view       |
| Upcoming Tasks             | Prevent missed deadlines    |
| Overdue Tasks              | Highlight pending work      |
| Completion Rate            | Measure progress            |
| Subject Progress           | Understand subject workload |
| Streak Maintenance         | Encourage consistency       |
| Focus Space                | Start and record study sessions |
| Task-linked timer          | Keep the current task visible while studying |
| Basic ambient sound        | Offer a few simple optional sound choices |
| Session summary            | Show recorded focused time and linked task |
| Daily Motivation           | Display one short daily quote on Overview |

---

# 12. Post-MVP

These features are useful but not required for the first working version.

| Feature             | Why Post-MVP                   |
| ------------------- | ------------------------------ |
| Calendar View       | Alternative visualization      |
| Advanced Reminders  | Core tracking works without it |
| Weekly Analytics    | Additional analysis            |
| Estimated Workload  | Requires extra user input      |
| Notes & Attachments | Not required for task tracking |
| Advanced Search     | Basic filtering is sufficient  |
| Custom music / playlists | A few built-in ambient choices cover MVP |
| Advanced focus analytics | Basic session duration tracking is enough |
| XP / Levels / Badges | Not required for the study loop |

---

# 13. Future Scope — Gamification

Gamification will be considered after the core product is stable.

Possible future features:

```text
Streak
  ↓
XP Points
  ↓
Levels
  ↓
Achievements
  ↓
Optional Challenges
```

Potential additions:

* XP points
* Levels
* Achievement badges
* Personal milestones
* Weekly challenges
* Optional leaderboard

These are intentionally excluded from the current MVP.

---

# 14. Main User Flow

```text
START → Dashboard → Add Task
                  ↓
        Subject + Task Type
                  ↓
        Deadline + Priority
                  ↓
             Save Task
                  ↓
          Dashboard Update
                  ↓
           Work on Task
                  ↓
          Update Status
                  ↓
             Completed?
             /        \
           Yes         No
            ↓           ↓
       Progress       Pending
        Update
            ↓
      Streak Update
            ↓
         Dashboard
```

```text
Dashboard → Focus Space → Choose Task / Duration / Sound → Start
          → Study ↔ Pause / Resume → End / Timer Complete → Summary
          → Session Recorded → Focus Progress + eligible Streak refresh
```

---

# 15. Feature Dependencies

```text
User
 │
 ├── Subjects
 │      │
 │      └── Tasks
 │           ├── Type
 │           ├── Deadline
 │           ├── Priority
 │           └── Status
 │
 └── Dashboard
       ├── Upcoming
       ├── Overdue
       ├── Progress
       ├── Streak
       ├── Daily Motivation
       └── Focus Space
             ├── Optional task link → Tasks
             ├── Timer + ambient sound
             └── Session record → Focus progress / Streak rule
```

For example, progress depends on task status, while subject-wise progress depends on the relationship between subjects and tasks.

---

# 16. Technical Blueprint

The endpoint summary below is a quick map. For request/response shapes, validation, authentication, status transitions, and error behavior, see the separate [API Contract](6-api-contract.md). The source guide recommends defining the endpoint, request payload and affected database tables.

| Feature   | API              | Database |
| --------- | ---------------- | -------- |
| Tasks     | `/api/tasks`     | Tasks    |
| Subjects  | `/api/subjects`  | Subjects |
| Dashboard | `/api/dashboard` | Tasks    |
| Progress  | `/api/progress`  | Tasks    |
| Streak    | `/api/streak`    | Activity |
| Focus Sessions | `/api/focus-sessions` | FocusSessions |
| Daily Motivation | `/api/daily-quote` | Quote catalogue or static bundle |

### REST Routes

```text
POST    /api/tasks
GET     /api/tasks
GET     /api/tasks/:id
PATCH   /api/tasks/:id
DELETE  /api/tasks/:id

POST    /api/subjects
GET     /api/subjects
PATCH   /api/subjects/:id
DELETE  /api/subjects/:id

GET     /api/dashboard
GET     /api/progress
GET     /api/streak
POST    /api/focus-sessions
GET     /api/focus-sessions
GET     /api/daily-quote
```

---

# 17. Edge Cases & UI States

Feature design should consider more than the normal flow. The project guide specifically highlights empty states, duplicate data, invalid input, dependencies and loading/error states. 

### Empty State

```text
No academic tasks yet.

[ + Add Task ]
```

### Error State

```text
Something went wrong.
Please try again.
```

### Filtered Empty State

```text
No tasks match your filters.

[ Clear Filters ]
```

### Overdue Task

```text
⚠️ Overdue
DBMS Assignment
```

### Broken Streak

```text
Your streak has ended.

Start again today.
```

### Focus Space

```text
No tasks yet → Start an unlinked session or return to add a task.
Pause       → Timer stops; the session can resume.
End early   → Confirm save or discard; save actual focused minutes.
Timer done  → Show summary; do not mark the task complete automatically.
Sound fails → Keep timer usable and explain sound is unavailable.
```

---

# 18. Final MVP Feature Set

The first working version of Acadly should contain:

```text
1. Subjects
2. Academic Tasks
3. Task Types
4. Deadlines
5. Priority
6. Task Status
7. Upcoming Tasks
8. Overdue Tasks
9. Dashboard
10. Completion Rate
11. Subject Progress
12. Streak Maintenance
13. Focus Space with task selection and timer
14. Optional built-in ambient sounds
15. Focus-session tracking and summary
16. Daily Motivation quote on Overview
```

### Core Product Loop

```text
CAPTURE
   ↓
ORGANIZE
   ↓
PRIORITIZE → FOCUS → COMPLETE → TRACK → STAY CONSISTENT → STREAK
```

> **Acadly turns scattered academic work into a clear, manageable and trackable workload.**

```
```
