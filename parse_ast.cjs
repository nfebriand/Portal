const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardBidangView.tsx', 'utf8');

const s = code.indexOf("{activeTab === 'summary' && (");
const e = code.indexOf('{/* Delegation Form Modal */}');
let chunk = code.substring(s, e);

// we can remove all self-closing tags and text, and see what's left
let stripped = chunk.replace(/<[a-zA-Z0-9]+\s+[^>]*\/>/g, ''); // not quite right because of > in props

let tags = [];
let i = 0;
while (i < chunk.length) {
    if (chunk[i] === '<') {
        let isClose = chunk[i+1] === '/';
        let j = i + 1;
        if (isClose) j++;
        let tagName = '';
        while (j < chunk.length && /[a-zA-Z0-9]/.test(chunk[j])) {
            tagName += chunk[j];
            j++;
        }
        if (tagName) {
            // Find end of tag. Watch out for > in strings or braces!
            // Actually, we can just assume if we find `/>` it's self closing.
            // A quick and dirty way:
            let k = j;
            let inString = false;
            let inBrace = 0;
            let selfClosing = false;
            while (k < chunk.length) {
                if (chunk[k] === '"' || chunk[k] === "'") {
                    inString = !inString;
                } else if (!inString && chunk[k] === '{') {
                    inBrace++;
                } else if (!inString && chunk[k] === '}') {
                    inBrace--;
                } else if (!inString && inBrace === 0 && chunk[k] === '>') {
                    if (chunk[k-1] === '/') selfClosing = true;
                    break;
                }
                k++;
            }
            if (k < chunk.length) {
                if (!selfClosing) {
                    if (isClose) {
                        if (tags.length > 0 && tags[tags.length - 1] === tagName) {
                            tags.pop();
                        } else {
                            tags.push('/' + tagName);
                        }
                    } else {
                        tags.push(tagName);
                    }
                }
                i = k;
            }
        }
    }
    i++;
}

console.log(tags);
