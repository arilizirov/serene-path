// Public surface of the accounts feature (F5 — identity & auth).
// Slice 4.1: the credential primitive. Session reading, the AuthProvider
// adapter (server/auth), middleware route protection, and the login UI land in
// the following slices.
export {
  verifyCredentials,
  login,
  logout,
  getCurrentUser,
  getUserContact,
  requireRole,
  registerClient,
  startSessionFor,
  normalizeEmail,
  getSignupStats,
  listAllUsers,
  createAdmin,
  setUserRole,
  resetUserPassword,
  deleteUser,
} from "./service";
export type {
  AuthedUser,
  Role,
  UserContact,
  SignupStats,
  AdminUser,
  SetRoleResult,
  DeleteUserResult,
} from "./service";

// Role/identity lookups other features and admin actions read through the public
// surface (countByRole feeds the last-admin lockout; findUserRole reads a stored
// role). Re-exported from the repository leaf so the boundary stays intact.
export { countByRole, findUserRole } from "./repository";
export { hashPassword } from "./password";
export { passwordSchema, roleSchema, createAdminSchema } from "./schema";
export type { CreateAdminInput } from "./schema";
export { loginAction, logoutAction, registerAction } from "./actions";
export type { LoginState, RegisterState } from "./actions";
export { LoginForm } from "./ui/login-form";
export { RegisterForm } from "./ui/register-form";
