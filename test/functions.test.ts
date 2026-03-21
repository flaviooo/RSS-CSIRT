import { extractSeverity, extractCveIds, formatAlertMessage } from '../src/services/rssService.js';

const RUN_TEST = process.env.TEST;

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  if (RUN_TEST && !name.toLowerCase().includes(RUN_TEST.toLowerCase())) return;
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`❌ ${name}: ${e}`);
    failed++;
  }
}

// Test extractSeverity
console.log('\n=== extractSeverity ===\n');

test('Critical - english', () => {
  const result = extractSeverity('Critical vulnerability', 'CVE found');
  console.log(`  Input: "Critical vulnerability", "CVE found"`);
  console.log(`  Output: "${result}"`);
  if (result !== 'critical') throw new Error(`Expected "critical", got "${result}"`);
});

test('High - italian', () => {
  const result = extractSeverity('Alta criticità', 'severe');
  console.log(`  Input: "Alta criticità", "severe"`);
  console.log(`  Output: "${result}"`);
  if (result !== 'high') throw new Error(`Expected "high", got "${result}"`);
});

test('Medium', () => {
  const result = extractSeverity('Medium risk', 'medium');
  console.log(`  Input: "Medium risk", "medium"`);
  console.log(`  Output: "${result}"`);
  if (result !== 'medium') throw new Error(`Expected "medium", got "${result}"`);
});

test('Low - italian', () => {
  const result = extractSeverity('Low priority', 'bassa');
  console.log(`  Input: "Low priority", "bassa"`);
  console.log(`  Output: "${result}"`);
  if (result !== 'low') throw new Error(`Expected "low", got "${result}"`);
});

test('Unknown - no match', () => {
  const result = extractSeverity('Nothing special', '');
  console.log(`  Input: "Nothing special", ""`);
  console.log(`  Output: "${result}"`);
  if (result !== 'unknown') throw new Error(`Expected "unknown", got "${result}"`);
});

// Test extractCveIds
console.log('\n=== extractCveIds ===\n');

test('Multiple CVEs', () => {
  const result = extractCveIds('CVE-2024-1234 and CVE-2023-5678');
  console.log(`  Input: "CVE-2024-1234 and CVE-2023-5678"`);
  console.log(`  Output: [${result.join(', ')}]`);
  if (result.length !== 2) throw new Error(`Expected 2 CVEs, got ${result.length}`);
});

test('No CVEs', () => {
  const result = extractCveIds('no cves here');
  console.log(`  Input: "no cves here"`);
  console.log(`  Output: [${result.join(', ')}]`);
  if (result.length !== 0) throw new Error(`Expected 0 CVEs, got ${result.length}`);
});

test('Empty string', () => {
  const result = extractCveIds('');
  console.log(`  Input: ""`);
  console.log(`  Output: [${result.join(', ')}]`);
  if (result.length !== 0) throw new Error(`Expected 0 CVEs, got ${result.length}`);
});

// Test formatAlertMessage
console.log('\n=== formatAlertMessage ===\n');

test('Format with severity and CVE', () => {
  const alert = {
    id: 'test123',
    title: 'Test Alert',
    link: 'https://example.com',
    pubDate: new Date().toISOString(),
    description: 'Test description',
    severity: 'high' as const,
    cveIds: ['CVE-2024-1234'],
  };
  const msg = formatAlertMessage(alert);
  console.log(`  Title: "${alert.title}"`);
  console.log(`  Severity: "${alert.severity}"`);
  console.log(`  CVEs: [${alert.cveIds.join(', ')}]`);
  console.log(`  Message preview:\n${msg.substring(0, 100)}...`);
  if (!msg.includes('HIGH')) throw new Error('Missing severity');
  if (!msg.includes('Test Alert')) throw new Error('Missing title');
  if (!msg.includes('CVE-2024-1234')) throw new Error('Missing CVE');
});

console.log(`\n${'='.repeat(40)}`);
console.log(`Passed: ${passed}  |  Failed: ${failed}`);
console.log(failed === 0 ? '\n🎉 Tutti i test passati!' : '\n💥 Qualche test è fallito!');
