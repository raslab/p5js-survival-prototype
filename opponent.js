// Breadth-First Search (BFS) for pathfinding
function bfs(start, target, gridSizeX, gridSizeY, grid) { // Accept gridSizeX and gridSizeY
    let queue = [{x: start.x, y: start.y, path: []}];
    let visited = new Set();
    visited.add(`${start.x},${start.y}`);

    while (queue.length > 0) {
        let {x, y, path} = queue.shift();

        // Check if target is reached
        if (x === target.x && y === target.y) {
            return path.length > 0 ? path[0] : {x: start.x, y: start.y}; // Return the next step
        }

        // Explore neighbors (up, down, left, right)
        let neighbors = [
            {nx: x, ny: y - 1}, // Up
            {nx: x, ny: y + 1}, // Down
            {nx: x - 1, ny: y}, // Left
            {nx: x + 1, ny: y}  // Right
        ];

        for (let neighbor of neighbors) {
            let nx = neighbor.nx;
            let ny = neighbor.ny;

            // Check bounds and if not visited or obstacle
            if (nx >= 0 && nx < gridSizeX && ny >= 0 && ny < gridSizeY && !visited.has(`${nx},${ny}`) && grid[nx][ny] !== 'obstacle') {
                visited.add(`${nx},${ny}`);
                queue.push({x: nx, y: ny, path: [...path, {x: nx, y: ny}]});
            }
        }
    }

    // No path found, stay in place
    return {x: start.x, y: start.y};
}

class Opponent {
  constructor(x, y, type, cellSize, basicOpponentImage, shooterOpponentImage) {
    this.x = x;
    this.y = y;
    this.type = type; // 'basic' or 'shooter'
    this.cellSize = cellSize;
    this.basicOpponentImage = basicOpponentImage; // This now holds the enemy sprite sheet
    this.shooterOpponentImage = shooterOpponentImage; // This also holds the enemy sprite sheet

    // Animation properties
    this.currentX = this.x * this.cellSize;
    this.currentY = this.y * this.cellSize;
    this.targetX = this.currentX;
    this.targetY = this.currentY;
    this.animationProgress = 1; // Start at 1 so no initial animation
    this.animationDuration = 0.2; // Duration in seconds for movement animation (slightly slower than player)

    // Sprite animation properties
    this.animationFrame = 0;
    this.frameWidth = 16;
    this.frameHeight = 16;
    this.animationSpeed = 0.1; // Speed of animation (frames per second)
    this.lastFrameTime = 0;
  }

  draw(p, healthBarHeight, offsetX) { // Accept p instance, healthBarHeight, and offsetX
    // Apply red tint for shooter opponents
    if (this.type === 'shooter') {
        p.tint(255, 0, 0); // Red tint
    } else {
        p.noTint(); // Remove tint for basic opponents
    }

    // Calculate source rectangle for the current frame (assuming 4 horizontal frames)
    let sx, sy, sWidth, sHeight;
    sWidth = this.frameWidth;
    sHeight = this.frameHeight;
    sy = 0; // Assuming all frames are in a single row
    sx = (p.floor(this.animationFrame) % 3) * this.frameWidth; // Loop through frames 0, 1, 2, 3


    // Draw opponent using the sprite sheet, shifted down by healthBarHeight and right by offsetX
    if (this.basicOpponentImage && this.basicOpponentImage.width > 0) { // Use basicOpponentImage which holds the sprite sheet
        p.image(this.basicOpponentImage, this.currentX + offsetX, this.currentY + healthBarHeight, this.cellSize, this.cellSize, sx, sy, sWidth, sHeight);
    } else {
        // Draw emojis as placeholders if images are not loaded or failed to load, shifted down by healthBarHeight and right by offsetX
        p.textSize(this.cellSize * 0.8); // Adjust emoji size
        p.textAlign(p.CENTER, p.CENTER);
        if (this.type === 'basic') {
            p.text('👹', this.currentX + this.cellSize / 2 + offsetX, this.currentY + this.cellSize / 2 + healthBarHeight); // Monster emoji
        } else if (this.type === 'shooter') {
            p.text('🎯', this.currentX + this.cellSize / 2 + offsetX, this.currentY + this.cellSize / 2 + healthBarHeight); // Dart emoji for shooter
        }
    }

    p.noTint(); // Ensure tint is reset after drawing
  }

  update(p) {
      // Update animation progress for smooth movement
      if (this.animationProgress < 1) {
          this.animationProgress += (1 / p.frameRate()) / this.animationDuration; // Increment based on frame rate and duration
          this.animationProgress = p.constrain(this.animationProgress, 0, 1); // Clamp between 0 and 1

          // Interpolate current position towards target
          this.currentX = p.lerp(this.currentX, this.targetX, this.animationProgress);
          this.currentY = p.lerp(this.currentY, this.targetY, this.animationProgress);
      }

      // Update sprite animation frame
      let currentTime = p.millis();
      if (currentTime - this.lastFrameTime > (1000 / (this.animationSpeed * 10))) { // Adjust speed based on animationSpeed
          this.animationFrame = (this.animationFrame + 1);
          this.lastFrameTime = currentTime;
      }
  }


  move(gridSizeX, gridSizeY, grid, player, opponents, p) { // Accept gridSizeX and gridSizeY
      if (this.type === 'basic') {
          // Use BFS to find the next step towards the player, avoiding obstacles
          let nextStep = bfs(this, player, gridSizeX, gridSizeY, grid); // Pass gridSizeX and gridSizeY to bfs

          // Check if the next step is valid and not occupied by another opponent
          if (nextStep.x >= 0 && nextStep.x < gridSizeX && nextStep.y >= 0 && nextStep.y < gridSizeY) {
              let occupiedByOtherOpponent = false;
              for(let otherOpponent of opponents) {
                  if (otherOpponent !== this && otherOpponent.x === nextStep.x && otherOpponent.y === nextStep.y) {
                      occupiedByOtherOpponent = true;
                      break;
                  }
              }
              if (!occupiedByOtherOpponent) {
                   // Update opponent grid position
                  grid[this.x][this.y] = 'empty'; // Clear previous position
                  this.x = nextStep.x;
                  this.y = nextStep.y;
                  grid[this.x][this.y] = 'opponent'; // Set new position

                  // Set animation target and reset progress
                  this.targetX = this.x * this.cellSize;
                  this.targetY = this.y * this.cellSize;
                  this.animationProgress = 0;
              }
          }
      } else if (this.type === 'shooter') {
          // Shooter enemy behavior: random chance to move or shoot
          if (p.random() < 0.5) { // 50% chance to move - Use p.random
              let nextStep = bfs(this, player, gridSizeX, gridSizeY, grid); // bfs does not use p5 functions
               if (nextStep.x >= 0 && nextStep.x < gridSizeX && nextStep.y >= 0 && nextStep.y < gridSizeY) {
                  let occupiedByOtherOpponent = false;
                  for(let otherOpponent of opponents) {
                      if (otherOpponent !== this && otherOpponent.x === nextStep.x && otherOpponent.y === nextStep.y) {
                          occupiedByOtherOpponent = true;
                          break;
                      }
                  }
                  if (!occupiedByOtherOpponent) {
                       // Update opponent grid position
                      grid[this.x][this.y] = 'empty'; // Clear previous position
                      this.x = nextStep.x;
                      this.y = nextStep.y;
                      grid[this.x][this.y] = 'opponent'; // Set new position

                      // Set animation target and reset progress
                      this.targetX = this.x * this.cellSize;
                      this.targetY = this.y * this.cellSize;
                      this.animationProgress = 0;
                  }
              }
          } else { // 50% chance to shoot
              let dx = player.x - this.x;
              let dy = player.y - this.y;

              // Check if player is in the same row or column
              if (this.y === player.y) { // Same row, shoot horizontally
                  let directionX = Math.sign(dx);
                   // Return projectile data to be added to the global projectiles array
                   return {
                      type: 'projectile',
                      x: this.x,
                      y: this.y,
                      directionX: directionX,
                      directionY: 0
                  };
              } else if (this.x === player.x) { // Same column, shoot vertically
                  let directionY = Math.sign(dy);
                   // Return projectile data to be added to the global projectiles array
                   return {
                      type: 'projectile',
                      x: this.x,
                      y: this.y,
                      directionX: 0,
                      directionY: directionY
                  };
              } else {
                  // If not aligned, just move instead of shooting
                   let nextStep = bfs(this, player, gridSizeX, gridSizeY, grid); // Pass gridSizeX and gridSizeY to bfs
                   if (nextStep.x >= 0 && nextStep.x < gridSizeX && nextStep.y >= 0 && nextStep.y < gridSizeY) { // Use gridSizeX and gridSizeY for bounds check
                      let occupiedByOtherOpponent = false;
                      for(let otherOpponent of opponents) {
                          if (otherOpponent !== this && otherOpponent.x === nextStep.x && otherOpponent.y === nextStep.y) {
                              occupiedByOtherOpponent = true;
                              break;
                          }
                      }
                      if (!occupiedByOtherOpponent) {
                           // Update opponent grid position
                          grid[this.x][this.y] = 'empty'; // Clear previous position
                          this.x = nextStep.x;
                          this.y = nextStep.y;
                          grid[this.x][this.y] = 'opponent'; // Set new position

                          // Set animation target and reset progress
                          this.targetX = this.x * this.cellSize;
                          this.targetY = this.y * this.cellSize;
                          this.animationProgress = 0;
                      }
                  }
              }
          }
      }
      return null; // No projectile created
  }
}

export { Opponent };
