---
phase: 1
plan: 2
wave: 2
---

# Plan: API & CSV Resolution

## Objective
Update the timetable upload endpoint to resolve CSV data into assignment IDs and run validations.

## Tasks
- [ ] Refactor `backend/src/controllers/timetable.controller.ts` to integrate `validation.service.ts`.
- [ ] Implement Assignment Resolver: Logic to find matching `Assignment` record based on (Faculty Email + Subject Code + Division Name).
- [ ] Enhance error handling to return an array of conflict objects instead of a single string.

## Verification
- [ ] Integration test: Use Postman/cURL to upload a JSON payload with a conflicting teacher and verify 400 response with conflict details.
