# Admin Dashboard Feature Specification

## Overview
The Admin Dashboard provides a comprehensive interface for managing the Tech Radar application data. It allows administrators to manage technologies, blips, users, and perform bulk operations.

---

## 1. Authentication Protection

### Backend
- Add authorization middleware to protect admin routes
- Middleware checks for admin role in user claims
- Returns 401/403 for unauthorized access

### Frontend
- Auth check on `/admin` route
- Redirect to `/login` if not authenticated
- Store auth token in cookies/localStorage

---

## 2. Navigation

### Structure
- **Overview** (default) - Dashboard statistics
- **Technologies** - Technology CRUD operations
- **Blips** - Blip CRUD operations
- **Users** - User management
- **Import/Export** - Bulk data operations

### Implementation
- Use shadcn/ui Tabs component for navigation
- Sidebar-free layout (standalone route group)

---

## 3. Dashboard Overview

### Database Schema (Activity Log)
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| action_type | string | Type of action (see below) |
| description | string | Human-readable description |
| user_id | UUID | Admin user who performed action |
| entity_type | string | Type of entity (technology, blip, user) |
| entity_id | UUID | ID of affected entity |
| created_at | timestamp | When action occurred |

### Statistics Cards
| Metric | Description |
|--------|-------------|
| Total Technologies | Count of all technologies |
| Total Users | Count of all registered users |
| Total Blips | Count of all blips |
| Technologies per Quadrant | 4 cards showing count for each quadrant |
| Technologies per Ring | 4 cards showing count for each ring |

### Recent Items
| Section | Description |
|---------|-------------|
| Recent Technologies | Last 5 technologies added with name, quadrant, created date |
| Recent Users | Last 5 users created with name, email, created date |

### Activity Log
- **Description**: Scrollable list of recent admin actions
- **Location**: Right sidebar or bottom of dashboard
- **Columns**: Timestamp, Action Type, Description, User
- **Action Types**:
  | Type | Icon | Color |
  |------|------|-------|
  | Technology Created | Plus | Green |
  | Technology Updated | Pencil | Blue |
  | Technology Deleted | Trash | Red |
  | Blip Created | Plus | Green |
  | Blip Deleted | Trash | Red |
  | User Created | UserPlus | Green |
  | User Deleted | UserMinus | Red |
  | Bulk Import | Upload | Purple |
  | Bulk Export | Download | Purple |

- **Display**: Show last 20 activities, with "Load More" button
- **Persistence**: Stored in database table (see API section)

### Visual
- Use shadcn/ui Card component
- Grid layout (responsive: 2-4 columns)

---

## 4. Technology Management

### List View
- **Table Columns**: Name, Quadrant, Blip, Created At, Actions
- **Features**:
  - Sortable columns
  - Filter by quadrant (dropdown)
  - Search by name
  - Pagination

### Add Technology
- **Trigger**: "Add Technology" button
- **Modal Form Fields**:
  | Field | Type | Required |
  |-------|------|----------|
  | Name | Text input | Yes |
  | Quadrant | Select dropdown | Yes |
  | Blip | Select dropdown | No |

### Edit Technology
- **Trigger**: Edit icon in table row
- **Modal**: Same as Add, pre-filled with existing data

### Delete Technology
- **Trigger**: Delete icon in table row
- **Confirmation Dialog**: "Are you sure you want to delete [name]?"

---

## 5. Blip Management

### List View
- **Table Columns**: ID, Context Preview, Created At, Updated At, Actions
- **Context Preview**: Truncated JSON (first 50 chars)

### Add/Edit Blip
- **Trigger**: Add button or Edit icon
- **Modal Form Fields**:
  | Field | Type | Required |
  |-------|------|----------|
  | Context | JSON textarea | Yes |

- **Validation**: Must be valid JSON

### Delete Blip
- **Trigger**: Delete icon
- **Warning Dialog**: "This blip is used by X technologies. Deleting it may affect data."

---

## 6. User Management

### List View
- **Table Columns**: Name, Email, Username, Last Login, Actions

### View User Technologies
- **Trigger**: Click on user row to expand
- **Display**: List of technologies assigned to user with ring

### Delete User
- **Trigger**: Delete icon
- **Confirmation Dialog**: "Are you sure you want to delete [name]? This action cannot be undone."

---

## 7. Bulk Import/Export

### Export
- **Trigger**: "Export" button
- **Format**: JSON
- **Content**: All technologies with name, quadrant_id, blip_id

### Import
- **Trigger**: "Import" button
- **Step 1**: File upload (drag & drop or click)
- **Step 2**: Parse and validate JSON
- **Step 3**: Preview with conflict detection
- **Step 4**: Conflict resolution dialog

### Conflict Resolution Dialog
- **Message**: "X technologies already exist"
- **Options**:
  | Option | Behavior |
  |--------|----------|
  | Skip | Keep existing, add only new |
  | Overwrite All | Replace existing with imported |
  | Select Individually | Checkbox list to choose which to overwrite |

### Import JSON Schema
```json
{
  "technologies": [
    {
      "name": "React",
      "quadrant_id": 1,
      "blip_id": 1
    }
  ]
}
```

---

## 8. API Endpoints

### Existing Endpoints (for reference)
| Method | Endpoint | Usage |
|--------|----------|-------|
| GET | `/blips` | List all blips |
| POST | `/blips` | Create blip |
| GET | `/blips/{id}` | Get blip |
| PUT | `/blips/{id}` | Update blip |
| DELETE | `/blips/{id}` | Delete blip |
| GET | `/technologies` | List all technologies |
| POST | `/technologies` | Create technology |
| GET | `/technologies/{id}` | Get technology |
| PUT | `/technologies/{id}` | Update technology |
| DELETE | `/technologies/{id}` | Delete technology |
| GET | `/users` | List all users |
| GET | `/users/{id}` | Get user |
| DELETE | `/users/{id}` | Delete user |

### New Endpoints Required
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/stats` | Dashboard statistics |
| GET | `/admin/activity` | Get recent activity log (paginated) |
| POST | `/admin/activity` | Log a new activity entry |
| GET | `/quadrants` | List all quadrants |
| GET | `/rings` | List all rings |
| POST | `/technologies/bulk-import` | Bulk import with conflict resolution |

---

## 9. Frontend Components (shadcn/ui)

### Required Components
- `Card` - Statistics cards, content containers
- `Table` - Data listings
- `Tabs` - Navigation
- `Dialog` - Add/Edit forms, confirmations
- `Select` - Dropdowns for quadrant, blip, ring
- `Button` - Actions
- `Input` - Text fields
- `Label` - Form labels
- `DropdownMenu` - Row actions menu

---

## 10. User Flows

### Add Technology Flow
1. Click "Add Technology" button
2. Modal opens with form
3. Fill in name (required), select quadrant (required), select blip (optional)
4. Click "Save"
5. API call to `POST /technologies`
6. On success: Close modal, refresh table, show success toast
7. On error: Show error message in modal

### Import Flow
1. Click "Import" button
2. Upload JSON file (drag & drop)
3. System parses and validates
4. Preview shows: New technologies (green), Existing technologies (yellow)
5. If conflicts exist: Show conflict resolution dialog
6. User selects resolution option
7. Click "Import"
8. API call to `POST /technologies/bulk-import`
9. On success: Show summary (X new, Y updated), refresh table

---

## 11. Error Handling

### Form Validation
- Required fields: Show inline error "This field is required"
- Invalid JSON: Show "Invalid JSON format"

### API Errors
- Network error: Show toast "Connection error. Please try again."
- 401 Unauthorized: Redirect to login
- 403 Forbidden: Show "You don't have permission to perform this action"
- 500 Server Error: Show toast "Server error. Please try again later."

---

## 12. Acceptance Criteria

### Authentication
- [ ] Unauthenticated users are redirected to /login when accessing /admin
- [ ] Authenticated non-admin users see "Access Denied" message

### Technology Management
- [ ] Can view list of all technologies
- [ ] Can filter technologies by quadrant
- [ ] Can add new technology with name, quadrant, blip
- [ ] Can edit existing technology
- [ ] Can delete technology with confirmation
- [ ] Changes reflect immediately in the list

### Blip Management
- [ ] Can view list of all blips
- [ ] Can add new blip with JSON context
- [ ] Can edit existing blip
- [ ] Can delete blip (with warning if referenced)
- [ ] Invalid JSON is rejected with error message

### User Management
- [ ] Can view list of all users
- [ ] Can expand row to see user's technologies
- [ ] Can delete user with confirmation

### Import/Export
- [ ] Can export all technologies as JSON file
- [ ] Can import technologies from JSON file
- [ ] Duplicate detection works correctly
- [ ] Conflict resolution dialog appears for duplicates
- [ ] Skip, Overwrite All, and Select options work correctly

### Dashboard
- [ ] Shows total technology count
- [ ] Shows total user count
- [ ] Shows total blip count
- [ ] Shows technology count per quadrant
- [ ] Shows technology count per ring
- [ ] Shows recent technologies (last 5)
- [ ] Shows recent users (last 5)
- [ ] Shows activity log with recent actions
- [ ] Activity log displays correct icon and color for each action type