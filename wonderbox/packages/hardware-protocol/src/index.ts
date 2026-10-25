/**
 * HardwareCompanionProtocol
 *
 * A single, versioned contract for the WonderBox audio companion. The software
 * simulator, the PWA and any future physical device speak exactly this — see
 * HARDWARE_PROTOCOL.md for the narrative version.
 */
export * from './version.ts';
export * from './primitives.ts';
export * from './commands.ts';
export * from './events.ts';
export * from './envelope.ts';
export * from './transport.ts';
export * from './session.ts';
