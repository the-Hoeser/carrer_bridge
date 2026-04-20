# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
A robust, hierarchy-aware Attendance Management System for the college that moves beyond simple record-keeping into intelligent timetable validation, secure data integrity (locking), and multi-level academic analytics.

## Goals
1. **Intelligent Timetable Validation:** Prevent scheduling conflicts (teacher double-booking, room overlaps) before they happen.
2. **Data Integrity (Attendance Locking):** Implement a secure window-based locking system to prevent unauthorized retroactive changes.
3. **Advanced Analytics:** Provide HODs and Principals with deep insights into department comparisons, defaulter alerts, and engagement trends.
4. **Complete Migration:** Phase out legacy Firebase code in favor of the custom Postgre/Node backend to ensure a unified architecture.

## Non-Goals (Out of Scope)
- Mobile application (React Native) — slated for Post-v1.
- Biometric/QR integration — slated for Post-v2.
- Payment/Fee management — explicitly out of scope for this system.

## Users
- **Super Admin:** System config and user control.
- **Timetable Admin:** Manages schedules and validations.
- **Faculty (Teachers/HOD/AMC):** Mark attendance and view scoped analytics.
- **Principal:** High-level institutional oversight.
- **Students:** View personal attendance history and deficiency alerts.

## Constraints
- **Technical:** Must maintain the monorepo structure (React/Node).
- **Security:** RBAC must be enforced strictly at the API level (not just UI).
- **Timeline:** Focus on "logic-heavy" features (Validation/Analytics) immediately.

## Success Criteria
- [ ] Timetable upload rejects conflicts with descriptive error reports.
- [ ] Attendance records automatically lock based on a configurable time window.
- [ ] Dashboards display live data comparisons between departments/years.
- [ ] Zero lines of Firebase code remain in the repository.
