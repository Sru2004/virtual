# TODO: Fix Logout Redirect Behavior

## Current Issue
- When logging out, the app always redirects to `/login` regardless of user type (artist or buyer/user).
- The user wants artists to be redirected to the login page and buyers (users) to the home page upon logout.
- Currently, logout doesn't properly clear state in some cases, causing unexpected redirects.

## Plan
1. Modify `Navbar.jsx` handleLogout function to:
   - Capture the user type before calling logout.
   - After logout, redirect based on user type: artists to `/login`, users to `/`.
2. Ensure `AuthContext.jsx` logout function properly clears all authentication state.
3. Test that protected routes still work correctly after logout.

## Steps
- [x] Update handleLogout in Navbar.jsx to conditionally redirect based on user type.
- [x] Verify logout clears token and state properly in AuthContext.
- [x] Test logout for both artist and user accounts.
- [x] Modified ProtectedUserRoute and ProtectedArtistRoute to prevent premature redirects.
