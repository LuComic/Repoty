import { readCookie, writeCookie } from "./cookies";
import { hashToken } from "../utils/helper";

export function createSession(userId: string) {
  const token = hashToken(userId);
  writeCookie("session", token);
  return token;
}

export function getSession() {
  return readCookie("session");
}
