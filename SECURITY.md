# Security Analysis and Authorization Documentation

## Executive Summary

This document outlines the security architecture, authorization model, and identified vulnerabilities in the educational platform. All critical issues have been addressed.

## Authorization Model

### User Roles

The platform implements a three-tier role-based access control (RBAC) system:

1. **Student** (`role: "student"`)
   - View published courses and content
   - Track their own progress
   - Cannot create, edit, or delete any content

2. **Teacher** (`role: "teacher"`)
   - View all courses they are assigned to
   - Create and edit modules/lessons in assigned course versions
   - **Cannot delete** modules, lessons, or courses
   - Cannot manage users
   - Cannot promote/demote users

3. **Admin** (`role: "admin"`)
   - Full access to all system features
   - Create, edit, and delete courses
   - Delete modules and lessons
   - Manage users (create, delete, promote, demote)
   - Assign teachers to course versions
   - Manage course branches and merge requests

### Permission Matrix

| Action | Student | Teacher | Admin |
|--------|---------|---------|-------|
| View published courses | ✓ | ✓ | ✓ |
| Create course | ✗ | ✗ | ✓ |
| Edit course | ✗ | ✗ | ✓ |
| Delete course | ✗ | ✗ | ✓ |
| Create module (in assigned version) | ✗ | ✓ | ✓ |
| Edit module (in assigned version) | ✗ | ✓ | ✓ |
| Delete module | ✗ | ✗ | ✓ |
| Create lesson (in assigned version) | ✗ | ✓ | ✓ |
| Edit lesson (in assigned version) | ✗ | ✓ | ✓ |
| Delete lesson | ✗ | ✗ | ✓ |
| Create user | ✗ | ✗ | ✓ |
| Delete user | ✗ | ✗ | ✓ |
| Promote user to teacher | ✗ | ✗ | ✓ |
| Demote user to student | ✗ | ✗ | ✓ |
| Assign teachers to course versions | ✗ | ✗ | ✓ |

## Security Issues Identified and Fixed

### 1. ✅ FIXED: Insufficient Deletion Authorization

**Issue**: Module and lesson deletion use cases were not performing comprehensive validation.

**Impact**: Medium - While only admins could delete, there was no verification that the course/module/lesson existed and belonged to a valid course hierarchy.

**Fix Applied**:
- Added course existence validation in `DeleteModuleUseCase`
- Added course and module existence validation in `DeleteLessonUseCase`
- Ensured consistent error messages
- Added explicit null checks for profile

**Location**: 
- `src/application/use-cases/module/DeleteModuleUseCase.ts`
- `src/application/use-cases/lesson/DeleteLessonUseCase.ts`

### 2. ✅ SECURE: Teacher Assignment Enforcement

**Status**: Already properly implemented

**Implementation**: Teachers can only create/edit modules and lessons in course versions they are assigned to. This is enforced in:
- `UpdateModuleUseCase` (lines 63-76)
- `UpdateLessonUseCase` (lines 75-87)
- `CreateModuleUseCase` (checks assignment)
- `CreateLessonUseCase` (checks assignment)

**Validation**:
```typescript
if (profile.isTeacher()) {
  const isAssigned = await this.courseRepository.isTeacherAssignedToVersion(
    courseVersionId,
    currentUser.id
  );
  
  if (!isAssigned) {
    return {
      success: false,
      error: "No estás asignado a esta versión del curso",
    };
  }
}
```

### 3. ✅ SECURE: User Management Authorization

**Status**: Properly secured

**Implementation**:
- `DeleteUserUseCase`: Checks admin role, prevents self-deletion, prevents deleting last admin
- `PromoteToTeacherUseCase`: Admin-only
- `DemoteToStudentUseCase`: Admin-only
- `CreateUserUseCase`: Admin-only (via server action)

### 4. ✅ SECURE: Course Management Authorization

**Status**: Properly secured

**Implementation**:
- `DeleteCourseUseCase`: Admin-only
- `CreateCourseUseCase`: Admin-only
- `UpdateCourseUseCase`: Admin-only
- Course branch operations: Admin-only

### 5. ✅ SECURE: UI-Level Protection

**Status**: Properly implemented

**Implementation**: Delete buttons are conditionally rendered based on user role:

```typescript
// ModuleManagementClient.tsx (line 188)
{isAdmin && (
  <Button
    size="sm"
    variant="outline"
    onClick={() => setDeletingModule(module)}
    className="border-red-300 text-red-600 hover:bg-red-50"
  >
    <Trash2 className="h-4 w-4 sm:mr-2" />
    <span className="hidden sm:inline">Eliminar</span>
  </Button>
)}

// LessonManagementClient.tsx (line 172)
{isAdmin && (
  <Button /* Delete button */ />
)}
```

## Defense in Depth Strategy

The platform implements multiple layers of security:

### Layer 1: UI/Client-Side
- Role-based conditional rendering
- Hide delete buttons from non-admin users
- Show appropriate error messages

### Layer 2: Server Actions
- Authorization checks in server actions
- Validate user role before calling use cases
- Example: `createUser`, `deleteUser`, `sendPasswordResetEmail`

### Layer 3: Use Cases (Business Logic)
- **Primary authorization layer**
- Verify user authentication
- Check user role and permissions
- Validate resource ownership/assignment
- Prevent unauthorized operations

### Layer 4: Repository Layer
- Data access control
- SQL row-level security (RLS) in Supabase
- Database-level constraints

## Route Protection

### Current Implementation

The application uses page-level protection:

```typescript
// Example from /dashboard/admin/page.tsx
const profileResult = await getCurrentProfile();

if ("error" in profileResult) {
  redirect("/login");
}

const { profile } = profileResult;

if (!profile.isAdmin) {
  redirect("/dashboard");
}
```

### Content Management Routes

The route `/dashboard/admin/courses/[courseId]/content` is accessible to both admins and teachers:

```typescript
// From content/page.tsx (line 39-42)
if (!profile.isAdmin && !profile.isTeacher) {
  redirect("/dashboard");
}
```

This is intentional - teachers need to manage content for courses they're assigned to. The UI adapts based on role:
- Teachers see edit buttons but NOT delete buttons
- Teachers can only modify content in versions they're assigned to (enforced at use case level)

## Business Logic Safeguards

### User Deletion Protection

```typescript
// DeleteUserUseCase protects against:
1. Self-deletion (admin cannot delete themselves)
2. Deleting the last admin (ensures at least one admin always exists)
3. Non-admin users attempting deletion
```

### Course Version Assignment

Teachers are assigned to specific course versions, not entire courses. This enables:
- Teachers to work on draft/branch versions without affecting published content
- Proper isolation between different course iterations
- Controlled release of updated content

### Cascade Deletion

When deleting:
- **Course**: Cascades to delete all versions, branches, modules, and lessons
- **Module**: Cascades to delete all lessons within that module
- **Lesson**: Only deletes the lesson itself

## Tested Security Scenarios

### Scenario 1: Teacher Attempts to Delete Module
1. Teacher navigates to content management
2. Delete button is hidden from UI
3. If teacher bypasses UI and calls API directly → Use case returns error: "Solo los administradores pueden eliminar módulos"

### Scenario 2: Teacher Attempts to Edit Unassigned Course Version
1. Teacher attempts to edit a module in a course version they're not assigned to
2. Use case checks assignment: `isTeacherAssignedToVersion()`
3. Returns error: "No estás asignado a esta versión del curso"

### Scenario 3: Admin Attempts Self-Deletion
1. Admin tries to delete their own account
2. `DeleteUserUseCase` checks if userId matches current user
3. Returns error: "Cannot delete your own account"

### Scenario 4: Deleting Last Admin
1. Admin tries to delete the only remaining admin
2. Use case counts all admins
3. If count <= 1, returns error: "Cannot delete the last administrator"

## Recommendations for Future Enhancements

### 1. Audit Logging
Implement comprehensive audit logs for:
- User deletions
- Role changes
- Course deletions
- Content modifications

### 2. Two-Factor Authentication
Add 2FA for admin accounts to prevent unauthorized access.

### 3. Rate Limiting
Implement rate limiting on sensitive operations:
- User creation
- Password reset requests
- Deletion operations

### 4. Session Management
- Implement session timeout
- Force re-authentication for sensitive operations
- Track active sessions per user

### 5. Content Approval Workflow
For teacher-created content, consider adding:
- Admin approval before content is published
- Change tracking and diff viewing
- Rollback capabilities

## Security Testing Checklist

- [x] Verify role-based access control at use case level
- [x] Test UI-level authorization (conditional rendering)
- [x] Validate teacher assignment checks
- [x] Confirm deletion protections (self-deletion, last admin)
- [x] Review cascade deletion behavior
- [x] Check course version isolation
- [ ] Perform penetration testing (recommended)
- [ ] Conduct security code review (recommended)
- [ ] Test with automated security scanning tools (recommended)

## Conclusion

The educational platform implements a robust multi-layered authorization system. All identified security issues have been addressed. The system follows security best practices including:

- Defense in depth
- Principle of least privilege
- Role-based access control
- Fail-secure defaults
- Input validation
- Resource ownership verification

The authorization model is consistently enforced across all layers of the application, from UI to database.
