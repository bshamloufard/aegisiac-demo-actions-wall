import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const plan = JSON.parse(await readFile('aegis/plan.redacted.json', 'utf8'));
const canonical = JSON.stringify(sortKeys(plan));
const planHash = createHash('sha256').update(canonical).digest('hex');

const changes = plan.resource_changes ?? [];
const findings = [];

for (const change of changes) {
  const actions = change.change?.actions ?? [];
  const body = JSON.stringify(change.change?.after ?? {});

  if (change.type === 'aws_db_instance' && actions.includes('delete')) {
    findings.push({
      severity: 'critical',
      rule: 'AEGIS-STATEFUL-001',
      resource: change.address,
      message: 'Stateful database replacement requires security approval.'
    });
  }

  if (change.type === 'aws_security_group' && body.includes('0.0.0.0/0')) {
    findings.push({
      severity: 'high',
      rule: 'AEGIS-NET-443',
      resource: change.address,
      message: 'Public ingress is introduced and must be rate-limited or approved.'
    });
  }
}

const report = {
  planHash,
  status: 'action_required',
  tier: findings.some((f) => f.severity === 'critical') ? 'high' : 'normal',
  costDeltaMonthlyUsd: 574,
  changes: changes.length,
  findings,
  approval: {
    required: true,
    check: 'aegis/plan-review',
    reason: 'Critical stateful replacement and public ingress.'
  }
};

await writeFile('aegis/report.json', `${JSON.stringify(report, null, 2)}\n`);
await writeFile('site/report.json', `${JSON.stringify(report, null, 2)}\n`);

const rows = findings
  .map((finding) => `| ${finding.severity} | ${finding.rule} | \`${finding.resource}\` | ${finding.message} |`)
  .join('\n');

const summary = `# AegisIaC plan-review wall

**Conclusion:** action required

| Signal | Value |
| --- | --- |
| Plan hash | \`${planHash.slice(0, 16)}\` |
| Risk tier | ${report.tier} |
| Resources changed | ${report.changes} |
| Monthly cost delta | +$${report.costDeltaMonthlyUsd} |
| Required check | \`${report.approval.check}\` |

## Findings

| Severity | Rule | Resource | Message |
| --- | --- | --- | --- |
${rows}

## Gate behavior

The demo intentionally blocks the gate until a security approver reviews the stateful replacement and public ingress.
`;

await writeFile(process.env.GITHUB_STEP_SUMMARY, summary, { flag: 'a' });

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortKeys(value[key])]));
}
