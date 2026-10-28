const { test } = require('node:test');
const assert = require('node:assert/strict');
const FocusTimer = require('./timer.js');
test('default, elapsed wall time, pause, resume and expiry', () => {
  let now = 0; const timer = new FocusTimer(() => now);
  assert.equal(timer.display, '30:00'); timer.start(); timer.start();
  now = 75000; assert.equal(timer.display, '28:45');
  timer.pause(); now += 300000; assert.equal(timer.display, '28:45');
  timer.start(); now += 1725000; assert.equal(timer.display, '00:00');
  assert.equal(timer.running, false); assert.equal(timer.fraction, 0);
});
test('adjustment preserves elapsed time and running/paused state', () => {
  let now = 0; const timer = new FocusTimer(() => now);
  timer.start(); now = 600000; timer.adjust(5);
  assert.equal(timer.display, '25:00'); assert.equal(timer.total, 2100000);
  assert.equal(timer.running, true); assert.equal(timer.fraction, 25 / 35);
  timer.pause(); timer.adjust(15); assert.equal(timer.display, '40:00');
  assert.equal(timer.running, false); timer.adjust(-100); assert.equal(timer.display, '00:00');
  timer.adjust(5); assert.equal(timer.display, '05:00'); timer.reset();
  assert.equal(timer.display, '30:00'); assert.equal(timer.fraction, 1);
});
test('strict MM:SS bounds and subsecond rounding', () => {
  let now = 0; const timer = new FocusTimer(() => now);
  timer.adjust(1000); assert.equal(timer.display, '99:59');
  timer.reset(); timer.start(); now = 1; assert.equal(timer.display, '30:00');
  now = 1000; assert.equal(timer.display, '29:59');
  now = 9999999; assert.equal(timer.display, '00:00');
});
