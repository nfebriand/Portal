const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardBidangView.tsx', 'utf8');

// Find the start of the grid containing the metrics
const gridStart = code.lastIndexOf('<div className="grid grid-cols-1 md:grid-cols-3 gap-6">', code.indexOf('{/* Metric 1 */}'));

// Find the Target section
const targetSection = code.indexOf('{/* Target & Perjanjian Kerja Section */}');

// We need to delete everything from gridStart up to before the Delegation Form Modal, 
// BUT leaving the closing tags for the main layout.
// Let's see what is right before the gridStart!
console.log(code.substring(gridStart - 200, gridStart));
