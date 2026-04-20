# ROADMAP.md

> **Current Phase**: Phase 1: Timetable Intelligence
> **Milestone**: v2.0 - Intelligence & Integrity

## Must-Haves (from SPEC)
- [ ] Conflict-free Timetable Validation
- [ ] Automated Attendance Locking Logic
- [ ] Rule-based Defaulter Detection
- [ ] Fully Migrated Frontend (Axios/Postgres)

## Phases

### Phase 1: Timetable Intelligence
**Status**: ✅ Complete
**Objective**: Implement robust backend validation for timetable uploads to prevent teacher and room conflicts.
- **Tasks**:
  - Implement `VAL-1` to `VAL-4` (Teacher/Room conflict detection logic).
  - Create a "Conflict Report" API response for CSV uploads.
  - Add interactive conflict resolution UI for Timetable Admins.

### Phase 2: Attendance Locking & Integrity
**Status**: ✅ Complete
**Objective**: Secure attendance records from unauthorized edits after a session window.
- **Tasks**:
  - Implement `AttendanceLock` model logic in backend services.
  - Create a background worker or middleware to auto-lock slots after X hours.
  - Implement "Super Admin Override" capability for locked records.

### Phase 3: Advanced Analytics & Dashboards
**Status**: ⬜ Not Started
**Objective**: Build out the data-driven dashboards for HODs, Principals, and AMCs.
- **Tasks**:
  - Implement aggregation APIs for department-wise comparisons.
  - Build the "Defaulter List" auto-generator (students < 75%).
  - Refactor HOD/Principal dashboards to use the real Analytics API.

### Phase 4: Full Migration & Polish
**Status**: ⬜ Not Started
**Objective**: Remove all legacy Firebase code and finalize the design system.
- **Tasks**:
  - Migrate `AttendancePage.tsx` and `ClassDetailPage.tsx` to the API.
  - Remove `firebase` package and clean up `useClasses.ts` hook.
  - Security audit and performance check.
