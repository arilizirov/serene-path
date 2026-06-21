// Public surface of the accounts feature (F5 — identity & auth).
// Slice 4.1: the credential primitive. Session reading, the AuthProvider
// adapter (server/auth), middleware route protection, and the login UI land in
// the following slices.
export {
  verifyCredentials,
  login,
  logout,
  getCurrentUser,
  requireRole,
} from "./service";
export type { AuthedUser, Role } from "./service";
export { loginAction, logoutAction } from "./actions";
export type { LoginState } from "./actions";
export { LoginForm } from "./ui/login-form";
