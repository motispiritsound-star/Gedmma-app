import { describe, expect, it } from 'vitest';
import {
  FORBIDDEN_CAPABILITIES,
  can,
  childActor,
  decide,
  guardianActor,
  permissions,
  transparencyReport,
  type Actor,
} from '../src/index.js';

const guardian = guardianActor('u_parent', 'fam_1');
const teen = childActor('u_teen', 'fam_1', '14-17');
const youngChild = childActor('u_kid', 'fam_1', '8-10');
const supportAdmin: Actor = {
  userId: 'u_admin',
  familyId: null,
  role: null,
  platformRole: 'support_admin',
  ageBand: 'adult',
};
const outsider = guardianActor('u_other', 'fam_2');

describe('forbidden capabilities', () => {
  it('are denied for every actor, including support admins', () => {
    const actors = [guardian, teen, youngChild, supportAdmin, outsider];
    for (const capability of FORBIDDEN_CAPABILITIES) {
      for (const actor of actors) {
        const decision = decide(actor, capability);
        expect(decision.allowed, `${capability} for ${actor.userId}`).toBe(false);
        expect(decision.reasonKey).toBe('authz.capability_not_offered');
      }
    }
  });

  it('never appear in the permission list the product does grant', () => {
    for (const capability of FORBIDDEN_CAPABILITIES) {
      expect(permissions as readonly string[]).not.toContain(capability);
    }
  });

  it('covers message content, browsing, keystrokes and precise location', () => {
    expect(FORBIDDEN_CAPABILITIES).toContain('message.read');
    expect(FORBIDDEN_CAPABILITIES).toContain('browsing.content.inspect');
    expect(FORBIDDEN_CAPABILITIES).toContain('keystroke.capture');
    expect(FORBIDDEN_CAPABILITIES).toContain('location.precise.track');
    expect(FORBIDDEN_CAPABILITIES).toContain('remote.device.control');
    expect(FORBIDDEN_CAPABILITIES).toContain('child.data.sell');
  });
});

describe('membership permissions', () => {
  it('lets a guardian run the family, but not reach into another family', () => {
    expect(can(guardian, 'family.invite_guardian', { familyId: 'fam_1' })).toBe(true);
    expect(can(guardian, 'agreement.activate', { familyId: 'fam_1' })).toBe(true);
    expect(can(guardian, 'agreement.activate', { familyId: 'fam_2' })).toBe(false);
  });

  it('lets children read every rule and propose changes', () => {
    expect(can(youngChild, 'agreement.read')).toBe(true);
    expect(can(youngChild, 'agreement.propose_change')).toBe(true);
    expect(can(youngChild, 'measurement.read')).toBe(true);
    expect(can(youngChild, 'consent.history.read')).toBe(true);
  });

  it('does not let a child activate an agreement or link a sibling', () => {
    expect(can(teen, 'agreement.activate')).toBe(false);
    expect(can(teen, 'child.link')).toBe(false);
    expect(can(teen, 'family.remove_member')).toBe(false);
  });

  it('gives 14-17 year olds co-authoring rights that younger children do not have', () => {
    expect(can(teen, 'agreement.update')).toBe(true);
    expect(can(youngChild, 'agreement.update')).toBe(false);
  });

  it('keeps a child check-in to the child themselves', () => {
    expect(can(teen, 'checkin.read_self', { subjectUserId: 'u_teen' })).toBe(true);
    expect(can(teen, 'checkin.read_self', { subjectUserId: 'u_kid' })).toBe(false);
  });

  it('lets a young person give and withdraw their own assent, but nobody else\'s', () => {
    expect(can(teen, 'consent.grant', { subjectUserId: 'u_teen' })).toBe(true);
    expect(can(teen, 'consent.grant', { subjectUserId: 'u_kid' })).toBe(false);
    expect(can(teen, 'consent.withdraw', { subjectUserId: 'u_teen' })).toBe(true);
    expect(can(teen, 'export.request', { subjectUserId: 'u_teen' })).toBe(true);
    expect(can(teen, 'consent.withdraw', { subjectUserId: 'u_kid' })).toBe(false);
  });
});

describe('admin restrictions', () => {
  it('lets a support admin read metrics only', () => {
    expect(can(supportAdmin, 'admin.metrics.read')).toBe(true);
    expect(can(supportAdmin, 'admin.support_ticket.read')).toBe(true);
  });

  it('never lets a support admin read family content', () => {
    const familyActions = [
      'agreement.read',
      'checkin.read_self',
      'usage.summary.read',
      'focus.session.read',
      'consent.history.read',
      'family.read',
    ];
    for (const action of familyActions) {
      expect(can(supportAdmin, action), action).toBe(false);
    }
  });

  it('does not let a family member reach the back office', () => {
    expect(can(guardian, 'admin.metrics.read')).toBe(false);
    expect(can(teen, 'admin.metrics.read')).toBe(false);
  });
});

describe('transparency report', () => {
  it('shows every member what is allowed and what is never offered', () => {
    const report = transparencyReport(youngChild);
    expect(report.allowed).toContain('agreement.read');
    expect(report.allowed).not.toContain('agreement.activate');
    expect(report.neverOffered).toEqual(FORBIDDEN_CAPABILITIES);
  });
});
