# 2 — MVP Ideation

> A student shouldn't need five different apps, endless WhatsApp scrolling, and a photographic memory just to know what's due tomorrow.

## Product: Acadly

### From Scattered Deadlines to One Clear Academic Plan

Acadly is designed around one simple idea:

> Take scattered academic work and turn it into one clear, actionable workload.

Students already use calendars, reminders, notes, WhatsApp groups and other productivity tools. The problem is that none of these are built specifically around the way academic work is structured.

Acadly brings that structure into one place:

**Subject → Task Type → Deadline → Priority → Status → Progress**

---

# 1. The Core Solution

Acadly is an academic workload management platform for college students.

Instead of functioning like another generic to-do list, Acadly is built around academic tasks such as:

* Assignments
* Quizzes
* Exams

A student can add a task, connect it to a subject, set its deadline and priority, and track it until completion.

The dashboard then turns these individual tasks into a bigger picture of the student's academic workload.

### The goal is simple:

**Know what you have.
Know what matters first.
Know what is already done.**

---

# 2. Why Acadly?

Most productivity tools answer:

> "What tasks do I have?"

Acadly aims to answer:

> "What academic work do I have, which subject is it for, what needs attention first, and how much is left?"

The difference is **academic context**.

For example:

### Generic Task

> Complete assignment — Friday

### Acadly Task

> Data Structures → Assignment 2 → Friday → High Priority → Pending

The second format gives the student the context they actually need to manage academic workload.

---

# 3. Value Proposition

> Acadly turns scattered academic deadlines into one organized, subject-aware workload.

The product focuses on reducing the effort students spend collecting, remembering and manually organizing academic information.

### Acadly's core workflow:

**Capture → Organize → Prioritize → Track → Complete**

---

# 4. The MVP — Start Small, Solve the Core Problem

> Acadly doesn't try to do everything. It focuses on one thing first: turning a student's scattered deadlines into a clear, actionable academic plan.

That is the MVP.

The first version should solve the core workflow without adding unnecessary complexity.

A student should be able to:

1. Add an academic task.
2. Assign it to a subject.
3. Select the type of task.
4. Set a deadline.
5. Set its priority.
6. Track its status.
7. See everything from one dashboard.
8. Mark completed work and track basic progress.

If these steps work smoothly, the core problem is being solved.

---

# 5. MoSCoW Feature Prioritization

To prevent scope creep, the MVP is divided into four priority levels:

**Must Have → Should Have → Could Have → Won't Have**

## M — MUST HAVE

The features the MVP cannot work without.

### 1. Add Academic Task

Students should be able to create a task with:

* Task title
* Subject
* Task type
* Deadline
* Priority
* Description

### 2. Academic Task Types

The MVP should support three basic academic task types:

* Assignment
* Quiz
* Exam

### 3. Subject Management

Every task should belong to a subject.

Example:

**Data Structures**

* Assignment 2
* Quiz 1
* Mid-Term Exam

### 4. Deadline Tracking

Every task should have a deadline.

The system should clearly identify:

* Due Today
* Upcoming
* Overdue
* Completed

### 5. Priority

Students should be able to assign a priority to every task:

* High
* Medium
* Low

### 6. Task Status

Tasks should move through a simple workflow:

**Pending → In Progress → Completed**

### 7. Academic Dashboard

The dashboard should provide a quick snapshot of:

* Today's tasks
* Upcoming deadlines
* Overdue tasks
* Pending task count
* Completed task count

The student should understand their current workload without opening multiple screens.

---

## S — SHOULD HAVE

Features that make the MVP more useful, but are not essential to the first working version.

### 1. Subject-wise Progress

Show completion progress for individual subjects.

Example:

**Data Structures — 70%**

**DBMS — 45%**

**Operating Systems — 80%**

### 2. Weekly Workload View

Show assignments, quizzes and exams across the current week.

### 3. Task Filters

Students should be able to filter tasks by:

* Subject
* Task Type
* Priority
* Status
* Deadline

### 4. Search

Students should be able to quickly find a particular task or subject.

### 5. Deadline Reminders

Remind students when an important deadline is approaching.

---

## C — COULD HAVE

Useful additions that can come after the core MVP is stable.

### 1. Calendar View

Display academic tasks directly on a calendar.

### 2. Estimated Workload

Allow students to estimate how long a task may take.

Example:

> DBMS Assignment — 2 hours

### 3. Recurring Tasks

Useful for repeated academic activities such as weekly lab work.

### 4. Notes & Attachments

Allow students to attach useful notes, PDFs or links to a task.

### 5. Dark Mode

A visual customization option for users.

---

## W — WON'T HAVE IN THE INITIAL MVP

Features deliberately excluded to keep the first version focused.

### 1. Full Online Classroom

Acadly will not attempt to replace an LMS or classroom platform.

### 2. Online Assignment Submission

The MVP will track assignments but will not handle their submission.

### 3. Online Examination System

Acadly will track exams and quizzes but will not conduct them.

### 4. Video Learning Platform

Video lectures and course content are outside the MVP.

### 5. Complex AI Study Assistant

AI tutoring, automatic question generation and personalized study planning can be considered later.

### 6. Teacher / Admin Portal

The initial product focuses on the student's academic workflow.

---

# 6. MVP Feature Priority

| Priority | Feature            | Why It Matters                           |
| -------- | ------------------ | ---------------------------------------- |
| P0       | Add Task           | Core interaction                         |
| P0       | Subject Management | Gives every task academic context        |
| P0       | Task Type          | Identifies assignment, quiz or exam      |
| P0       | Deadline           | Core requirement for tracking            |
| P0       | Priority           | Helps decide what needs attention first  |
| P0       | Task Status        | Tracks progress                          |
| P0       | Dashboard          | Gives one view of academic workload      |
| P1       | Subject Progress   | Shows progress across subjects           |
| P1       | Weekly View        | Makes deadline clusters visible          |
| P1       | Filters            | Makes larger task lists easier to manage |
| P1       | Reminders          | Helps prevent missed deadlines           |
| P2       | Calendar View      | Alternative workload visualization       |
| P2       | Estimated Time     | Helps with workload planning             |
| P2       | Recurring Tasks    | Supports repeated academic work          |
| P2       | Attachments        | Keeps supporting material with tasks     |

---

# 7. Core User Flow

## First-Time Setup

**Open Acadly**

↓

**Add Subjects**

↓

**Add Academic Task**

↓

**Select Task Type**

↓

**Set Deadline + Priority**

↓

**Task Appears on Dashboard**

---

## Daily Workflow

**Open Dashboard**

↓

**Check Today's & Upcoming Tasks**

↓

**Identify Priority Task**

↓

**Start Task**

↓

**Mark In Progress**

↓

**Complete Task**

↓

**Mark Completed**

↓

**Progress Updates**

---

# 8. Example Scenario

Imagine a student has three upcoming academic tasks:

| Subject           | Type       | Deadline | Priority | Status      |
| ----------------- | ---------- | -------- | -------- | ----------- |
| Data Structures   | Assignment | 22 Sept  | High     | Pending     |
| DBMS              | Quiz       | 23 Sept  | High     | Pending     |
| Operating Systems | Assignment | 26 Sept  | Medium   | In Progress |

Without Acadly, the student may need to check different WhatsApp messages, notes, calendars or classroom announcements to remember all three.

With Acadly, these tasks appear together in one academic dashboard.

The student can immediately see:

* What is due first
* Which task has higher priority
* Which subject the task belongs to
* What is already in progress
* What is still pending

---

# 9. Edge Cases

### Deadline Changed

If a teacher changes a deadline, the student should be able to edit the existing task instead of creating another one.

### Task Becomes Overdue

If the deadline passes before completion, the task should automatically appear as overdue while remaining available to complete.

### Multiple Tasks on the Same Day

All tasks should remain visible, with priority helping the student decide where to start.

### Task Completed Early

A completed task should remain part of the student's progress/history without appearing as pending.

### Similar Tasks Across Subjects

Tasks with the same type should still be distinguishable through their subject and title.

---

# 10. MVP Success Criteria

The MVP should allow a student to:

* Add an academic task.
* Connect it to a subject.
* Select its task type.
* Set a deadline.
* Assign a priority.
* Track its status.
* See upcoming and overdue work.
* Understand their current workload.
* Mark completed work.
* View basic academic progress.

### The real test:

If a student can open Acadly and answer these questions within seconds:

> **What do I have?**

> **What's due first?**

> **What's overdue?**

> **What's already done?**

> **How much work is left?**

Then the MVP is doing its job.

---

# 11. Final Product Direction

Acadly should stay focused on one core purpose:

> **Make academic workload visible, organized and actionable.**

The MVP is not about adding the maximum number of features.

It is about building the **smallest useful version of Acadly that genuinely solves the student's core problem.**

### Acadly MVP

**Capture → Categorize → Prioritize → Track → Complete**
