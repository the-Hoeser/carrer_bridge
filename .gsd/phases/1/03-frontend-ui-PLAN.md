---
phase: 1
plan: 3
wave: 3
---

# Plan: Frontend Feedback UI

## Objective
Provide clear visual feedback to the Admin when a timetable upload fails due to conflicts.

## Tasks
- [ ] Create `frontend/src/components/admin/ConflictReport.tsx`.
- [ ] Update `TimetableManager.tsx` to handle 400 errors and trigger the report modal.
- [ ] Style the conflict report with descriptive icons (User for teacher conflicts, Home for room conflicts).

## Verification
- [ ] Manual test: Try uploading an invalid CSV and verify the new modal appears with correct conflict descriptions.
