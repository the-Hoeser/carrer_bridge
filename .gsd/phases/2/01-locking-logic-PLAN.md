---
phase: 2
plan: 1
wave: 1
---

# Plan: Backend Locking Logic

## Objective
Implement the automated time-based record locking to prevent retroactive attendance changes.

## Tasks
- [ ] Add `isLocked` helper to `backend/src/services/attendance.service.ts`.
- [ ] Logic: A slot is locked if `Now > SlotDateTime + 24 Hours`.
- [ ] Create `backend/src/middleware/lock.middleware.ts`.
- [ ] Register middleware on attendance update/delete routes.

## Verification
- [ ] Unit Test: Verify `isLocked` returns true for a slot from 2 days ago.
- [ ] Integration Test: Attempt to delete attendance for a 2-day-old slot and expect 403 Forbidden.
