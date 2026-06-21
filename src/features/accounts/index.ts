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
} from "./service";
export type { AuthedUser, Role, UserContact } from "./service";
export { hashPassword } from "./password";
export { loginAction, logoutAction, registerAction } from "./actions";
export type { LoginState, RegisterState } from "./actions";
export { LoginForm } from "./ui/login-form";
export { RegisterForm } from "./ui/register-form";
