'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { assertMacroArtifacts } = require('./assert-macro.cjs');

test('macro smoke rejects partial replay and unexpected exploration despite completed status', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ptk-macro-evidence-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const plan = { effective: { journey: 'macro', crawlerExecuted: false, agentExecuted: false } };
  const scenario = {
    status: 'completed', ok: true, totalSteps: 2, completedSteps: 2,
    pending: [], blockedSteps: [], stepResults: [{ ok: true }, { ok: true }]
  };
  const write = (p = plan, s = scenario) => {
    fs.writeFileSync(path.join(directory, 'execution-plan.json'), JSON.stringify(p));
    fs.writeFileSync(path.join(directory, 'scenario-result.json'), JSON.stringify(s));
  };
  write();
  assert.doesNotThrow(() => assertMacroArtifacts(directory, 2));
  for (const effective of [
    { journey: 'crawler' }, { crawlerExecuted: true }, { agentExecuted: true }
  ]) {
    write({ effective: { ...plan.effective, ...effective } });
    assert.throws(() => assertMacroArtifacts(directory, 2));
  }
  for (const change of [
    { status: 'failed' }, { ok: false }, { completedSteps: 1 }, { totalSteps: 0 },
    { pending: ['last-step'] }, { blockedSteps: [{ stepId: 'last-step' }] },
    { stepResults: [{ ok: true }] }, { stepResults: [{ ok: true }, { ok: false }] }
  ]) {
    write(plan, { ...scenario, ...change });
    assert.throws(() => assertMacroArtifacts(directory, 2));
  }
  write();
  assert.throws(() => assertMacroArtifacts(directory, 3), /step count/);
});
