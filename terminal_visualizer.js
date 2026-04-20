import readline from 'readline';

const totalBricks = 50;
const columns = 10;
const rows = Math.ceil(totalBricks / columns);

const emptyBrick = '[  ]';
const filledBrick= '[██]';

let completed = 0;

function drawWall() {
  // Clear the console
  console.clear();
  console.log("\n\x1b[36m=== 🤖 Agent Progress Tracker ===\x1b[0m\n");
  console.log(`\x1b[33mTasks Completed: ${completed} / ${totalBricks}\x1b[0m\n`);
  
  for (let r = rows - 1; r >= 0; r--) {
    let rowStr = '';
    // offset odd rows
    if (r % 2 === 1) {
      rowStr += '  ';
    }
    for (let c = 0; c < columns; c++) {
      const index = r * columns + c;
      if (index < totalBricks) {
        if (index < completed) {
          rowStr += `\x1b[32m${filledBrick}\x1b[0m `;
        } else {
          rowStr += `\x1b[90m${emptyBrick}\x1b[0m `;
        }
      }
    }
    console.log(rowStr);
  }
}

const interval = setInterval(() => {
  drawWall();
  completed++;
  
  if (completed > totalBricks) {
    clearInterval(interval);
    console.log("\n\x1b[32m✅ Agent has successfully built the project!\x1b[0m\n");
  }
}, 150);
