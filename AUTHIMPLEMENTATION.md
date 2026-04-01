# Complete Authentication & Authorization Plan

## Overview
Implementing a stateless JWT authentication system using HttpOnly cookies, with UUIDs for identifiers. Unauthenticated users can view posts, but only authenticated users can create posts, and users can only edit or delete their own posts.

## Phase 1: Database & Data Layer (PostgreSQL + sqlc)
1. **Schema Migrations**:
   * Create a `users` table with `id` (UUID), `email` (unique), `password_hash`, and timestamps.
   * Modify the `posts` table to change its `id` to UUID (for consistency) and add a `user_id` (UUID) foreign key referencing `users(id)`. *(Note: Since this is a template, we will likely drop and recreate the posts table to cleanly switch from SERIAL to UUID).*
2. **SQL Queries (`query.sql`)**:
   * Add: `CreateUser`, `GetUserByEmail`, `GetUserById`.
   * Update `ListPosts`: Return all posts, optionally joining the `users` table to fetch the creator's email.
   * Update `CreatePost`: Require `user_id`.
   * Update `UpdatePost` & `DeletePost`: Require both `id` AND `user_id` in the `WHERE` clause to enforce ownership at the database level.
3. **Generate Models**: Run `sqlc generate`.

## Phase 2: Backend API (Golang)
1. **Authentication Service**: Implement password hashing (`bcrypt`) and JWT generation/validation.
2. **Auth Endpoints**:
   * `POST /api/auth/register`: Create account.
   * `POST /api/auth/login`: Verify credentials, generate JWT, and set it in an `HttpOnly` cookie.
   * `POST /api/auth/logout`: Clear the cookie.
   * `GET /api/auth/me`: Return current user data based on the cookie.
3. **JWT Middleware**: Middleware that checks for the `HttpOnly` cookie, validates the JWT, and adds the `user_id` to the request context.
4. **Post Handlers**:
   * `GET /api/posts`: **Public** (No middleware required).
   * `POST /api/posts`: **Protected** (Requires middleware). Injects `user_id` from context.
   * `PUT /api/posts/:id` & `DELETE /api/posts/:id`: **Protected**. Passes `user_id` to the DB query to ensure the user is the owner. Returns 403 Forbidden/404 Not Found if they aren't.

## Phase 3: Frontend (Next.js)
1. **Auth Pages**: Build `/login` and `/register` pages with standard forms.
2. **API Client**: Ensure all `fetch` calls to the backend include `credentials: 'include'` so the browser sends the `HttpOnly` cookie.
3. **Auth State/Context**: Create a way to store the current user (fetched from `/api/auth/me` on load) to determine if someone is logged in.
4. **UI Authorization**: On the main posts list (which is public), conditionally render the "Edit" and "Delete" buttons *only* if `currentUser.id === post.user_id`.
