# Acadly User Flow

**New student:** Sign Up → Overview → Add Subject (if needed) → Add Task → Prioritize → Track → Complete  
**Returning student:** Log In → Overview → Choose Task → Track → Complete → Progress Updates · Forgot password → Reset Password → Log In

**Product:** An academic workload planner for college students.  
**Primary user:** Student.  
**Core loop:** **Capture → Organize → Prioritize → Track → Complete**

This document describes the student’s path from first visit through daily task completion. It complements [the UI/UX screen map](4-ui-ux-documentation.md). This is documentation only.

## 1. Full user journey

```text
┌──────────────┐
│ Open Acadly  │
└──────┬───────┘
       ↓
  Has account?
   ┌───┴───┐
  No      Yes
   ↓       ↓
Sign Up  Log In ←───────────────┐
   │       │                    │
   │       └─ Forgot password? ─┤
   │              ↓             │
   │      Reset Password ───────┘
   └──────────┬─────────────────┘
              ↓
        Overview / Home
              ↓
         Add a task
              ↓
       Subject exists?
         ┌────┴────┐
        No        Yes
         ↓          │
    Add subject    │
         └────┬─────┘
              ↓
 Enter title, type, due date, priority
              ↓
       Required data valid?
         ┌────┴────┐
        No        Yes
         ↓          ↓
 Show inline    Save task
 guidance          ↓
   ↺          Task list + dashboard update
                    ↓
              Work on task
                    ↓
          Pending → In Progress
                    ↓
                Completed
                    ↓
        Progress and insights update
                    └────────→ Overview
```

## 2. Account access flow

```text
New student                         Returning student
     │                                     │
     ↓                                     ↓
  Sign Up ──────────────── Log In ←────────┘
     │                       │
     │                       └── Forgot password?
     │                                  ↓
     │                           Reset Password
     │                                  │
     └──────────────┬───────────────────┘
                    ↓
             Signed-in Overview
```

| Screen | Student action | Next screen / feedback |
|---|---|---|
| Sign Up | Enter full name, email, password; create account | Overview first-use state; invite student to add a subject or task |
| Log In | Enter email and password | Overview; show a generic inline message if credentials do not match |
| Reset Password | Enter account email and request reset | Confirmation: “If an account exists for this email, reset instructions will be sent.” Return to Log In |

Use one student account role in the first version. Do not show a role selector. Keep entered email on recoverable errors; keep password masked by default and provide an accessible show/hide control.

## 3. Add-task flow

```text
Overview / My Tasks
        ↓
   Add a task
        ↓
 ┌──────────────────────────────┐
 │ Task title                   │
 │ Subject                      │
 │ Task type                    │
 │ Due date                     │
 │ Priority                     │
 │ Optional note                │
 └──────────────┬───────────────┘
                ↓
         Subject available?
           ┌────┴────┐
          No        Yes
           ↓          │
      Add subject     │
           └────┬─────┘
                ↓
      Validate required fields
         ┌──────┴──────┐
       Invalid        Valid
          ↓             ↓
 Inline field       Disable submit,
 guidance; keep     show spinner
 entered values         ↓
    ↺             Save task + toast
                         ↓
       Task list, dashboard, charts, and progress refresh
```

| Step | Student sees | Product response |
|---:|---|---|
| 1 | Add a task action | Opens a short form without losing the current screen. |
| 2 | Title, subject, type, date, priority | Required fields are clearly marked; note is optional. |
| 3 | Missing or invalid value | Inline explanation beside that field; keep other entered values. |
| 4 | Save task | Disable submit and show a spinner while saving. |
| 5 | Saved task | Confirmation toast; task appears in My Tasks and dashboard counts/graphs refresh. |

**MVP task types:** Assignment, Quiz, Exam.  
**Priority levels:** High, Medium, Low.  
**Status values:** Pending, In Progress, Completed.

## 4. Daily task-management loop

```text
Open Overview
    ↓
Check Due Today / Past Due / Next Up
    ↓
Choose a task ──→ My Tasks ──→ Open task
    ↓                              ↓
Mark In Progress             Work on task
                                   ↓
                         Mark Completed
                                   ↓
                  Subject + overall progress refresh
                                   ↓
                         Return to Overview
```

At every step, keep the next action visible. A completed task stays in history and is not classified as overdue, even if its due date has passed.

## 5. Deadline decision rules

```text
Is status Completed? ── Yes ──→ Completed
          │ No
          ↓
Is due date before today? ── Yes ──→ Overdue
          │ No
          ↓
Is due date today? ── Yes ──→ Due Today
          │ No
          ↓
       Upcoming
```

Evaluate completion first. For active work, compare the due date with the student’s local date. Show overdue tasks until they are completed or removed; never hide them automatically.

## 6. Screen navigation map

```text
Sign Up ──┐
          ├──→ Overview ──→ My Tasks ──→ Add / Edit Task
Log In ───┘       │              ↑              │
                  ├──→ Subjects ── Add Subject   │
                  └──→ Insights                  │
                                                  ↓
                  Overview ← Dashboard + subject progress refresh

Log In ── Forgot password ──→ Reset Password ──→ Log In
Sign Up ─────────────────────────────────────────→ Log In
Log In ──────────────────────────────────────────→ Sign Up
```

**Main screens:** Sign Up, Log In, Reset Password, Overview, My Tasks, Subjects, Insights. The add/edit task form is an overlay within My Tasks, and Add Subject is a form within Subjects.

## 7. Key recovery and edge paths

| Situation | Flow behavior |
|---|---|
| No subjects exist | Add task opens the subject creation step first; after saving a subject, return to the task form. |
| Invalid form field | Show inline guidance; keep other field values; let student correct and resubmit. |
| Deadline changes | Edit the existing task; do not create a duplicate. |
| Deadline passes | Keep task visible and label Overdue until completed or removed. |
| Several tasks share a date | Show every task; sort by priority, then due time. |
| Task completed early | Keep it in completed history; update subject and overall progress. |
| Search/filter returns no results | Say no tasks match; provide Clear filters. |
| Data cannot load | Preserve navigation and entered data; show a retry action. |
| Sign-in fails | Use a generic message, preserve email, and provide Forgot password. |
| Reset requested | Do not reveal whether that email has an account. |

## 8. Progress loop

```text
Task status changes
        ↓
Completed task count / total task count
        ├──→ Overall completion on Overview
        ├──→ Completion per subject on Subjects
        └──→ Workload and progress charts in Insights
```

**Overall completion:** completed tasks ÷ all tasks × 100.  
**Subject completion:** completed tasks in subject ÷ all tasks in subject × 100.  
If a subject has no tasks, show **“No tasks yet”** instead of a misleading percentage.

## 9. Flow review checklist

- New student can sign up and reach the first-use Overview.
- Returning student can log in or recover account access.
- Student can add a task in a short flow and see it reflected in the plan.
- Main task is reachable within three actions from Overview.
- Each screen has one clear primary action and a way back/cancel.
- Loading, empty, error, and success feedback are defined for every data screen.
- Task dates, subject totals, overdue classification, and progress calculations agree across screens.
