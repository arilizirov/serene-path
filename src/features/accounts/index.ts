// Public surface of the accounts feature (F5 — identity & auth).
// Slice 4.1: the credential primitive. Session reading, the AuthProvider
// adapter (server/auth), middleware route protection, and the login UI land in
// the following slices.
export { verifyCredentials, login, logout, getCurrentUser } from "./service";
export type { AuthedUser, Role } from "./service";
