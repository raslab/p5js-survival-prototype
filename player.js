class Player {
  constructor(x, y, cellSize, playerImage) {
    this.x = x;
    this.y = y;
    this.cellSize = cellSize;
    this.playerImage = playerImage;
    this.health = 100; // Initial health

    // Animation properties
    this.currentX = this.x * this.cellSize;
    this.currentY = this.y * this.cellSize;
    this.targetX = this.currentX;
    this.targetY = this.currentY;
    this.animationProgress = 1; // Start at 1 so no initial animation
    this.animationDuration = 0.1; // Duration in seconds for movement animation

    // Sprite animation properties
    this.animationFrame = 0;
    this.direction = 'down'; // Default direction
    this.isDead = false;
    this.frameWidth = 16;
    this.frameHeight = 16;
    this.animationSpeed = 0.15; // Speed of animation (frames per second)
    this.lastFrameTime = 0;


    // Damage feedback properties
    this.damageFlashTimer = 0;
    this.damageFlashDuration = 0.2; // Duration of damage flash in seconds
  }

  draw(p, healthBarHeight, offsetX) { // Accept p instance, healthBarHeight, and offsetX
    // Apply damage flash tint if active
    if (this.damageFlashTimer > 0) {
        p.tint(255, 0, 0); // Red tint
    } else {
        p.noTint(); // Remove tint
    }

    // Calculate source rectangle for the current frame
    let sx, sy, sWidth, sHeight;
    sWidth = this.frameWidth;
    sHeight = this.frameHeight;
    sy = 0; // Assuming all frames are in a single row

    if (this.isDead) {
        // Death frame (index 9)
        sx = 9 * this.frameWidth;
    } else {
        // Determine frame index based on movement state (idle or moving)
        let frameIndex;
        if (this.animationProgress < 1) { // Moving
            frameIndex = 1 + (p.floor(this.animationFrame) % 2); // Frames 1 and 2 (indices 1 and 2)
        } else { // Idle
            frameIndex = 0; // Frame 0 (index 0)
        }

        // Calculate source x based on direction and frame index
        if (this.direction === 'down') {
            sx = (0 + frameIndex) * this.frameWidth; // Frames 0, 1, 2
        } else if (this.direction === 'up') {
            sx = (3 + frameIndex) * this.frameWidth; // Frames 3, 4, 5
        } else if (this.direction === 'right' || this.direction === 'left') {
            sx = (6 + frameIndex) * this.frameWidth; // Frames 6, 7, 8
        } else { // Default to down animation
             sx = (0 + frameIndex) * this.frameWidth; // Frames 0, 1, 2
        }
    }

    // Save current transformation state
    p.push();

    // Translate to the center of the cell for scaling, shifted down by healthBarHeight and right by offsetX
    p.translate(this.currentX + this.cellSize / 2 + offsetX, this.currentY + this.cellSize / 2 + healthBarHeight);

    // Mirror horizontally if moving left
    if (this.direction === 'left') {
        p.scale(-1, 1);
    }

    // Draw player image (if loaded) or a placeholder at the translated origin
    if (this.playerImage && this.playerImage.width > 0) {
      // Draw the image centered around the translated origin
      p.image(this.playerImage, -this.cellSize / 2, -this.cellSize / 2, this.cellSize, this.cellSize, sx, sy, sWidth, sHeight);
    } else {
      // Placeholder if image not loaded or failed to load
      p.fill(0); // Black
      p.ellipse(0, 0, this.cellSize * 0.8); // Draw ellipse centered at origin
    }

    // Restore original transformation state
    p.pop();

    p.noTint(); // Ensure tint is reset after drawing
  }

  update(p) { // Accept p instance
      // Update animation progress for smooth movement
      if (this.animationProgress < 1) {
          this.animationProgress += (1 / p.frameRate()) / this.animationDuration; // Increment based on frame rate and duration
          this.animationProgress = p.constrain(this.animationProgress, 0, 1); // Clamp between 0 and 1

          // Interpolate current position towards target
          this.currentX = p.lerp(this.currentX, this.targetX, this.animationProgress);
          this.currentY = p.lerp(this.currentY, this.targetY, this.animationProgress);
      }

      // Update sprite animation frame if not dead and moving
      if (!this.isDead && this.animationProgress < 1) {
          let currentTime = p.millis();
          // Only increment animationFrame if moving
          if (currentTime - this.lastFrameTime > (1000 / (this.animationSpeed * 10))) { // Adjust speed based on animationSpeed
              this.animationFrame = (this.animationFrame + 1);
              this.lastFrameTime = currentTime;
          }
      } else if (!this.isDead && this.animationProgress === 1) {
          // If idle, reset animation frame to 0 to show the first frame
          this.animationFrame = 0;
      }


      // Update damage flash timer
      if (this.damageFlashTimer > 0) {
          this.damageFlashTimer -= (1 / p.frameRate()); // Decrement based on frame rate
      }
  }

  move(dx, dy, gridSizeX, gridSizeY, grid) { // Accept gridSizeX and gridSizeY
    let nextPlayerX = this.x + dx;
    let nextPlayerY = this.y + dy;

    // Set direction based on movement
    if (dx === -1) this.direction = 'left';
    else if (dx === 1) this.direction = 'right';
    else if (dy === -1) this.direction = 'up';
    else if (dy === 1) this.direction = 'down';

    // Reset animation frame on movement
    this.animationFrame = 0;


    // Check if the next position is within bounds and not an obstacle
    if (nextPlayerX >= 0 && nextPlayerX < gridSizeX && nextPlayerY >= 0 && nextPlayerY < gridSizeY && grid[nextPlayerX] && grid[nextPlayerX][nextPlayerY] !== 'obstacle') { // Use gridSizeX and gridSizeY for bounds check and add grid[nextPlayerX] check
      // Update player grid position
      grid[this.x][this.y] = 'empty'; // Clear previous position
      this.x = nextPlayerX;
      this.y = nextPlayerY;
      grid[this.x][this.y] = 'player'; // Set new position

      // Set animation target and reset progress
      this.targetX = this.x * this.cellSize;
      this.targetY = this.y * this.cellSize;
      this.animationProgress = 0;

      return true; // Movement successful
    }
    return false; // Movement failed
  }

  takeDamage(amount) { // Does not use p5 functions
      this.health -= amount;
      this.damageFlashTimer = this.damageFlashDuration; // Activate damage flash
      if (this.health <= 0) {
          this.isDead = true; // Set death state
          this.animationFrame = 9; // Set to death frame index
      }
  }
}

export { Player };
