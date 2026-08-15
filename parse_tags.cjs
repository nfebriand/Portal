const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardBidangView.tsx', 'utf8');

const s = code.indexOf("{activeTab === 'summary' && (");
const e = code.indexOf('{/* Delegation Form Modal */}');
let chunk = code.substring(s, e);

let stack = [];
let re = /<\/?([a-zA-Z0-9]+|)[^>]*>/g;
let match;
while ((match = re.exec(chunk)) !== null) {
  let tag = match[0];
  if (tag.startsWith('</')) {
    let tagName = tag.match(/<\/([a-zA-Z0-9]+|)/)[1];
    if (stack.length > 0 && stack[stack.length - 1].name === tagName) {
      stack.pop();
    } else {
      console.log("Unmatched closing tag:", tag, "at", match.index, "expected:", stack.length > 0 ? stack[stack.length - 1].name : 'none');
    }
  } else if (!tag.endsWith('/>')) {
    let tagName = tag.match(/<([a-zA-Z0-9]+|)/)[1];
    stack.push({name: tagName, index: match.index});
  }
}

for (let tag of stack) {
  console.log("Unclosed tag:", tag.name, "at", tag.index);
}
