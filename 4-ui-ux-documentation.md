# Acadly UI / UX — Visual Sprint Document

> **Acadly turns college students’ scattered assignments, quizzes, and exams into one clear plan.**
>
> Core loop: **Capture → Organize → Prioritize → Track → Complete**

**Account flow added to this UI/UX scope:** email/password sign up, log in, and password reset for student accounts. The original project notes did not define authentication; this document assumes a single student role, no teacher/admin role picker, and email/password as the first sign-in method.

## 1. MVP screen map

| Screen | Student goal | Main content | One primary action | Loading / Empty / Error / Success |
|---|---|---|---|---|
| **Sign Up** | Create a student account | Name, email, password; password visibility; Log In link | **Create account** | Submit spinner / blank labeled form / inline field or account error / account created, continue to Overview |
| **Log In** | Return to an account | Email and password; password visibility; Forgot password; Sign Up link | **Log in** | Submit spinner / blank labeled form / generic credential error / session starts, continue to Overview |
| **Reset Password** | Regain account access | Email field; link back to Log In | **Send reset link** | Submit spinner / blank email field / inline invalid email or generic delivery error / privacy-safe confirmation |
| **Overview** | See what needs attention first | Today / overdue / active / completed totals; next-up tasks; weekly chart; subject progress | **Add a task** | Card skeletons / welcome + Add task / “Couldn’t load your plan” + Retry / totals and graphs refresh |
| **My Tasks** | Find and update academic work | Search; All, Today, Upcoming, Overdue, Completed filters; task rows | **Add a task** | Row skeletons / “No tasks yet” + Add task / task error + Retry / task moves to the right date or status group |
| **Subjects** | Understand work by class | Subject cards; task counts; completed and remaining work; progress | **Add subject** | Card skeletons / “Start with one subject” + Add subject / subject error + Retry / new or edited subject appears |
| **Insights** | Understand workload and progress | Weekly due-date graph; completion and overdue totals; subject progress | **View tasks** | Chart skeletons / “Add tasks to see a pattern” / insights error + Retry / graph and metrics update |

**Roles:** Sign Up is for a new student; Log In and Reset Password are for returning student accounts. Academic screens are for the signed-in student. Teacher/admin roles and LMS replacement are outside the first release.

## 2. Navigation at a glance

```text
First visit ──→ Sign Up ──→ Overview (empty state) ──→ Add subject / Add task
                    ↑               │
                    │               ├──→ My Tasks ──→ Add / edit task
                    │               ├──→ Subjects ──→ Add subject
                    │               └──→ Insights
                    │
Returning student ─┴── Log In ──→ Overview
                         │
                         └── Forgot password ──→ Reset Password ──→ Log In

After task save / completion:
My Tasks ──→ Task status updates ──→ Overview + subject progress refresh
```

The task form is an overlay within **My Tasks**, not another main screen. A student can reach task creation directly from Overview, then save and see it in the list. Keep Cancel and a clear return path on every form.

### Sign-up and log-in wireframes

Keep account screens focused and visually quieter than the signed-in dashboard. Show the Acadly brand, a short reassurance line, one form, one primary action, and a clear route to the alternate auth screen. Do not show the academic navigation before sign-in.

```text
SIGN UP — MOBILE                         LOG IN — MOBILE
┌───────────────────────────┐            ┌───────────────────────────┐
│ acadly.                   │            │ acadly.                   │
│ Your study plan, in one   │            │ Welcome back.             │
│ calm place.               │            │ Pick up where you left off.│
│                           │            │                           │
│ Full name                 │            │ Email                     │
│ [Aarav Sharma          ]  │            │ [aarav@email.com       ]  │
│ Email                     │            │ Password                  │
│ [aarav@email.com       ]  │            │ [••••••••••••         ◉]  │
│ Password                  │            │ Forgot password?          │
│ [••••••••••••         ◉]  │            │                           │
│ Use 8+ characters         │            │ [Log in]                  │
│                           │            │                           │
│ [Create account]          │            │ New to Acadly? Sign up    │
│ Already have an account?  │            └───────────────────────────┘
│ Log in                    │
└───────────────────────────┘
```

```text
RESET PASSWORD
┌───────────────────────────┐
│ acadly.                   │
│ Reset your password       │
│ Enter your account email. │
│ Email                     │
│ [aarav@email.com       ]  │
│ [Send reset link]         │
│ Back to log in            │
└───────────────────────────┘
```

| Auth screen | Field and interaction notes |
|---|---|
| Sign Up | Full name (`text`), email (`email`), password (`password`); required labels; password visibility control named “Show password” / “Hide password”; short password rule below the field. No role selector because the first-release user is a student. |
| Log In | Email (`email`) and password (`password`); keep Forgot password next to the password field; preserve email if credentials are rejected. |
| Reset Password | Email (`email`) only; confirmation copy: “If an account exists for this email, reset instructions will be sent.” Do not reveal whether an email is registered. |

After sign up, take the student to Overview’s first-use empty state. Avoid a separate onboarding carousel; offer Add subject and Add task as the first next steps.

## 3. Add-task flow

```text
┌──────────────┐   ┌────────────────┐   ┌───────────────────┐
│ Add a task   │ → │ Subject exists?│ → │ Enter task title  │
└──────────────┘   └───────┬────────┘   └─────────┬─────────┘
                           │ No                    │
                           ↓                       ↓
                    ┌─────────────┐       ┌──────────────────┐
                    │ Add subject │       │ Choose task type │
                    └──────┬──────┘       └────────┬─────────┘
                           └───────────────────────→│
                                                    ↓
                                      ┌────────────────────────┐
                                      │ Due date + priority     │
                                      └────────────┬───────────┘
                                                   ↓
                                      ┌────────────────────────┐
                                      │ Validate required info │
                                      └──────┬───────────┬─────┘
                                         Fix │           │ Valid
                                             └──↺        ↓
                                              ┌────────────────┐
                                              │ Save + feedback│
                                              └───────┬────────┘
                                                      ↓
                             Task list + Overview + progress refresh
```

| Form field | Required | Example | UX rule |
|---|---:|---|---|
| Task name | Yes | Trees & graphs problem set | Keep the title field first and show an inline error if blank. |
| Subject | Yes | Data Structures | Offer Add subject if none exist. |
| Type | Yes | Assignment | MVP: Assignment, Quiz, Exam. |
| Due date | Yes | 26 Sep 2026 | Use a date picker; explain invalid dates beside the field. |
| Priority | Yes | High | High / Medium / Low; never communicate by color alone. |
| Note | No | Finish questions 4–8 | Optional context only. |

### Task form wireframe

```text
┌────────────────────────────────────────────┐
│ Add an academic task                    ×  │
│ Get it out of your head and into your plan.│
│                                            │
│ Task name *                                │
│ [ Trees & graphs problem set            ]  │
│ Subject *                 Task type *      │
│ [ Data Structures     ▾ ] [ Assignment ▾ ] │
│ Due date *                 Priority *      │
│ [ 26 Sep 2026         ▦ ] [ High       ▾ ] │
│ Note (optional)                            │
│ [ Finish questions 4–8                  ]  │
│                                            │
│ [Cancel]                    [Save task]    │
└────────────────────────────────────────────┘
```

## 4. Overview wireframes

### Mobile — 375px

```text
┌──────────────────────────────────┐
│ acadly               Sat, 26 Sep │
│ Your week, in focus.              │
│ Hi Aarav. What needs attention?   │
│ [＋ Add a task]                   │
├─────────────────┬────────────────┤
│ Due today   1   │ Past due    1  │
│ To do       5   │ Completed 44%  │
├──────────────────────────────────┤
│ START HERE                       │
│ Relational algebra worksheet     │
│ DBMS · Assignment · Past due      │
│ Trees & graphs · Due today        │
├──────────────────────────────────┤
│ THIS WEEK                        │
│ Mon 28 Sep  █ 1 due               │
│ Wed 30 Sep  █ 1 due               │
│ Fri 02 Oct  █ 1 due               │
├──────────────────────────────────┤
│ SUBJECT PROGRESS                 │
│ Data Structures  █████░░░░░ 50%  │
│ DBMS             ███░░░░░░░ 33%  │
│ Operating Systems█████░░░░░ 50%  │
│ Discrete Maths   █████░░░░░ 50%  │
└──────────────────────────────────┘
```

### Desktop

```text
┌──────────────┬──────────────────────────────────────────────────────────┐
│ ACADLY       │ Saturday, 26 September 2026                 Aarav Sharma │
│ Overview     ├──────────────────────────────────────────────────────────┤
│ My Tasks     │ Your week, in focus.                     [＋ Add a task] │
│ Subjects     ├────────────┬────────────┬────────────┬──────────────────┤
│ Insights     │ Due today 1│ Past due 1 │ To do 5    │ Done 44%         │
│              ├──────────────────────────────────┬─────────────────────┤
│              │ Weekly workload graph            │ Start here         │
│              ├──────────────────────────────────┼─────────────────────┤
│              │ Subject progress                 │ Upcoming deadlines  │
└──────────────┴──────────────────────────────────┴─────────────────────┘
```

## 5. Sample workload data

**Student:** Aarav Sharma · **Date shown:** Saturday, 26 September 2026. These are academic examples; Acadly has no money field, so ₹ values would be misleading here.

| Task | Subject | Type | Due | Priority | Status |
|---|---|---|---|---|---|
| Trees & graphs problem set | Data Structures | Assignment | 26 Sep 2026 | High | In Progress |
| Normalization quiz | DBMS | Quiz | 28 Sep 2026 | High | Pending |
| Scheduling worksheet | Operating Systems | Assignment | 30 Sep 2026 | Medium | Pending |
| Set theory practice | Discrete Maths | Assignment | 2 Oct 2026 | Low | Pending |
| Relational algebra worksheet | DBMS | Assignment | 24 Sep 2026 | Medium | Pending — overdue |
| Stack implementation quiz | Data Structures | Quiz | 22 Sep 2026 | Low | Completed |
| ER diagram assignment | DBMS | Assignment | 20 Sep 2026 | Medium | Completed |
| Process states exam | Operating Systems | Exam | 18 Sep 2026 | High | Completed |
| Logic exercises | Discrete Maths | Assignment | 19 Sep 2026 | Low | Completed |

**Consistent totals:** 9 tasks · 5 active · 1 due today · 1 overdue · 4 completed · overall completion **44%**.

## 6. Graphs and what they mean

### Weekly deadlines

Each bar is the number of tasks due on that day. The example tasks due from today through Friday are all pending, so all four bars use the “due” color.

```text
Tasks due
3 │
2 │
1 │ █                 █              █              █
0 └─┬─────┬─────┬─────┬─────┬─────┬─────┬─────
   Sat 26 Sun 27 Mon 28 Tue 29 Wed 30 Thu 1 Fri 2
```

| Date | Tasks due | Completed | Still open |
|---|---:|---:|---:|
| Sat 26 Sep | 1 | 0 | 1 |
| Mon 28 Sep | 1 | 0 | 1 |
| Wed 30 Sep | 1 | 0 | 1 |
| Fri 02 Oct | 1 | 0 | 1 |

**Reading it:** forest bar = tasks due; darker clay segment = completed tasks among that day’s due tasks. Add a legend and keep labels visible. A day with no work keeps its date label and a zero-height bar.

### Workload by subject

```text
Data Structures    ██░░░░░░░░  2 tasks
DBMS               ███░░░░░░░  3 tasks
Operating Systems  ██░░░░░░░░  2 tasks
Discrete Maths      ██░░░░░░░░  2 tasks
```

### Completion by subject

```text
Data Structures    █████░░░░░  1 / 2  = 50%
DBMS               ███░░░░░░░  1 / 3  = 33%
Operating Systems  █████░░░░░  1 / 2  = 50%
Discrete Maths      █████░░░░░  1 / 2  = 50%
```

**Formula:** completed tasks ÷ total tasks × 100. If a subject has no tasks, show **“No tasks yet”**, not 0% or 100%. Overdue work remains in the subject and overall totals until completed or removed.

## 7. Deadline and status rules

```text
Completed task ───────────────────────────→ Completed
Not completed + date before today ────────→ Overdue
Not completed + date is today ────────────→ Due today
Not completed + future date ─────────────→ Upcoming
```

Evaluate Completed first so a completed task with an old due date never appears overdue. When dates match, sort High → Medium → Low priority, then due time.

## 8. UI states and feedback

| Screen | Loading | Empty | Error | Success feedback |
|---|---|---|---|---|
| Sign Up | Disable Create account and show spinner | Blank, labeled form with one CTA | Inline name/email/password guidance; keep entered values | “Account created. Welcome to Acadly.” Continue to Overview. |
| Log In | Disable Log in and show spinner | Blank, labeled form with Forgot password link | Generic “Email or password doesn’t match. Try again.” Preserve email. | Session starts and Overview opens. |
| Reset Password | Disable Send reset link and show spinner | Blank email field and Back to log in | Inline invalid email; generic delivery failure with Retry | “If an account exists for this email, reset instructions will be sent.” |
| Overview | Summary, chart, and task skeletons | “Add your first academic task and we’ll help you see what’s coming up.” | “We couldn’t load your academic plan.” **Retry** | Counts, next-up, chart, and progress refresh; toast confirms action. |
| My Tasks | Task-row skeletons | “Your plan starts here.” **Add a task** | “We couldn’t load your tasks.” **Retry** | New task appears in date group; completed task moves to Completed. |
| Subjects | Subject-card skeletons | “Start with one subject. Every task gets a home.” **Add subject** | “We couldn’t load your subjects.” **Retry** | New subject appears and is selectable in the task form. |
| Insights | Metric and graph skeletons | “Add tasks to see how your workload is spaced.” **View tasks** | “We couldn’t load your insights.” **Retry** | Graphs and progress totals recalculate. |

**Form feedback:** keep entered values after validation errors; put the message beside the field; mark required fields; disable the primary submit action while submitting and show a spinner; show a short confirmation after save. Always retain Back/Cancel. Auth forms should use the correct email/password input types and password autocomplete behavior.

## 9. Compact visual system

| Item | Acadly direction |
|---|---|
| Primary | Forest `#355E4B`; white label. |
| Accent | Clay `#E7B08D`; decorative only. Use a darker clay for meaningful chart segments. |
| Background / surface | Paper `#F7F8F6` / white `#FFFFFF`. |
| Text | Ink `#27352F`; body `#46534A`; secondary `#68756C`. |
| Status | Success `#2F6B4F` on pale green; warning `#815500` on pale yellow; error `#A33B32` on pale rose. Always pair color with words. |
| Typography | DM Sans; H1 32px desktop / 28px mobile; H2 22px; body 16px; small 13px. |
| Spacing / shape | 4, 8, 16, 24, 32px; 16px radius; one soft shadow on cards. |
| Claymorphism | Rounded pale surfaces and gentle depth; keep controls flat, obvious, and high contrast. |

### Review checklist

□ Most important information appears first; one primary CTA per screen.  □ Every data screen has loading, empty, error, and success states.  □ At 375px, cards stack and no content clips.  □ Text contrast ≥ 4.5:1; meaningful chart graphics ≥ 3:1.  □ Inputs have labels; controls have accessible names and keyboard focus.  □ Main task takes no more than 3 steps; Back/Cancel is always available.  □ Same action uses the same words and visual style.  □ Sample content uses real academic tasks, Indian names, and realistic dates.
