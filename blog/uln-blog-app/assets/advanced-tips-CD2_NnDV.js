const r=`---\r
title: "JavaScript Advanced Tips and Techniques"\r
description: "Boost your JavaScript skills with advanced patterns, tips, and best practices for modern development."\r
date: 2025-09-12\r
tags: ["JavaScript", "Programming", "Tips"]\r
author: "ULN Team"\r
slug: "javascript-advanced-tips"\r
draft: false\r
---\r
\r
# JavaScript Advanced Tips and Techniques\r
\r
JavaScript powers modern web applications, but mastering its latest features and best practices can transform your code from functional to exceptional. This guide shares advanced techniques to write cleaner, more efficient code.\r
\r
---\r
\r
## Modern Features\r
\r
### Optional Chaining (\`?.\`)\r
\r
\`\`\`js\r
const user = { profile: {} };\r
console.log(user?.profile?.email); // undefined instead of TypeError\r
\`\`\`\r
\r
### Nullish Coalescing (\`??\`)\r
\r
\`\`\`js\r
const value = null ?? 'default'; // 'default'\r
const zero = 0 ?? 'default';     // 0\r
\`\`\`\r
\r
### Destructuring with Rest/Spread\r
\r
\`\`\`js\r
const { id, ...rest } = { id: 1, name: 'Alice', age: 30 };\r
console.log(id);   // 1\r
console.log(rest); // { name: 'Alice', age: 30 }\r
\`\`\`\r
\r
---\r
\r
## Performance Patterns\r
\r
\`\`\`js\r
// Avoid global variables by using block scope\r
let count = 0;\r
\r
// Use Set for unique values\r
const uniques = [...new Set([1, 2, 2, 3])];\r
console.log(uniques); // [1, 2, 3]\r
\`\`\`\r
\r
---\r
\r
## Error Handling\r
\r
\`\`\`js\r
async function fetchData(url) {\r
  try {\r
    const response = await fetch(url);\r
    if (!response.ok) throw new Error(\`HTTP \${response.status}\`);\r
    return await response.json();\r
  } catch (error) {\r
    console.error('Fetch failed:', error);\r
    return null;\r
  }\r
}\r
\`\`\`\r
\r
---\r
`;export{r as default};
