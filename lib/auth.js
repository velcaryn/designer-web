/**
 * Who may use the VelBiz Cloud admin area. Read by the Google sign-in
 * callback, the admin layout and every /api/admin/cloud route.
 *
 * VelBiz accounts only. The sign-in is a Google OAuth client owned by the
 * velbiz.com Google account, so Velcaryn's @velcaryn.com admins are not on
 * this list; add a VelBiz address here for anyone else who needs access.
 *
 * Add or remove emails here - nowhere else needs to change. Lowercase only:
 * the check compares against the lowercased address Google returns.
 */
export const ALLOWED_ADMIN_EMAILS = [
    'arumugasamy@velbiz.com',
];
