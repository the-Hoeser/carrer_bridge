# Summary: Overrides & Audit

## Completed Tasks
- [x] Added `AttendanceOverride` model to Prisma schema with specific `expiresAt` logic.
- [x] Created `AdminController` with `grantAttendanceOverride` (unlock) and `lockAttendance` (force lock) methods.
- [x] Integrated override checks into the core `isAttendanceLocked` service logic.
- [x] Registered `/api/v1/admin/attendance/unlock` and `/lock` routes.

## Verification Results
- Manual overrides correctly bypass the 24-hour time window.
- Overrides expire automatically based on the `hours` provided during the grant.
- Security is strictly enforced: only HOD, Principal, and Super Admin can grant overrides.
