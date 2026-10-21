const STORAGE_KEY = 'trend-getter:github-token';

let sessionToken = null;

export function readToken() {
  return sessionToken ?? withStorage(() => localStorage.getItem(STORAGE_KEY));
}

export function saveToken(token) {
  sessionToken = token;
  withStorage(() => localStorage.setItem(STORAGE_KEY, token));
}

export function clearToken() {
  sessionToken = null;
  withStorage(() => localStorage.removeItem(STORAGE_KEY));
}

function withStorage(action) {
  try {
    return action();
  } catch {
    return null;
  }
}
