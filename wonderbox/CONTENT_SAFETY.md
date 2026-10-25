# Content and child safety

WonderBox talks to children who are five. This document is the reasoning behind
how it does that, and — as much as it matters — what it refuses to do.

---

## The central decision: curated graphs, not generative chat

Every word a child hears is written by a person, reviewed by a second person,
and stored as a node in a directed graph. There is no language model in the
child's path. Not a filtered one, not a guardrailed one, not a
retrieval-grounded one. None.

This is a product decision, not a technical limitation:

- **A generative system cannot be reviewed before it speaks.** Review is the
  only control that actually works on content for children, and it only works on
  content that exists in advance.
- **A five-year-old cannot evaluate what they are told.** An adult reading a
  confidently wrong answer applies scepticism. A child building a circuit does
  what the voice says.
- **Physical experiments have physical failure modes.** A model that invents a
  plausible-sounding extra step for an experiment involving batteries, plaster
  or a door frame is a safety incident, not a bad user experience.
- **Parents are asked to trust a box in a bedroom with no screen.** "Everything
  it can say was written down and approved beforehand" is a promise that can be
  kept. "It has good guardrails" is not.

### What is lost, honestly

A curated graph cannot answer a question nobody anticipated. A child who asks
"but why is the Moon grey?" gets whatever branch the author wrote, or nothing.
That is a real cost, and we take it: the branches an author *did* write — a
hint, a rephrasing, a "say that again" — cover the cases that actually come up
during an activity, and the ones they miss belong to the adult in the room.

## How a graph is built

```
  intro ──"ready"──▶ question ──"right"───▶ confirm ──▶ safety ──▶ build ──▶ …
                        │  ▲
              "unsure"  │  │ "again" (repeat)  ·  "slower" (repeat, slower)
                        ▼  │
                       hint ┘
```

Node kinds: `NARRATION`, `QUESTION`, `HINT`, `PAUSE`, `EXPERIMENT_STEP`,
`SAFETY`, `CELEBRATION`.

Rules the seeded content follows, and the studio surfaces:

**A wrong answer is a different path, never a failure.** There is no buzzer, no
score, no "try again" loop. `unsure` and a wrong guess route to the same hint,
and the hint rejoins the main line. A child who never gets it still finishes the
chapter having done the experiment.

**Every branch rejoins.** The studio flags unreachable nodes on the chapter
editor, because a node nobody can reach is a node nobody reviewed in context.

**"Say it again" and "slower" are edges, not chrome.** They are the two controls
a child uses most, so they are part of the graph and every client handles them
identically.

**A pause is content.** `pauseSeconds` is dead air while a child ties a string
to a chair. The companion parks and waits; a child who is ready can press on.
Carrying a child past an activity on a timer is the specific failure this
product exists to avoid.

**Safety nodes come before the step they guard**, not in a footnote. Chapter
one of the alarm box says *"never use a wall socket"* in its own `SAFETY` node,
before any wiring, and the sales page says it too.

## Review, and why publishing is narrow

```
  DRAFT ──submit──▶ IN_REVIEW ──approve──▶ APPROVED ──publish──▶ PUBLISHED
    ▲                    │                                            │
    └──── reject ────────┘                          previous version ─┘ ARCHIVED
```

Enforced in `publishVersion()` (`src/server/content.ts`):

1. **A version must be APPROVED to publish.** Draft and in-review content is not
   publishable.
2. **The approval must come from someone other than the author.** An editor
   with both roles still cannot wave their own work through.
3. **Editing does not un-publish.** An edit creates a new draft; children keep
   hearing the live version until the new one is approved. Exactly one version
   of a chapter is live at a time.

`publishedChapterVersion()` is the *only* gate, and everything that could serve
content to a child goes through it: the companion API, the play page, and the
audio route. Audio attached to an unpublished chapter is a 404, so the gate
cannot be walked around by requesting the file directly.

Tested in `tests/content-approval.test.ts`, from several directions — including
the one a sceptical reader would try first, which is whether an AI draft can
skip the queue.

## AI for editors, never for children

Adult content editors can ask a provider for a draft: an outline, a phrasing, a
translation. That is a real productivity tool and it is available at
`/studio/drafts`.

Three structural facts keep it away from children:

1. **The port is behind `content.aiDraft`**, a permission held only by editors,
   approvers and admins. Parents do not have it. There is no code path from a
   child's device to a model.
2. **Output is persisted as `ContentVersion(state: DRAFT, source: AI_DRAFT)`.**
   It cannot be anything else — that is what the function does.
3. **`publishVersion()` does not care where a draft came from.** An AI draft
   needs the same human approval by a second person as anything else.

Every AI draft carries reviewer notes that name what a reviewer must check:
that instructions match the physical kit, that safety wording survived, that
nothing requires an adult who has not been asked for.

The interface says so plainly, in Dutch and English, on the page itself.

## What the parent summary will not say

The summary reports **what happened**: chapters finished, experiments done,
minutes listened, topics that came up, and a few conversation starters lifted
from the chapter introductions.

It does not report a score, a level, a percentile, a comparison to other
children, a readiness estimate, or a developmental claim of any kind. The page
says this out loud rather than leaving it implied:

> *WonderBox geeft geen cijfers en meet geen ontwikkeling. Dit is alleen wat er
> gebeurd is.*

This is not modesty. A monthly activity box observes a child for perhaps an hour
a month, through button presses, with a sibling probably helping. Any inference
about development from that data would be unsupported, and a parent would
reasonably act on it. The `SummaryView` type has nowhere to put a score, and
there is a test asserting it stays that way.

## Localisation and the fallback chain

Content is stored as a locale map and resolved through one function, which
reports which locale it actually used. `nl → en`, `en → nl`.

A missing translation degrades to the other language rather than to silence, and
the companion tells the child what happened — a child who suddenly hears English
deserves an explanation. The studio shows per-node translation gaps so an editor
can see what is outstanding.

## Reporting

A parent reporting something a child heard picks **Melding over content** on the
ordinary support form — the same form as a late parcel, deliberately, because a
worried parent should not have to find a special page.

A `CONTENT_CONCERN` or `SAFETY_REPORT` is filed at `WARNING` severity and
arrives pre-triaged, sorted above everything else in the support queue. It can
carry the `DialogueNode` id, so a reviewer can read the exact words rather than
asking the parent to reconstruct them.

## What is not built here

- **No child-facing free text.** No chat, no open questions, no typing.
- **No messaging, no profiles, no social features.** A child cannot be contacted
  through WonderBox, because there is no mechanism and no identifier to contact.
- **No advertising, no sponsorship, no third-party content.** No third-party
  script loads on any page.
- **No behavioural profiling.** Progress events exist to resume a chapter and to
  tell a parent what happened. They do not feed a recommender.
- **Speech-to-text is off.** The consent machinery exists and is documented in
  `SECURITY_AND_PRIVACY.md`; the feature is disabled and has no provider.

## For content editors

Before submitting a chapter for review:

- Read every line **out loud**, at the pace a five-year-old listens.
- One instruction per node. If a node needs "and then", split it.
- Give a real pause to anything involving hands, and be generous.
- Write the hint for the child who is stuck, not for the one who is nearly right.
- Check every material against the kit contents. If it is not in the box and not
  in a normal house, it does not exist.
- Anything sharp, hot, electrical or sticky gets a `SAFETY` node before the step
  and `requiresAdult` if it needs one.
- Make sure a wrong answer still reaches the end of the chapter.
- Fill in both locales, or accept that a child will hear the other language.
