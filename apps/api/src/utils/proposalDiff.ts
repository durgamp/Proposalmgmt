// GxP-compliant change detection for audit logs
export function detectChanges(
  oldObj: Record<string, unknown> | null,
  newObj: Record<string, unknown>,
): string[] {
  if (!oldObj) return ['Record created'];

  const changes: string[] = [];
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  const skipKeys = new Set(['updatedAt', 'updatedBy', 'lastModified']);

  for (const key of allKeys) {
    if (skipKeys.has(key)) continue;

    const oldVal = oldObj[key];
    const newVal = newObj[key];

    if (JSON.stringify(oldVal) === JSON.stringify(newVal)) continue;

    // Human-readable change descriptions
    if (key === 'currentStage') {
      changes.push(`Stage changed: ${oldVal} → ${newVal}`);
    } else if (key === 'completionPercentage') {
      changes.push(`Completion: ${oldVal}% → ${newVal}%`);
    } else if (key === 'status') {
      changes.push(`Status: "${oldVal}" → "${newVal}"`);
    } else if (key === 'pmReviewComplete') {
      changes.push(`PM Review: ${newVal ? 'completed' : 'reset'}`);
    } else if (key === 'managementReviewComplete') {
      changes.push(`Management Review: ${newVal ? 'completed' : 'reset'}`);
    } else if (key === 'isComplete') {
      changes.push(`Section ${newVal ? 'completed' : 'reopened'}`);
    } else if (key === 'isLocked') {
      changes.push(`Section ${newVal ? 'locked' : 'unlocked'}`);
    } else if (key === 'content') {
      changes.push('Section content updated');
    } else {
      changes.push(`${key} updated`);
    }
  }

  return changes.length > 0 ? changes : ['Minor update'];
}
