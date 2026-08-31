/**
 * Seed.
 *
 * Produces a database you can actually demonstrate: three complete boxes with
 * approved, published content in Dutch and English, placeholder narration you
 * can press play on, stock on the shelf, and a demo family that has paid for a
 * box, activated it and listened to part of chapter one.
 *
 * Re-runnable: it truncates the application tables first, so `npm run db:seed`
 * always lands in the same known state.
 */
import { createHash } from 'node:crypto';
import { PrismaClient, type Prisma } from '@prisma/client';
import { hashPassword } from '../src/lib/crypto.ts';
import { objectStorage } from '../src/lib/providers/storage/index.ts';
import { hashActivationCode } from '../src/server/activation.ts';
import { generateActivationCode } from '../src/lib/crypto.ts';
import { addMonths } from '../src/server/subscriptions.ts';
import { BOXES, THEMES, type BoxSpec, type ChapterSpec } from './content/index.ts';
import { SAFETY_STOCK, SETUP_COSTS, SKU_SUPPLIER, SOURCING, SUPPLIERS } from './content/procurement.ts';
import { estimateDurationMs, synthesisePlaceholder } from './audio.ts';

const prisma = new PrismaClient();
const storage = objectStorage();

const DEMO_PASSWORD = 'wonderbox-demo';

async function wipe(): Promise<void> {
  // Order matters only where a foreign key has no cascade; Prisma's deleteMany
  // is per-table, so go leaves-first.
  const tables = [
    'auditLog',
    'webhookEvent',
    'approval',
    'contentVersion',
    'progressEvent',
    'parentSummary',
    'supportCase',
    'consentRecord',
    'session',
    'activatedBox',
    'activationCode',
    'shipment',
    'stockReservation',
    'invoice',
    'orderItem',
    'order',
    'subscription',
    'address',
    'childProfile',
    'audioAsset',
    'dialogueChoice',
    'dialogueNode',
    'safetyInstruction',
    'experiment',
    'chapter',
    'learningJourney',
    // Purchase order lines point at inventory items, so they go first.
    'purchaseOrderLine',
    'purchaseOrder',
    'jobRun',
    'kitComponent',
    'inventoryBatch',
    'inventoryItem',
    'supplier',
    'boxTranslation',
    'boxProduct',
    'theme',
    'subscriptionPlan',
  ] as const;

  for (const table of tables) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any)[table].deleteMany({});
  }
  await prisma.user.deleteMany({});
  await prisma.family.deleteMany({});
}

async function seedThemes(): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const theme of THEMES) {
    const row = await prisma.theme.create({
      data: {
        slug: theme.slug,
        name: theme.name,
        blurb: theme.blurb,
        colorToken: theme.colorToken,
        iconKey: theme.iconKey,
        sortOrder: theme.sortOrder,
      },
    });
    ids.set(theme.slug, row.id);
  }
  return ids;
}

/**
 * Suppliers first: inventory items point at them, and the replenishment engine
 * groups purchase orders by supplier.
 */
async function seedSuppliers(): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const supplier of SUPPLIERS) {
    const row = await prisma.supplier.create({
      data: {
        code: supplier.code,
        name: supplier.name,
        email: supplier.email,
        channel: supplier.channel,
        leadTimeDays: supplier.leadTimeDays,
        minOrderValueCents: supplier.minOrderValueCents,
        autoApproveUnderCents: supplier.autoApproveUnderCents,
        notes: supplier.notes,
      },
    });
    ids.set(supplier.code, row.id);
  }
  return ids;
}

async function seedPlans(): Promise<void> {
  await prisma.subscriptionPlan.createMany({
    data: [
      {
        code: 'monthly-explorer',
        name: { nl: 'Maandelijks — Ontdekker', en: 'Monthly — Explorer' },
        description: {
          nl: 'Elke maand een nieuwe doos, afgestemd op de leeftijd van je kind. Elke maand opzegbaar.',
          en: 'A new box every month, matched to your child’s age. Cancel any month.',
        },
        intervalMonths: 1,
        priceCents: 3295,
      },
      {
        code: 'monthly-junior',
        name: { nl: 'Maandelijks — Junior (5–8)', en: 'Monthly — Junior (5–8)' },
        description: {
          nl: 'Dozen voor de jongste ontdekkers, met kortere hoofdstukken en langere pauzes.',
          en: 'Boxes for the youngest explorers, with shorter chapters and longer pauses.',
        },
        intervalMonths: 1,
        priceCents: 2995,
        ageBand: 'AGE_5_6',
      },
      {
        code: 'quarterly-explorer',
        name: { nl: 'Per kwartaal — Ontdekker', en: 'Quarterly — Explorer' },
        description: {
          nl: 'Elke drie maanden een doos, voor wie het rustiger aan wil doen.',
          en: 'A box every three months, for a gentler pace.',
        },
        intervalMonths: 3,
        priceCents: 8900,
      },
    ],
  });
}

interface SeededBox {
  readonly spec: BoxSpec;
  readonly boxProductId: string;
  readonly chapterIds: Map<string, string>;
}

async function seedBox(
  spec: BoxSpec,
  themeIds: Map<string, string>,
  supplierIds: Map<string, string>,
): Promise<SeededBox> {
  const themeId = themeIds.get(spec.themeSlug);
  if (!themeId) throw new Error(`Unknown theme ${spec.themeSlug}`);

  const product = await prisma.boxProduct.create({
    data: {
      sku: spec.sku,
      slug: spec.slug,
      themeId,
      status: 'ACTIVE',
      ageMin: spec.ageMin,
      ageMax: spec.ageMax,
      priceCents: spec.priceCents,
      curriculumIndex: spec.curriculumIndex,
      certificationCostCents: SETUP_COSTS[spec.sku]?.certificationCostCents ?? 0,
      artworkCostCents: SETUP_COSTS[spec.sku]?.artworkCostCents ?? 0,
      amortiseOverUnits: SETUP_COSTS[spec.sku]?.amortiseOverUnits ?? 1000,
      translations: {
        create: (['nl', 'en'] as const).map((locale) => ({
          locale,
          name: spec.translations[locale].name,
          tagline: spec.translations[locale].tagline,
          description: spec.translations[locale].description,
          materialsNote: spec.translations[locale].materialsNote,
          approved: true,
        })),
      },
    },
  });

  // Inventory: one item per distinct SKU across all boxes, with a batch on hand.
  for (const component of spec.components) {
    const sourcing = SOURCING[component.sku];
    const item = await prisma.inventoryItem.upsert({
      where: { sku: component.sku },
      create: {
        sku: component.sku,
        name: component.name,
        kind: component.kind,
        reorderLevel: Math.max(10, Math.round(component.stock * 0.1)),
        supplierId: supplierIds.get(SKU_SUPPLIER[component.sku] ?? '') ?? null,
        supplierSku: sourcing?.supplierSku ?? null,
        safetyStockUnits: SAFETY_STOCK[component.sku] ?? 0,
        costCents: sourcing?.costCents ?? 0,
        moq: sourcing?.moq ?? 1,
        leadTimeDays: sourcing?.leadTimeDays ?? 0,
        weightGrams: sourcing?.weightGrams ?? 0,
      },
      update: {},
    });
    await prisma.inventoryBatch.upsert({
      where: {
        inventoryItemId_batchCode: { inventoryItemId: item.id, batchCode: 'SEED-2026-01' },
      },
      create: {
        inventoryItemId: item.id,
        batchCode: 'SEED-2026-01',
        quantityOnHand: component.stock,
        supplier: 'Seed supplier',
      },
      update: {},
    });
    await prisma.kitComponent.upsert({
      where: {
        boxProductId_inventoryItemId: { boxProductId: product.id, inventoryItemId: item.id },
      },
      create: {
        boxProductId: product.id,
        inventoryItemId: item.id,
        quantity: component.quantity,
        note: component.note ?? undefined,
      },
      update: {},
    });
  }

  // Box-level safety instructions. Experiment-level ones are attached below.
  const safetyIds = new Map<string, string>();
  for (const instruction of spec.safety) {
    const row = await prisma.safetyInstruction.create({
      data: {
        code: instruction.code,
        severity: instruction.severity,
        text: instruction.text,
        requiresAdult: instruction.requiresAdult ?? false,
        boxProductId: product.id,
      },
    });
    safetyIds.set(instruction.code, row.id);
  }

  const journey = await prisma.learningJourney.create({
    data: {
      boxProductId: product.id,
      slug: spec.journey.slug,
      title: spec.journey.title,
      summary: spec.journey.summary,
      estimatedMinutes: spec.journey.estimatedMinutes,
    },
  });

  const chapterIds = new Map<string, string>();
  for (const [index, chapterSpec] of spec.journey.chapters.entries()) {
    const chapterId = await seedChapter(journey.id, chapterSpec, index, safetyIds);
    chapterIds.set(chapterSpec.key, chapterId);
  }

  return { spec, boxProductId: product.id, chapterIds };
}

async function seedChapter(
  journeyId: string,
  spec: ChapterSpec,
  index: number,
  safetyIds: Map<string, string>,
): Promise<string> {
  const chapter = await prisma.chapter.create({
    data: {
      journeyId,
      key: spec.key,
      orderIndex: index,
      title: spec.title,
      intro: spec.intro,
      estimatedMinutes: spec.estimatedMinutes,
      entryNodeKey: spec.entryNodeKey,
    },
  });

  const experimentIds = new Map<string, string>();
  for (const experimentSpec of spec.experiments) {
    const experiment = await prisma.experiment.create({
      data: {
        chapterId: chapter.id,
        key: experimentSpec.key,
        title: experimentSpec.title,
        objective: experimentSpec.objective,
        steps: experimentSpec.steps as unknown as Prisma.InputJsonValue,
        materials: experimentSpec.materials as unknown as Prisma.InputJsonValue,
        durationMinutes: experimentSpec.durationMinutes,
        requiresAdult: experimentSpec.requiresAdult ?? false,
      },
    });
    experimentIds.set(experimentSpec.key, experiment.id);
    // Point the box-level safety rows at the experiment they belong to as well,
    // so the catalogue can list "safety for this experiment".
    for (const code of experimentSpec.safetyCodes ?? []) {
      const safetyId = safetyIds.get(code);
      if (safetyId) {
        await prisma.safetyInstruction.update({
          where: { id: safetyId },
          data: { experimentId: experiment.id },
        });
      }
    }
  }

  // Pass one: every node, without its choices (targets may not exist yet).
  const nodeIds = new Map<string, string>();
  for (const [nodeIndex, nodeSpec] of spec.nodes.entries()) {
    const node = await prisma.dialogueNode.create({
      data: {
        chapterId: chapter.id,
        key: nodeSpec.key,
        kind: nodeSpec.kind,
        orderIndex: nodeIndex,
        text: nodeSpec.text,
        pauseSeconds: nodeSpec.pauseSeconds ?? null,
        isTerminal: nodeSpec.isTerminal ?? false,
        experimentId: nodeSpec.experimentKey
          ? (experimentIds.get(nodeSpec.experimentKey) ?? null)
          : null,
        safetyInstructionId: nodeSpec.safetyCode
          ? (safetyIds.get(nodeSpec.safetyCode) ?? null)
          : null,
      },
    });
    nodeIds.set(nodeSpec.key, node.id);
  }

  // Pass two: the edges.
  for (const nodeSpec of spec.nodes) {
    const nodeId = nodeIds.get(nodeSpec.key)!;
    for (const [choiceIndex, choice] of (nodeSpec.choices ?? []).entries()) {
      if (choice.target && !nodeIds.has(choice.target)) {
        throw new Error(
          `Chapter "${spec.key}" node "${nodeSpec.key}" points at unknown node "${choice.target}"`,
        );
      }
      await prisma.dialogueChoice.create({
        data: {
          nodeId,
          key: choice.key,
          label: choice.label,
          targetNodeId: choice.target ? (nodeIds.get(choice.target) ?? null) : null,
          isRepeat: choice.isRepeat ?? false,
          isSlower: choice.isSlower ?? false,
          orderIndex: choiceIndex,
        },
      });
    }
  }

  // Placeholder narration for both locales.
  for (const nodeSpec of spec.nodes) {
    const nodeId = nodeIds.get(nodeSpec.key)!;
    for (const locale of ['nl', 'en'] as const) {
      const line = nodeSpec.text[locale];
      const bytes = synthesisePlaceholder(line, locale);
      const objectKey = `audio/${spec.key}/${nodeSpec.key}.${locale}.wav`;
      await storage.put(objectKey, bytes, 'audio/wav');
      await prisma.audioAsset.create({
        data: {
          kind: 'NARRATION',
          locale,
          objectKey,
          mimeType: 'audio/wav',
          durationMs: estimateDurationMs(line),
          bytes: bytes.byteLength,
          checksum: createHash('sha256').update(bytes).digest('hex'),
          nodeId,
          chapterId: chapter.id,
          transcript: { [locale]: line },
        },
      });
    }
  }

  return chapter.id;
}

/**
 * Puts every seeded chapter through the real approval workflow: an editor
 * creates the version, a different person approves it, and only then is it
 * published. Nothing is written straight to PUBLISHED — the seed has to obey
 * the same gate as the studio.
 */
async function publishChapters(
  boxes: readonly SeededBox[],
  editorId: string,
  approverId: string,
): Promise<void> {
  const { createDraftVersion, submitForReview, decideOnVersion, publishVersion } = await import(
    '../src/server/content.ts'
  );

  for (const box of boxes) {
    for (const [key, chapterId] of box.chapterIds) {
      const chapter = await prisma.chapter.findUniqueOrThrow({
        where: { id: chapterId },
        include: { nodes: { include: { choices: true } }, experiments: true },
      });
      const version = await createDraftVersion({
        entityType: 'Chapter',
        entityId: chapterId,
        snapshot: chapter as unknown,
        createdById: editorId,
        notes: `Seeded chapter "${key}"`,
      });
      await submitForReview(version.id, editorId);
      await decideOnVersion({
        versionId: version.id,
        reviewerId: approverId,
        decision: 'APPROVED',
        comment: 'Reviewed against the physical kit and the safety notes.',
      });
      await publishVersion(version.id, approverId);
    }
  }
}

async function seedStaff() {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const make = (email: string, displayName: string, roles: Prisma.UserCreateInput['roles']) =>
    prisma.user.create({ data: { email, displayName, passwordHash, roles, emailVerified: true } });

  const admin = await make('admin@wonderbox.test', 'Admin', ['ADMIN']);
  const editor = await make('editor@wonderbox.test', 'Nour — content editor', ['CONTENT_EDITOR']);
  const approver = await make('approver@wonderbox.test', 'Bas — content approver', [
    'CONTENT_APPROVER',
  ]);
  const ops = await make('ops@wonderbox.test', 'Iris — fulfilment', ['OPS']);
  const support = await make('support@wonderbox.test', 'Sam — support', ['SUPPORT']);
  return { admin, editor, approver, ops, support };
}

async function seedDemoFamily(boxes: readonly SeededBox[]) {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const family = await prisma.family.create({
    data: { name: 'Familie De Vries', locale: 'nl' },
  });

  const parent = await prisma.user.create({
    data: {
      email: 'ouder@wonderbox.test',
      displayName: 'Maarten de Vries',
      passwordHash,
      roles: ['PARENT'],
      familyId: family.id,
      emailVerified: true,
    },
  });
  const secondParent = await prisma.user.create({
    data: {
      email: 'ouder2@wonderbox.test',
      displayName: 'Feride de Vries',
      passwordHash,
      roles: ['PARENT'],
      familyId: family.id,
      emailVerified: true,
    },
  });

  const noor = await prisma.childProfile.create({
    data: {
      familyId: family.id,
      displayName: 'Noor',
      birthYear: new Date().getFullYear() - 8,
      ageBand: 'AGE_7_8',
      interests: ['space', 'nature'],
      accessibility: { narrationSpeed: 'normal', extraPauseSeconds: 0 },
    },
  });
  await prisma.childProfile.create({
    data: {
      familyId: family.id,
      displayName: 'Sem',
      birthYear: new Date().getFullYear() - 11,
      ageBand: 'AGE_11_12',
      interests: ['practical-skills'],
      accessibility: { narrationSpeed: 'slow', extraPauseSeconds: 3 },
    },
  });

  const address = await prisma.address.create({
    data: {
      familyId: family.id,
      label: 'home',
      recipient: 'Fam. De Vries',
      line1: 'Zonnebloemstraat 14',
      postalCode: '3572 KJ',
      city: 'Utrecht',
      country: 'NL',
      phone: '+31 6 12345678',
      isDefaultShipping: true,
    },
  });

  for (const type of ['TERMS', 'PRIVACY'] as const) {
    await prisma.consentRecord.create({
      data: {
        familyId: family.id,
        type,
        granted: true,
        policyVersion: '2026-01',
        grantedByUserId: parent.id,
      },
    });
  }

  const plan = await prisma.subscriptionPlan.findUniqueOrThrow({
    where: { code: 'monthly-explorer' },
  });
  const now = new Date();
  const periodStart = addMonths(now, -1);
  const subscription = await prisma.subscription.create({
    data: {
      familyId: family.id,
      planId: plan.id,
      status: 'ACTIVE',
      startedAt: periodStart,
      currentPeriodStart: periodStart,
      currentPeriodEnd: addMonths(periodStart, 1),
      providerRef: `sub_seed_${family.id}`,
      nextBoxProductId: boxes[1]?.boxProductId ?? null,
    },
  });

  return { family, parent, secondParent, noor, address, subscription };
}

async function main(): Promise<void> {
  console.log('Wiping existing data…');
  await wipe();

  console.log('Seeding themes, plans and suppliers…');
  const themeIds = await seedThemes();
  await seedPlans();
  const supplierIds = await seedSuppliers();

  console.log('Seeding boxes, journeys and placeholder audio…');
  const boxes: SeededBox[] = [];
  for (const spec of BOXES) {
    boxes.push(await seedBox(spec, themeIds, supplierIds));
    console.log(`  · ${spec.sku}`);
  }

  console.log('Seeding staff accounts…');
  const staff = await seedStaff();

  console.log('Running every chapter through the approval workflow…');
  await publishChapters(boxes, staff.editor.id, staff.approver.id);

  console.log('Seeding the demo family…');
  const demo = await seedDemoFamily(boxes);

  console.log('Minting activation codes…');
  const printedCodes = new Map<string, string>();
  for (const box of boxes) {
    for (let i = 0; i < 25; i += 1) {
      const code = generateActivationCode();
      await prisma.activationCode.create({
        data: {
          codeHash: hashActivationCode(code),
          lastFour: code.slice(-4),
          boxProductId: box.boxProductId,
          state: 'UNASSIGNED',
        },
      });
      if (i === 0) printedCodes.set(box.spec.sku, code);
    }
  }

  console.log('Placing a paid demo order…');
  const { placeOrder, payOrderWithMock, createShipmentForOrder } = await import(
    '../src/server/orders.ts'
  );
  const spaceBox = boxes[0]!;
  const placed = await placeOrder({
    familyId: demo.family.id,
    lines: [{ boxProductId: spaceBox.boxProductId, quantity: 1 }],
    shippingAddressId: demo.address.id,
    subscriptionId: demo.subscription.id,
    idempotencyKey: `seed:${demo.family.id}:space`,
    actorUserId: demo.parent.id,
  });
  await payOrderWithMock(placed.order.id);
  await createShipmentForOrder(placed.order.id, null);

  // Paying the order bound one pooled code to this family — that is the code
  // that would be printed inside the parcel. We do not know its plaintext (only
  // its hash is stored), so rewrite that row with one we can show on screen.
  // In production the print run knows the code and the database never does.
  const parcelCode = generateActivationCode();
  const assigned = await prisma.activationCode.findFirst({
    where: { orderId: placed.order.id, state: 'ASSIGNED' },
  });
  if (assigned) {
    await prisma.activationCode.update({
      where: { id: assigned.id },
      data: { codeHash: hashActivationCode(parcelCode), lastFour: parcelCode.slice(-4) },
    });
  }

  console.log('Activating a second box and recording some listening…');
  const { activateBox } = await import('../src/server/activation.ts');

  // A second box, already activated, so the demo has listening history to show
  // on the parent summary without anyone having to press play first.
  const historyCode = generateActivationCode();
  await prisma.activationCode.create({
    data: {
      codeHash: hashActivationCode(historyCode),
      lastFour: historyCode.slice(-4),
      boxProductId: spaceBox.boxProductId,
      familyId: demo.family.id,
      state: 'ASSIGNED',
      assignedAt: new Date(),
    },
  });
  const activated = await activateBox({
    code: historyCode,
    familyId: demo.family.id,
    userId: demo.parent.id,
    locale: 'nl',
  });
  const activatedBoxId = activated.ok ? activated.activatedBox.id : null;

  if (activatedBoxId) {
    const firstChapterId = spaceBox.chapterIds.get('launch')!;
    const nodes = await prisma.dialogueNode.findMany({
      where: { chapterId: firstChapterId },
      orderBy: { orderIndex: 'asc' },
      take: 4,
    });
    let offset = 0;
    await prisma.progressEvent.createMany({
      data: [
        {
          clientEventId: `seed-start-${activatedBoxId}`,
          familyId: demo.family.id,
          activatedBoxId,
          childProfileId: demo.noor.id,
          chapterId: firstChapterId,
          nodeId: nodes[0]?.id ?? null,
          type: 'CHAPTER_STARTED',
          occurredAt: new Date(Date.now() - 86_400_000),
        },
        ...nodes.map((node) => {
          offset += 1;
          return {
            clientEventId: `seed-play-${node.id}`,
            familyId: demo.family.id,
            activatedBoxId,
            childProfileId: demo.noor.id,
            chapterId: firstChapterId,
            nodeId: node.id,
            type: 'NODE_PLAYED' as const,
            listenedMs: 42_000,
            occurredAt: new Date(Date.now() - 86_400_000 + offset * 60_000),
          };
        }),
      ],
    });
  }

  console.log('Filing a demo support case…');
  const { openCase } = await import('../src/server/support.ts');
  await openCase({
    familyId: demo.family.id,
    reporterUserId: demo.parent.id,
    kind: 'DELIVERY',
    subject: 'Doos kwam met een gedeukte hoek aan',
    body: 'De inhoud is heel, maar de doos zelf had een flinke deuk. Hoeft niet vervangen te worden.',
  });

  const codeLines = [...printedCodes.entries()]
    .map(([sku, code]) => `    ${sku.padEnd(14)} ${code}   (unassigned — mint pool)`)
    .join('\n');

  console.log(`
────────────────────────────────────────────────────────────────────────
  WonderBox seed complete.

  Sign in at http://localhost:3000/login — password for every account is
  "${DEMO_PASSWORD}".

    ouder@wonderbox.test      parent (Familie De Vries, 2 children)
    ouder2@wonderbox.test     second parent in the same family
    editor@wonderbox.test     content editor  — studio, no access to families
    approver@wonderbox.test   content approver — can publish
    ops@wonderbox.test        fulfilment      — stock, labels, codes
    support@wonderbox.test    support         — cases, no content rights
    admin@wonderbox.test      admin

  Activate this code as the parent to claim a second Space Explorer:

    ${parcelCode}

  Unassigned pool samples (they belong to no family yet, so activating one
  is refused — that is the ownership check doing its job):

${codeLines}
────────────────────────────────────────────────────────────────────────
`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
