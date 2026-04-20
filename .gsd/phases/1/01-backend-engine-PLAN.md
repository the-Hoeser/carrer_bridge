---
phase: 1
plan: 1
wave: 1
---

# Plan: Backend Validation Engine

## Objective
Implement a centralized validation service to catch teacher and room conflicts at the database level.

## Tasks
- [ ] Create `backend/src/utils/validation-errors.ts` containing custom Error classes for Timetable conflicts.
- [ ] Create `backend/src/services/validation.service.ts`.
- [ ] Implement `checkTeacherAvailability` using Prisma to find existing slots for the same day/slotNumber/teacherId.
- [ ] Implement `checkRoomAvailability` using Prisma to check for room/day/slotNumber overlaps.
- [ ] Export a `validateTimetableSlot` function that aggregates these checks.

## Verification
- [ ] Unit test: Call `checkTeacherAvailability` with a known conflicting ID and expect an error.
- [ ] Unit test: Call `checkRoomAvailability` with a known conflicting room and expect an error.
