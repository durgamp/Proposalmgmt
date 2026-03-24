import { detectChanges } from '../utils/proposalDiff';

describe('detectChanges', () => {
  test('returns "Record created" when oldObj is null', () => {
    const changes = detectChanges(null, { name: 'New Proposal' });
    expect(changes).toEqual(['Record created']);
  });

  test('returns "Minor update" when objects are identical', () => {
    const obj = { name: 'Proposal A', client: 'Acme' };
    expect(detectChanges(obj, obj)).toEqual(['Minor update']);
  });

  test('ignores updatedAt, updatedBy, lastModified fields', () => {
    const old = { name: 'A', updatedAt: '2024-01-01', updatedBy: 'alice@test.com' };
    const next = { name: 'A', updatedAt: '2025-01-01', updatedBy: 'bob@test.com' };
    expect(detectChanges(old, next)).toEqual(['Minor update']);
  });

  test('generates human-readable stage change', () => {
    const changes = detectChanges({ currentStage: 1 }, { currentStage: 2 });
    expect(changes).toContain('Stage changed: 1 → 2');
  });

  test('generates human-readable completion change', () => {
    const changes = detectChanges({ completionPercentage: 40 }, { completionPercentage: 75 });
    expect(changes).toContain('Completion: 40% → 75%');
  });

  test('generates human-readable status change', () => {
    const changes = detectChanges({ status: 'Draft' }, { status: 'Sent' });
    expect(changes).toContain('Status: "Draft" → "Sent"');
  });

  test('generates human-readable PM Review completion', () => {
    const changes = detectChanges({ pmReviewComplete: false }, { pmReviewComplete: true });
    expect(changes).toContain('PM Review: completed');
  });

  test('generates human-readable PM Review reset', () => {
    const changes = detectChanges({ pmReviewComplete: true }, { pmReviewComplete: false });
    expect(changes).toContain('PM Review: reset');
  });

  test('generates human-readable section lock', () => {
    const changes = detectChanges({ isLocked: false }, { isLocked: true });
    expect(changes).toContain('Section locked');
  });

  test('generates human-readable section completion', () => {
    const changes = detectChanges({ isComplete: false }, { isComplete: true });
    expect(changes).toContain('Section completed');
  });

  test('generates generic change for unknown fields', () => {
    const changes = detectChanges({ customField: 'old' }, { customField: 'new' });
    expect(changes).toContain('customField updated');
  });

  test('handles multiple simultaneous changes', () => {
    const changes = detectChanges(
      { currentStage: 1, status: 'Draft' },
      { currentStage: 2, status: 'In Review' },
    );
    expect(changes).toHaveLength(2);
    expect(changes).toContain('Stage changed: 1 → 2');
    expect(changes).toContain('Status: "Draft" → "In Review"');
  });

  test('handles new keys added to object', () => {
    const changes = detectChanges({ name: 'A' }, { name: 'A', client: 'Acme' });
    expect(changes).toContain('client updated');
  });

  test('handles keys removed from object', () => {
    const changes = detectChanges({ name: 'A', client: 'Acme' }, { name: 'A' });
    expect(changes).toContain('client updated');
  });

  test('deep-compares arrays correctly (no false positives)', () => {
    const old = { assignedStakeholders: ['alice@test.com', 'bob@test.com'] };
    const next = { assignedStakeholders: ['alice@test.com', 'bob@test.com'] };
    expect(detectChanges(old, next)).toEqual(['Minor update']);
  });

  test('detects array changes', () => {
    const old = { assignedStakeholders: ['alice@test.com'] };
    const next = { assignedStakeholders: ['alice@test.com', 'bob@test.com'] };
    const changes = detectChanges(old, next);
    expect(changes).toContain('assignedStakeholders updated');
  });
});
