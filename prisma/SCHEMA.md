# Prisma Schema Documentation

> **Database:** PostgreSQL
> **ORM:** Prisma 7
> **Client output:** `src/generated/prisma`
> **Schema folder:** `prisma/schema/`
> **Migrations folder:** `prisma/migrations/`
> **Connection config:** `prisma.config.ts` → `process.env.DATABASE_URL`

---

## Table of Contents

1. [Entity Relationship Map](#entity-relationship-map)
2. [Models](#models)
   - [Branch](#1-branch)
   - [Department](#2-department)
   - [Role](#3-role)
   - [Address](#4-address)
   - [User](#5-user)
3. [Relation Summary](#relation-summary)
4. [Indexes & Constraints](#indexes--constraints)

---

## Entity Relationship Map

```
┌─────────────────────────────────────────────────────────────┐
│                          Branch                             │
│  (branches)                                                 │
│  id · name · is_active · created_at · updated_at           │
└────────────┬──────────────┬──────────────────────────────── ┘
             │ 1:many       │ 1:many          │ 1:many
             ▼              ▼                 ▼
     ┌────────────┐  ┌────────────┐   ┌─────────────────────────────────────┐
     │ Department │  │    Role    │   │                User                 │
     │(departments│  │  (roles)   │   │              (users)                │
     │            │  │            │   │                                     │
     │ id         │  │ id         │   │ id · employee_id · first_name       │
     │ name       │  │ name       │   │ last_name · email · phone           │
     │ is_active  │  │ is_active  │   │ password · adhar_number · is_active │
     │ branch_id─►│  │ branch_id─►│   │                                     │
     └─────┬──────┘  └──────┬─────┘   │ branch_id ──────────────────►Branch│
           │ 1:many         │ 1:many  │ department_id ────────────►Dept    │
           └────────────────┴─────────│ role_id ───────────────────►Role   │
                                      │ address_id(unique)─────────►Address│
                                      └─────────────────────────────────────┘
                                                      │ 1:1
                                                      ▼
                                             ┌─────────────────┐
                                             │    Address      │
                                             │  (addresses)    │
                                             │                 │
                                             │ id · lane       │
                                             │ landmark · city │
                                             │ district· state │
                                             │ pin_code        │
                                             │ country         │
                                             └─────────────────┘
```

---

## Models

### 1. Branch

**Table:** `branches`
**File:** `prisma/schema/branch.prisma`

The top-level organisational unit. Every Department, Role, and User belongs to a Branch.

| Field        | Type      | Attributes             | Description                     |
|--------------|-----------|------------------------|---------------------------------|
| `id`         | `String`  | `@id @default(cuid())` | Primary key, auto-generated     |
| `name`       | `String`  | `@unique`              | Branch name, globally unique    |
| `is_active`  | `Boolean` | `@default(true)`       | Soft-delete / activation flag   |
| `created_at` | `DateTime`| `@default(now())`      | Record creation timestamp       |
| `updated_at` | `DateTime`| `@updatedAt`           | Auto-updated on every save      |

**Back-relations (virtual, no DB column):**

| Field         | Type           | Direction  |
|---------------|----------------|------------|
| `users`       | `User[]`       | 1 → many   |
| `departments` | `Department[]` | 1 → many   |
| `roles`       | `Role[]`       | 1 → many   |

---

### 2. Department

**Table:** `departments`
**File:** `prisma/schema/department.prisma`

A department within a specific branch. Department names are unique **per branch** (not globally), so two branches can each have an "HR" department.

| Field        | Type      | Attributes             | Description                          |
|--------------|-----------|------------------------|--------------------------------------|
| `id`         | `String`  | `@id @default(cuid())` | Primary key, auto-generated          |
| `name`       | `String`  |                        | Department name                      |
| `is_active`  | `Boolean` | `@default(true)`       | Soft-delete / activation flag        |
| `branch_id`  | `String`  |                        | FK → `branches.id`                   |
| `created_at` | `DateTime`| `@default(now())`      | Record creation timestamp            |
| `updated_at` | `DateTime`| `@updatedAt`           | Auto-updated on every save           |

**Relations:**

| Field    | Type     | Direction       | FK held by  |
|----------|----------|-----------------|-------------|
| `branch` | `Branch` | many → 1        | `branch_id` |
| `users`  | `User[]` | 1 → many (back) | User table  |

**Constraints:**
- `@@unique([name, branch_id])` — prevents duplicate department names within the same branch
- `@@index([branch_id])` — speeds up lookups by branch

---

### 3. Role

**Table:** `roles`
**File:** `prisma/schema/role.prisma`

A permission role scoped to a branch. Like departments, role names are unique **per branch**.

| Field        | Type      | Attributes             | Description                          |
|--------------|-----------|------------------------|--------------------------------------|
| `id`         | `String`  | `@id @default(cuid())`  | Primary key, auto-generated          |
| `name`       | `String`  |                        | Role name                            |
| `is_active`  | `Boolean` | `@default(true)`       | Soft-delete / activation flag        |
| `branch_id`  | `String`  |                        | FK → `branches.id`                   |
| `created_at` | `DateTime`| `@default(now())`      | Record creation timestamp            |
| `updated_at` | `DateTime`| `@updatedAt`           | Auto-updated on every save           |

**Relations:**

| Field    | Type     | Direction       | FK held by  |
|----------|----------|-----------------|-------------|
| `branch` | `Branch` | many → 1        | `branch_id` |
| `users`  | `User[]` | 1 → many (back) | User table  |

**Constraints:**
- `@@unique([name, branch_id])` — prevents duplicate role names within the same branch
- `@@index([branch_id])` — speeds up lookups by branch

---

### 4. Address

**Table:** `addresses`
**File:** `prisma/schema/address.prisma`

Stores a single user's physical address. This is a **1-to-1** relationship with User — each address row belongs to exactly one user.

| Field        | Type      | Attributes             | Description                            |
|--------------|-----------|------------------------|----------------------------------------|
| `id`         | `String`  | `@id @default(cuid())` | Primary key, auto-generated            |
| `lane`       | `String?` |                        | Street / lane (optional)               |
| `landmark`   | `String?` |                        | Nearby landmark (optional)             |
| `city`       | `String`  |                        | City name                              |
| `district`   | `String`  |                        | District name                          |
| `state`      | `String`  |                        | State name                             |
| `pin_code`   | `String`  |                        | Postal / PIN code                      |
| `country`    | `String`  | `@default("India")`    | Country, defaults to India             |
| `created_at` | `DateTime`| `@default(now())`      | Record creation timestamp              |
| `updated_at` | `DateTime`| `@updatedAt`           | Auto-updated on every save             |

**Back-relation (virtual):**

| Field  | Type    | Direction | Note                               |
|--------|---------|-----------|------------------------------------|
| `user` | `User?` | 1 → 1     | Optional — FK lives on User's side |

> `pin_code` is stored as `String` intentionally to preserve leading zeros (e.g. `"011001"`).

---

### 5. User

**Table:** `users`
**File:** `prisma/schema/user.prisma`

The central model. A user belongs to one Branch, one Department, and one Role, and owns one Address. This model holds all the foreign keys.

| Field          | Type      | Attributes              | Description                             |
|----------------|-----------|-------------------------|-----------------------------------------|
| `id`           | `String`  | `@id @default(cuid())`  | Primary key, auto-generated             |
| `employee_id`  | `String`  | `@unique`               | Company-assigned employee ID            |
| `first_name`   | `String`  |                         | First name                              |
| `last_name`    | `String`  |                         | Last name                               |
| `email`        | `String?` | `@unique`               | Email address (optional, but unique)    |
| `phone`        | `String`  | `@unique`               | Phone number, must be unique            |
| `password`     | `String`  |                         | Hashed password — never store plaintext |
| `adhar_number` | `String`  | `@unique`               | Aadhaar number, must be unique          |
| `is_active`    | `Boolean` | `@default(true)`        | Soft-delete / activation flag           |
| `branch_id`    | `String`  |                         | FK → `branches.id`                      |
| `department_id`| `String`  |                         | FK → `departments.id`                   |
| `role_id`      | `String`  |                         | FK → `roles.id`                         |
| `address_id`   | `String`  | `@unique`               | FK → `addresses.id` (1-to-1 enforced)  |
| `created_at`   | `DateTime`| `@default(now())`       | Record creation timestamp               |
| `updated_at`   | `DateTime`| `@updatedAt`            | Auto-updated on every save              |

**Relations:**

| Field        | Type         | Direction | FK held by     |
|--------------|--------------|-----------|----------------|
| `branch`     | `Branch`     | many → 1  | `branch_id`    |
| `department` | `Department` | many → 1  | `department_id`|
| `role`       | `Role`       | many → 1  | `role_id`      |
| `address`    | `Address`    | 1 → 1     | `address_id`   |

**Constraints & Indexes:**
- `@@index([branch_id])` — fast user lookup by branch
- `@@index([department_id])` — fast user lookup by department
- `@@index([role_id])` — fast user lookup by role
- `address_id @unique` — enforces that no two users share the same address row

---

## Relation Summary

| From         | To           | Type     | FK column on        | Constraint                          |
|--------------|--------------|----------|---------------------|-------------------------------------|
| `Department` | `Branch`     | Many → 1 | `departments.branch_id` | `@@unique([name, branch_id])`   |
| `Role`       | `Branch`     | Many → 1 | `roles.branch_id`   | `@@unique([name, branch_id])`       |
| `User`       | `Branch`     | Many → 1 | `users.branch_id`   | `@@index([branch_id])`              |
| `User`       | `Department` | Many → 1 | `users.department_id` | `@@index([department_id])`        |
| `User`       | `Role`       | Many → 1 | `users.role_id`     | `@@index([role_id])`                |
| `User`       | `Address`    | 1 → 1    | `users.address_id`  | `@unique` on `address_id`           |

---

## Indexes & Constraints

| Table         | Type          | Columns                  | Purpose                                  |
|---------------|---------------|--------------------------|------------------------------------------|
| `users`       | UNIQUE        | `employee_id`            | No duplicate employee IDs                |
| `users`       | UNIQUE        | `email`                  | No duplicate emails                      |
| `users`       | UNIQUE        | `phone`                  | No duplicate phone numbers               |
| `users`       | UNIQUE        | `adhar_number`           | No duplicate Aadhaar numbers             |
| `users`       | UNIQUE        | `address_id`             | One address per user (1:1)               |
| `users`       | INDEX         | `branch_id`              | Fast filter/join on branch               |
| `users`       | INDEX         | `department_id`          | Fast filter/join on department           |
| `users`       | INDEX         | `role_id`                | Fast filter/join on role                 |
| `branches`    | UNIQUE        | `name`                   | No duplicate branch names                |
| `departments` | UNIQUE        | `(name, branch_id)`      | Dept name unique within a branch         |
| `departments` | INDEX         | `branch_id`              | Fast filter/join on branch               |
| `roles`       | UNIQUE        | `(name, branch_id)`      | Role name unique within a branch         |
| `roles`       | INDEX         | `branch_id`              | Fast filter/join on branch               |
