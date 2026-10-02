const fs = require('fs');
const path = '/Users/mmohammed/.gemini/antigravity-ide/brain/28ec50d7-47bf-4485-866c-46868ca90e81/.system_generated/logs/transcript_full.jsonl';

const lines = fs.readFileSync(path, 'utf8').split('\n');

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const obj = JSON.parse(line);
    if (obj.content && obj.content.includes('Showing lines 1 to 800') && obj.content.includes('SwotSelection.tsx')) {
      console.log("Found 1 to 800!");
      fs.writeFileSync('./swot_part1.txt', obj.content);
    }
    if (obj.content && obj.content.includes('Showing lines 800') && obj.content.includes('SwotSelection.tsx')) {
      console.log("Found 800+!");
      fs.writeFileSync('./swot_part2.txt', obj.content);
    }
  } catch (e) {}
}
