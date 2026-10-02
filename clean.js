const fs = require('fs');
let text = fs.readFileSync('./swot_part1.txt', 'utf8');

// The text is the output of view_file.
// It starts with something like:
// Created At: ...
// Completed At: ...
// File Path: ...
// Total Lines: 906
// Total Bytes: 37207
// Showing lines 1 to 800
// The following code has been modified to include a line number before every line...
// 1: import React from "react"
// 2: import clsx from "clsx"
// ...
// The above content does NOT show the entire file contents...

let lines = text.split('\n');
let codeLines = [];
let started = false;

for (let line of lines) {
  if (line.match(/^\d+:\s/)) {
    codeLines.push(line.replace(/^\d+:\s/, ''));
  }
}

fs.writeFileSync('./swot_part1_clean.tsx', codeLines.join('\n'));
