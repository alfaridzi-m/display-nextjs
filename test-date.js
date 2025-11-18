// Test Date parsing
const timeString = "2025-11-18 00:00 UTC";
const date = new Date(timeString);
console.log('Input:', timeString);
console.log('Parsed:', date.toISOString());
console.log('UTC Date:', date.getUTCDate());
console.log('UTC Month:', date.getUTCMonth());
console.log('UTC Year:', date.getUTCFullYear());
console.log('UTC Hours:', date.getUTCHours());

// Test the exact match logic
const today = new Date(Date.UTC(2025, 10, 18)); // Month is 0-indexed
console.log('\nToday:', today.toISOString());
console.log('Match:', 
    date.getUTCFullYear() === today.getUTCFullYear() &&
    date.getUTCMonth() === today.getUTCMonth() &&
    date.getUTCDate() === today.getUTCDate() &&
    date.getUTCHours() === 0
);
