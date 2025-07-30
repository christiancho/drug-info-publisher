import * as fs from 'fs';

const data = JSON.parse(fs.readFileSync('data/chunk_001.json', 'utf-8'));
const drug = data[0];

console.log('Drug structure:');
console.log('drugName type:', typeof drug.drugName, 'value:', drug.drugName);
console.log('setId type:', typeof drug.setId, 'value:', drug.setId);
console.log('slug type:', typeof drug.slug, 'value:', drug.slug);
console.log('labeler type:', typeof drug.labeler, 'value:', drug.labeler);

console.log('\nLabel fields that might cause issues:');
const label = drug.label;
Object.keys(label).forEach(key => {
  const value = label[key];
  const type = typeof value;
  console.log(`${key}: ${type}`);
  if (type !== 'string' && value !== undefined) {
    console.log(`  ⚠️  NON-STRING: ${key} is ${type} - ${String(value).substring(0, 100)}`);
  }
});