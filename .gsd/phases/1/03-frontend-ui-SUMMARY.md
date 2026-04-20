# Summary: Frontend Feedback UI

## Completed Tasks
- [x] Created `ConflictReport.tsx` modal component for displaying validation errors.
- [x] Integrated `papaparse` for CSV client-side parsing in `TimetableManager.tsx`.
- [x] Added `Bulk CSV` upload button with feedback (Loading/Success/Error).
- [x] Implemented row-by-row conflict reporting UI with iconography.

## Verification Results
- Admins can now upload CSVs and see exactly why a validation failed (Teacher or Room conflict).
- Success state refreshes the timetable grid automatically.
