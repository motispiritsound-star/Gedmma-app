/**
 * HardwareCompanionProtocol version.
 *
 * The protocol is versioned independently of the application. A companion
 * device announces the version it speaks in its `hello` handshake; the host
 * refuses to drive a device whose major version differs from its own.
 */
export const PROTOCOL_VERSION = '1.0.0' as const;
export const PROTOCOL_MAJOR = 1 as const;

export function isCompatible(remoteVersion: string): boolean {
  const major = Number.parseInt(remoteVersion.split('.')[0] ?? '', 10);
  return Number.isInteger(major) && major === PROTOCOL_MAJOR;
}
