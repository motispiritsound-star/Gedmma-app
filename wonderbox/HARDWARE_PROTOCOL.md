# HardwareCompanionProtocol

Version **1.0.0** · `packages/hardware-protocol`

The contract between WonderBox software and the physical audio companion. It is
defined once, in TypeScript with Zod schemas, and compiled by everything that
speaks it: the server, the PWA companion at `/play`, and the browser emulator
at `/emulator`.

There is no hardware yet. That is precisely why this exists as a versioned
package rather than as an implicit understanding — the firmware team needs
something to build against, and the application needs something that breaks
loudly when it changes.

---

## What the device is

Assume the worst honestly:

- **No display.** Four buttons and a speaker. The PWA has a screen, but nothing
  in the protocol depends on one.
- **Offline half the time.** It is a box in a bedroom. Losing the network is the
  normal case, not an error.
- **Cannot be redeployed.** Firmware updates are rare and risky. A device that
  receives a frame it does not understand must keep playing, not crash in a
  child's hands.
- **Anonymous.** `deviceId` is burned in at manufacture and is never derived
  from a child. The device knows a box id; it does not know who is listening.

## Frames

Everything on the wire is an envelope:

```jsonc
{
  "v": "1.0.0",
  "correlationId": "9e6d…",   // unique per frame; replies echo it
  "sentAt": "2026-03-01T10:00:00.000Z",
  "payload": {
    "direction": "command",   // host → device
    "body": { "type": "play", "nodeId": "n-42", "speed": "normal", "offsetMs": 0 }
  }
}
```

`decodeEnvelope()` never throws. It returns `{ ok: false, error }` for anything
it cannot parse — garbage JSON, a missing field, an unknown command type. A
companion that receives a malformed frame logs it and carries on.

### Versioning

The device announces its version in `hello`. The host refuses a different
**major** version and answers `ready` with `accepted: false`. Minor and patch
differences are compatible: new optional fields may be added, existing fields
may not change meaning.

Breaking the protocol means shipping `2.0.0` and supporting both until the last
`1.x` device is retired.

---

## Commands (host → device)

| Command | Purpose |
| --- | --- |
| `hello` | Handshake. Announces `deviceId`, protocol version and capabilities. |
| `activateBox` | Claim a physical box with its printed code, a QR scan or an NFC tap. |
| `loadChapter` | Fetch a chapter's dialogue graph and audio manifest. |
| `play` | Start or resume narration at a node, optionally at an offset. |
| `pause` | Stop, with a reason (`child`, `parent`, `inactivity`, `lowBattery`, `system`). |
| `repeat` | Replay the current node. `mode: "slower"` also drops the speed. |
| `setSpeed` | Change narration speed without restarting the node. |
| `selectChoice` | The child pressed a button. Carries its own `clientEventId`. |
| `setProgress` | Authoritative restore from the host, e.g. after a battery swap. |
| `syncWhenOnline` | Drain the device's offline queue. |
| `setVolume` | 0–1; the device clamps to its own parental maximum. |

### `hello`

```jsonc
{
  "type": "hello",
  "deviceId": "wb-0001-8f2a",
  "protocolVersion": "1.0.0",
  "firmwareVersion": "1.2.0",
  "capabilities": {
    "offlineStorageBytes": 67108864,
    "hasNfc": true,
    "hasButtons": 4,
    "canChangeSpeed": true,
    "hasMicrophone": false     // defaults to false, deliberately
  }
}
```

`hasMicrophone` defaults to `false` and stays false unless a device really has
one *and* the family has opted in. See `SECURITY_AND_PRIVACY.md`.

### `activateBox`

```jsonc
{ "type": "activateBox", "code": "WB-3F7K-22AA-M9X1", "source": "nfc" }
```

Codes are twelve characters of Crockford base32 without `I`, `L`, `O` or `U` —
60 bits of entropy, and no character a child can misread aloud. The schema
normalises whatever arrives (`wb 3f7k 22aa m9x1`) into canonical form.

The device never sees the code again: the host replies with an opaque
`activatedBoxId`.

### `loadChapter`

```jsonc
{
  "type": "loadChapter",
  "activatedBoxId": "abx_9f2",
  "chapterId": "chp_launch",
  "locale": "nl",
  "prefetchAudio": true
}
```

The host applies **two** gates before answering: the family must own the box,
and the chapter must have a published, human-approved content version. An
unapproved chapter is `error: notApproved`, never a draft.

### `syncWhenOnline`

```jsonc
{
  "type": "syncWhenOnline",
  "activatedBoxId": "abx_9f2",
  "deviceId": "wb-0001-8f2a",
  "events": [
    { "clientEventId": "5f2e…", "type": "chapterStarted", "chapterId": "chp_launch",
      "occurredAt": "2026-03-01T09:41:02.000Z" },
    { "clientEventId": "7a1c…", "type": "choiceSelected", "nodeId": "n-question",
      "choiceKey": "unsure", "occurredAt": "2026-03-01T09:42:20.000Z" }
  ]
}
```

Capped at 500 events per batch, so a device with a corrupted queue cannot flood
the host.

---

## Events (device → host, and command results)

| Event | Meaning |
| --- | --- |
| `ready` | Handshake result. `accepted: false` means incompatible major version. |
| `activationResult` | `ok`, plus `activatedBoxId` — or a deliberately coarse error. |
| `chapterLoaded` | The dialogue graph, the audio manifest and the content version. |
| `playbackState` | What is actually playing: node, state, speed, offset, volume. |
| `progressRecorded` | Which client event ids were stored, which were duplicates. |
| `offlineQueued` | How much is waiting, and how old the oldest entry is. |
| `deviceStatus` | Battery, connectivity, storage. |
| `error` | A coded failure, echoing the failed command's `correlationId`. |

### `activationResult` errors are coarse on purpose

`invalidCode`, `alreadyActivated`, `notOwned`, `revoked`, `rateLimited` — and a
code that exists but has not shipped yet returns `notOwned`, the same as a code
belonging to another family. The endpoint must not become an oracle for testing
whether an arbitrary code is real.

### `chapterLoaded`

```jsonc
{
  "type": "chapterLoaded",
  "activatedBoxId": "abx_9f2",
  "chapterId": "chp_launch",
  "title": "Hoofdstuk 1: De lancering",
  "entryNodeId": "n-welcome",
  "locale": "nl",
  "contentVersion": 3,
  "nodes": [
    {
      "id": "n-question",
      "key": "question-push",
      "kind": "question",
      "text": "Hoe komt hij dan toch vooruit?",
      "servedLocale": "nl",
      "pauseSeconds": 8,
      "isTerminal": false,
      "choices": [
        { "key": "right",  "label": "Hij duwt lucht naar achteren", "targetNodeId": "n-confirm", "isRepeat": false, "isSlower": false },
        { "key": "unsure", "label": "Geen idee",                    "targetNodeId": "n-hint",    "isRepeat": false, "isSlower": false },
        { "key": "again",  "label": "Nog een keer",                 "targetNodeId": null,        "isRepeat": true,  "isSlower": false },
        { "key": "slower", "label": "Langzamer",                    "targetNodeId": null,        "isRepeat": false, "isSlower": true }
      ]
    }
  ],
  "audio": [
    { "nodeId": "n-question", "locale": "nl", "servedLocale": "nl",
      "url": "/api/storage?key=…&expires=…&sig=…", "durationMs": 9400, "checksum": "…" }
  ]
}
```

`servedLocale` appears on both nodes and audio tracks. When it differs from the
requested `locale`, a translation was missing and the fallback chain ran — the
companion can say so instead of going silent.

`checksum` lets a device verify a cached file rather than re-downloading it.

---

## The session state machine

`CompanionSession` implements traversal once, for everyone.

```
   loadChapter
        │
        ▼
      idle ──play──▶ playing ──narrationEnded──┬─▶ (single exit, no pause) ─▶ playing
        ▲               │                      │
        │             pause                    ├─▶ awaitingChoice ──selectChoice──▶ playing
        │               ▼                      │         │
        └── resume ── paused                   │      (pause elapsed,
                                               │       single exit)
                                               └─▶ finished
```

The rule that matters: a node waits for the child when it asks a question, when
it offers more than one way forward, **or when it declares a pause**. A pause is
a child with their hands full; carrying them past it after a fixed number of
seconds is exactly the failure this product exists to avoid. A child who is
ready presses the button and skips ahead; a child who is busy is carried on when
the pause elapses.

Only a plain narrative beat with a single exit and no pause flows on by itself.

### Offline queue

Every transition appends `{ clientEventId, type, nodeId?, choiceKey?, occurredAt }`.
Entries leave the queue **only** when the host acknowledges them:

```ts
const result = await post('/api/companion/progress', {
  type: 'syncWhenOnline', activatedBoxId, events: [...session.pendingEvents],
});
session.acknowledge([
  ...result.acceptedClientEventIds,
  ...result.duplicateClientEventIds,   // already stored — also safe to drop
]);
```

A half-delivered batch is retried. `ProgressEvent.clientEventId` is unique in
the database, so replaying the same queue ten times produces the same rows.

`snapshot()` / `restoreSnapshot()` carry the queue and the current position
through a power cut.

---

## Transports

```ts
interface CompanionTransport {
  send(envelope: Envelope): Promise<void>;
  subscribe(listener: (envelope: Envelope) => void): () => void;
  close(): Promise<void>;
}
```

Shipped: `LoopbackTransport`, used by the emulator and the protocol tests, where
device and host share a process. The PWA uses plain HTTP against
`/api/companion/*`.

A BLE GATT transport would implement the same three methods: write the JSON to a
characteristic, notify on another, chunk to the MTU. Nothing above the transport
changes.

---

## HTTP mapping

| Command | Endpoint |
| --- | --- |
| `activateBox` | `POST /api/emulator/activate` |
| `loadChapter` | `GET /api/companion/chapter?activatedBoxId&chapterId&locale` |
| `syncWhenOnline` | `POST /api/companion/progress` |
| audio fetch | `GET /api/storage?key&expires&sig` (short-lived signature) |

Playback commands (`play`, `pause`, `repeat`, `setSpeed`, `selectChoice`,
`setVolume`) are handled entirely on the device. The host is authoritative about
*what should be playing*; the device is authoritative about *whether it is* — its
speaker may be muted, its battery may be flat.

---

## Trying it

Sign in as the demo parent, activate a box, and open **`/emulator`**. Every
frame appears on the wire log as it is sent. The "old firmware" button sends
`protocolVersion: 0.9.0` and gets refused, which is the version check doing its
job.

---

## Firmware checklist

1. Send `hello` on connect. Refuse to continue if `ready.accepted` is false.
2. Persist `activatedBoxId`, the chapter payload and the queue to flash. Assume
   power loss at any moment.
3. Verify cached audio against `checksum` before playing it.
4. Never drop a queue entry the host has not acknowledged.
5. Treat `error: notApproved` as "this chapter does not exist" — say so, do not
   retry, do not fall back to a cached older version.
6. Keep the microphone powered down unless `hasMicrophone` is true *and* the
   host has confirmed consent for this family.
7. On an unparseable frame: log, drop, keep playing.
