/**
 * Token storage for the web build, which exists for the browser demo and for
 * reviewing screens quickly. `localStorage` is NOT equivalent to the Keychain:
 * any script on the origin can read it. Web is a development and demo target
 * for that reason, and is not a shipping platform.
 */
function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    // A private window with site data blocked throws on access.
    return null;
  }
}

export async function getItem(key: string): Promise<string | null> {
  try {
    return storage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  try {
    storage()?.setItem(key, value);
  } catch {
    // The session simply will not survive a reload, which a demo can live with.
  }
}

export async function deleteItem(key: string): Promise<void> {
  try {
    storage()?.removeItem(key);
  } catch {
    // Nothing to clean up if storage was unavailable in the first place.
  }
}
