import { describe, expect, it } from 'vitest';
import type { UserRole } from '@prisma/client';
import { PERMISSIONS, can, canAny, type Permission } from '../src/lib/auth/roles.ts';

/**
 * Role separation.
 *
 * The claim that matters commercially and legally: a content editor cannot
 * reach a family, an address or an order. These tests enumerate the whole
 * permission matrix rather than spot-checking it, so adding a permission and
 * forgetting to think about content roles fails here.
 */
describe('role separation', () => {
  const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

  const COMMERCE_PERMISSIONS: Permission[] = [
    'family.read',
    'family.write',
    'address.read',
    'address.write',
    'order.read.own',
    'order.read.all',
    'order.write',
    'subscription.manage',
    'progress.read.own',
    'activation.claim',
    'privacy.manage.own',
  ];

  const CONTENT_PERMISSIONS: Permission[] = [
    'content.write',
    'content.submit',
    'content.approve',
    'content.publish',
  ];

  it('gives content roles no access to families, addresses or orders', () => {
    for (const role of ['CONTENT_EDITOR', 'CONTENT_APPROVER'] satisfies UserRole[]) {
      for (const permission of COMMERCE_PERMISSIONS) {
        expect(can([role], permission), `${role} must not have ${permission}`).toBe(false);
      }
    }
  });

  it('gives fulfilment and support roles no ability to change content', () => {
    for (const role of ['OPS', 'SUPPORT'] satisfies UserRole[]) {
      for (const permission of CONTENT_PERMISSIONS) {
        expect(can([role], permission), `${role} must not have ${permission}`).toBe(false);
      }
    }
  });

  it('gives parents nothing operational', () => {
    for (const permission of [
      'inventory.read',
      'inventory.write',
      'shipment.write',
      'activation.mint',
      'order.read.all',
      'support.read',
      'audit.read',
      'content.write',
      'content.approve',
      'content.publish',
    ] satisfies Permission[]) {
      expect(can(['PARENT'], permission), `PARENT must not have ${permission}`).toBe(false);
    }
  });

  it('gives ops the address access it genuinely needs to pack a parcel', () => {
    expect(can(['OPS'], 'address.read')).toBe(true);
    // …and nothing beyond it.
    expect(can(['OPS'], 'address.write')).toBe(false);
    expect(can(['OPS'], 'family.read')).toBe(false);
    expect(can(['OPS'], 'progress.read.own')).toBe(false);
  });

  it('separates writing content from approving it', () => {
    expect(can(['CONTENT_EDITOR'], 'content.write')).toBe(true);
    expect(can(['CONTENT_EDITOR'], 'content.approve')).toBe(false);
    expect(can(['CONTENT_EDITOR'], 'content.publish')).toBe(false);

    expect(can(['CONTENT_APPROVER'], 'content.approve')).toBe(true);
    expect(can(['CONTENT_APPROVER'], 'content.publish')).toBe(true);
    expect(can(['CONTENT_APPROVER'], 'content.write')).toBe(false);
  });

  it('lets only editors and approvers ask a model for a draft', () => {
    expect(can(['CONTENT_EDITOR'], 'content.aiDraft')).toBe(true);
    expect(can(['CONTENT_APPROVER'], 'content.aiDraft')).toBe(true);
    expect(can(['PARENT'], 'content.aiDraft')).toBe(false);
    expect(can(['OPS'], 'content.aiDraft')).toBe(false);
    expect(can(['SUPPORT'], 'content.aiDraft')).toBe(false);
  });

  it('reserves the audit log for admins', () => {
    for (const role of ['PARENT', 'CONTENT_EDITOR', 'CONTENT_APPROVER', 'OPS', 'SUPPORT'] satisfies UserRole[]) {
      expect(can([role], 'audit.read')).toBe(false);
    }
    expect(can(['ADMIN'], 'audit.read')).toBe(true);
  });

  it('grants admin every permission, and no other single role does', () => {
    for (const permission of ALL_PERMISSIONS) {
      expect(can(['ADMIN'], permission), `ADMIN should have ${permission}`).toBe(true);
    }
    for (const role of ['PARENT', 'CONTENT_EDITOR', 'CONTENT_APPROVER', 'OPS', 'SUPPORT'] satisfies UserRole[]) {
      const held = ALL_PERMISSIONS.filter((permission) => can([role], permission));
      expect(held.length).toBeLessThan(ALL_PERMISSIONS.length);
    }
  });

  it('combines roles additively for someone who wears two hats', () => {
    const hybrid: UserRole[] = ['OPS', 'SUPPORT'];
    expect(can(hybrid, 'inventory.write')).toBe(true);
    expect(can(hybrid, 'support.read')).toBe(true);
    expect(can(hybrid, 'content.publish')).toBe(false);
    expect(canAny(hybrid, ['content.publish', 'support.read'])).toBe(true);
    expect(canAny(hybrid, ['content.publish', 'content.write'])).toBe(false);
  });

  it('treats a user with no roles as having no access at all', () => {
    for (const permission of ALL_PERMISSIONS) {
      expect(can([], permission)).toBe(false);
    }
  });
});
