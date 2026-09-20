#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function assertMacroArtifacts(outputDirectory, expectedSteps) {
  const read = name => JSON.parse(fs.readFileSync(path.join(outputDirectory, name), 'utf8'));
  const plan = read('execution-plan.json');
  assert.equal(plan.effective.journey, 'macro', 'The effective journey must be macro');
  assert.equal(plan.effective.crawlerExecuted, false, 'Macro replay must not run a crawler');
  assert.equal(plan.effective.agentExecuted, false, 'Macro replay must not run Agent expansion');
  const scenario = read('scenario-result.json');
  assert.equal(scenario.status, 'completed', 'Macro replay did not complete');
  assert.equal(scenario.ok, true, 'Macro replay failed');
  assert.ok(Number.isSafeInteger(scenario.totalSteps) && scenario.totalSteps > 0, 'Macro must execute steps');
  assert.equal(scenario.completedSteps, scenario.totalSteps, 'Macro steps are incomplete');
  if (expectedSteps !== undefined) assert.equal(scenario.totalSteps, expectedSteps, 'Unexpected macro step count');
  assert.deepEqual(scenario.pending, [], 'Macro has pending steps');
  assert.deepEqual(scenario.blockedSteps, [], 'Macro has blocked steps');
  assert.equal(scenario.stepResults.length, scenario.totalSteps, 'Macro step evidence is incomplete');
  assert.ok(scenario.stepResults.every(step => step.ok === true), 'Macro step evidence contains failures');
}

if (require.main === module) {
  const expected = process.argv[3] === undefined ? undefined : Number(process.argv[3]);
  assertMacroArtifacts(path.resolve(process.argv[2] || '.ptk/artifacts'), expected);
  process.stdout.write('PTK Action macro replay assertions passed.\n');
}

module.exports = { assertMacroArtifacts };
