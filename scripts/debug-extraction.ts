import { APERAM_B155908_TEXT } from '../test-data/aperam-b155908-text';

// Debug: Find all lines with key patterns
const lines = APERAM_B155908_TEXT.split('\n');

console.log('=== Debug Line Analysis ===\n');

// Find all "derived from affiliated" lines
console.log('Lines with "derived from affiliated":');
lines.forEach((line, i) => {
  if (line.toLowerCase().includes('derived from affiliated')) {
    console.log(`  Line ${i}: ${line.trim()}`);
  }
});

console.log('\nLines with "Income from other investments":');
lines.forEach((line, i) => {
  if (line.toLowerCase().includes('income from other investments')) {
    console.log(`  Line ${i}: ${line.trim()}`);
  }
});

console.log('\nLines with "Other interest receivable":');
lines.forEach((line, i) => {
  if (line.toLowerCase().includes('other interest receivable')) {
    console.log(`  Line ${i}: ${line.trim()}`);
  }
});

console.log('\nLines with "Income from participating":');
lines.forEach((line, i) => {
  if (line.toLowerCase().includes('income from participating')) {
    console.log(`  Line ${i}: ${line.trim()}`);
  }
});

console.log('\n=== Full P&L Section ===');
let inPL = false;
lines.forEach((line, i) => {
  if (line.includes('PROFIT AND LOSS')) inPL = true;
  if (line.includes('NOTES TO THE')) inPL = false;
  if (inPL && line.trim()) {
    console.log(`Line ${i.toString().padStart(2)}: ${line}`);
  }
});
