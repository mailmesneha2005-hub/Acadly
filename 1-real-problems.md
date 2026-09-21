# 1 — Real Problems

## Problem Statement

### Assignment & Quiz Tracker

Students struggle to keep track of multi-subject deadlines and exam schedules.

The proposed product, **Acadly**, focuses on helping students organize their academic tasks, understand upcoming workload, set priorities, and track completion from one place.

---

# 1. Stakeholder & Pain-Point Analysis

## Target User

**Primary User:** College students

Students regularly receive academic work from different subjects and through different communication channels. The main challenge is not simply remembering a task, but managing multiple tasks, deadlines and priorities at the same time.

---

## Pain Point 1 — Academic information is scattered

### Problem

Assignments, quizzes, tests and exam announcements can come through different places such as LMS/Google Classroom, WhatsApp groups, PDFs, teacher messages, college notices and classroom announcements.

### Root Cause

There is no single place where all academic tasks are automatically organized.

### Current Workaround

Students use a combination of:

* WhatsApp messages
* Screenshots
* Personal notes
* Google Calendar
* Reminder apps
* Notebooks
* Memory

### Why it fails

Important information can get buried inside conversations or remain stored in different applications. Students may remember that something was announced but forget the exact deadline or task details.

---

## Pain Point 2 — Multiple deadlines make prioritization difficult

### Problem

Students may have several assignments, quizzes and exams within the same week.

### Root Cause

Deadlines are usually viewed individually rather than as a complete academic workload.

### Current Workaround

Students manually check different subjects and decide what to complete first.

### Why it fails

A student may end up completing an easier task first even when another task is more urgent or important.

The problem becomes more noticeable when several subjects have overlapping deadlines.

---

## Pain Point 3 — General task managers do not naturally understand academic context

### Problem

Students can use general productivity apps for academic tasks, but these tools are not specifically structured around subjects, assignments, quizzes and exams.

### Root Cause

General task managers are designed for multiple types of personal and professional tasks.

### Current Workaround

Students create separate lists, projects, labels or databases for every subject.

### Why it fails

The student has to build and maintain their own academic system before they can actually use it.

For example:

**Generic task:**

> Complete assignment — Friday

**Academic task:**

> Data Structures → Assignment 2 → Friday → High Priority

The second format contains information that is more useful for academic planning.

---

## Pain Point 4 — No clear view of total academic workload

### Problem

Students can see individual deadlines but may not immediately understand how much work is pending across all subjects.

### Root Cause

Tasks are usually displayed as separate items rather than being represented as an overall academic workload.

### Current Workaround

Students manually check subject-wise lists, calendars, chats and notebooks.

### Why it fails

It becomes difficult to quickly answer:

* What do I have to complete today?
* What is due this week?
* Which subject has the most pending work?
* How many quizzes are coming up?
* Which deadlines are approaching?

---

## Pain Point 5 — Task completion does not show academic progress clearly

### Problem

Marking an assignment as completed only shows that one task is finished. It does not necessarily show how the student is progressing across different subjects.

### Root Cause

Most task systems focus on individual task completion rather than academic progress.

### Current Workaround

Students manually count completed work or maintain separate progress records.

### Why it fails

Progress tracking becomes another thing the student has to maintain and can easily be ignored when workload increases.

---

# 2. Competitive Gap Identification

Existing products already provide strong general task-management features, but their workflows are not primarily designed around academic workload.

### Competitor Comparison

| Capability                     | Google Tasks  | Todoist         | Notion       | **Acadly**             |
| ------------------------------ | ------------- | --------------- | ------------ | ---------------------- |
| Basic task management          | ✓             | ✓               | ✓            | ✓                      |
| Due dates                      | ✓             | ✓               | ✓            | ✓                      |
| Priority                       | Basic         | ✓               | Custom       | **Academic priority**  |
| Subtasks                       | ✓             | ✓               | ✓            | ✓                      |
| Subject-wise organization      | Lists         | Projects        | Custom setup | **Built-in**           |
| Assignment / Quiz / Exam types | Custom        | Custom          | Custom       | **Built-in**           |
| Workload overview              | Calendar/List | Today/Upcoming  | Custom views | **Academic dashboard** |
| Progress tracking              | Basic         | Task completion | Custom       | **Academic progress**  |
| Academic-first workflow        | No            | No              | No           | **Yes**                |

### What the comparison shows

**Google Tasks** is useful for basic task and deadline management.

**Todoist** provides more structured task organization through projects, priorities and different task views.

**Notion** provides extensive customization, but the student has to create the academic structure themselves.

**Acadly** is proposed around the academic workflow itself, with subjects, academic task types, workload and progress treated as core parts of the system.

### Three Major Gaps

#### 1. Task management vs academic workload management

Existing tools are good at storing and completing tasks.

The gap is organizing those tasks specifically around:

**Subject + Academic Task Type + Deadline + Priority**

---

#### 2. Manual academic setup

Tools such as Notion can be customized extensively, but the student has to create the required academic structure themselves.

Acadly would make the academic structure part of the product instead of requiring the user to build it.

---

#### 3. Individual deadlines vs complete academic picture

Existing tools can show upcoming tasks, but Acadly's proposed focus is to connect individual tasks into a larger academic workload view.

The student should be able to understand:

**Today → Upcoming → Overdue → Subject Workload → Overall Progress**

---

# 3. Problem Brief

## Core Problem

Students already have access to productivity and calendar tools, but they still have to manually collect academic information and convert it into a system of subjects, deadlines, priorities and progress.

This creates unnecessary effort and makes it difficult to understand what academic work needs attention first.

### Problem in One Line

> **Students don't lack task-management tools; they lack a simple system designed around their academic workload.**

---

# 4. Target User Persona

## Primary Persona — College Student

| Attribute           | Description                                           |
| ------------------- | ----------------------------------------------------- |
| User                | College student                                       |
| Main Goal           | Complete academic work on time                        |
| Main Pain Point     | Multiple deadlines across subjects                    |
| Information Sources | LMS, WhatsApp, classroom announcements, PDFs, notices |
| Current Method      | Notes, screenshots, reminders, calendar or memory     |
| Biggest Question    | “What should I do first?”                             |
| Main Need           | One clear academic workload view                      |
| Success Metric      | Completing tasks before deadlines                     |

### Typical Situation

A student has:

* 2 assignments due this week
* 1 quiz tomorrow
* 1 upcoming exam
* Lab work pending
* Multiple announcements across different subject groups

The student currently has to check different sources and mentally combine all this information.

Acadly aims to reduce that effort by giving the student one organized academic view.

---

# 5. Initial User Journey

**Academic announcement**

↓

**Student adds task**

↓

**Select Subject + Task Type + Deadline + Priority**

↓

**Acadly organizes the task**

↓

**Dashboard shows Today / Upcoming / Overdue / Subject Workload**

↓

**Student works on task**

↓

**Pending → In Progress → Completed**

↓

**Academic progress updates**

---

# 6. Research Validation

The following questions should be asked to actual students before treating the above assumptions as confirmed findings.

1. Where do you usually receive assignment and quiz announcements?
2. How do you currently remember deadlines?
3. Have you ever missed a deadline because the information was difficult to find later?
4. What do you do when multiple subjects have deadlines around the same time?
5. Do you currently use Google Calendar, Notion, Todoist, reminders or another tool?
6. What is the biggest problem with your current method?
7. Do you organize academic work subject-wise?
8. What information would you want to see immediately after opening an academic tracker?
9. Would a weekly workload view help you decide what to work on first?
10. What would make you continue using an academic tracker instead of going back to your current method?

---

# 7. Final Problem Hypothesis

The core problem is not the absence of task-management applications.

The problem is that academic work is scattered across different sources, while existing general-purpose tools require students to manually create an academic structure around their tasks.

### Proposed Direction

**Capture → Organize → Prioritize → Track → Complete**

Acadly will focus on turning scattered academic tasks into a structured, subject-aware workload that students can understand and manage from one place.