---
phase: 2
plan: 2
wave: 2
---

# Plan: Overrides & Audit

## Objective
Provide a mechanism for authorized users to override the lock and audit these actions.

## Tasks
- [ ] Add `AttendanceOverride` model to `schema.prisma`.
- [ ] Implement `grantOverride` API (Admin only).
- [ ] Update `isLocked` logic to check for active overrides in the DB.
- [ ] Create `backend/src/controllers/admin.controller.ts` for override management.

## Verification
- [ ] Create an override for a locked slot.
- [ ] Verify attendance can now be edited for that specific slot only.
