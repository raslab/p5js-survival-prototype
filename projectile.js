class Projectile {
  constructor(x, y, directionX, directionY, cellSize, speed, projectileImage, p) {
    this.x = x;
    this.y = y;
    this.directionX = directionX;
    this.directionY = directionY;
    this.cellSize = cellSize;
    this.speed = speed; // Speed in cells per frame
    this.projectileImage = projectileImage; // This now holds the blockbits sprite sheet

    // Animation properties
    this.currentX = this.x * this.cellSize;
    this.currentY = this.y * this.cellSize;

    // Sprite properties
    this.frameWidth = 16;
    this.frameHeight = 16;
    this.frameIndex = p.floor(p.random(4)); // Select a random frame index (0, 1, 2, or 3)
  }

  draw(p, healthBarHeight, offsetX) { // Accept p instance, healthBarHeight, and offsetX
    // Calculate source rectangle for the selected frame (assuming 4 horizontal frames)
    let sx, sy, sWidth, sHeight;
    sWidth = this.frameWidth;
    sHeight = this.frameHeight;
    sy = 0; // Assuming all frames are in a single row
    sx = this.frameIndex * this.frameWidth;


    if (this.projectileImage && this.projectileImage.width > 0) { // Use projectileImage which holds the sprite sheet
        // Draw projectile, shifted down by healthBarHeight and right by offsetX
        p.image(this.projectileImage, this.currentX + offsetX, this.currentY + healthBarHeight, this.cellSize, this.cellSize, sx, sy, sWidth, sHeight);
    } else {
        // Draw placeholder, shifted down by healthBarHeight and right by offsetX
        p.fill(255); // White placeholder
        p.ellipse(this.currentX + this.cellSize / 2 + offsetX, this.currentY + this.cellSize / 2 + healthBarHeight, this.cellSize * 0.3);
    }
  }

  update(gridSizeX, gridSizeY, grid, player, p, projectileDamage) {
    this.currentX += this.directionX * this.speed * this.cellSize;
    this.currentY += this.directionY * this.speed * this.cellSize;

    // Calculate new grid position based on current smooth position
    let newGridX = p.floor(this.currentX / this.cellSize); // Use p.floor
    let newGridY = p.floor(this.currentY / this.cellSize); // Use p.floor

    // Check if the projectile has moved to a new cell or is currently in a cell
    // and check for collisions with walls, obstacles, or the player
    if (newGridX !== this.x || newGridY !== this.y) {
        this.x = newGridX;
        this.y = newGridY;
    }

    // Check for collisions at the current grid position
    if (this.x < 0 || this.x >= gridSizeX || this.y < 0 || this.y >= gridSizeY || (grid[this.x] && grid[this.x][this.y] === 'obstacle')) {
        return true; // Mark for removal if out of bounds or hit obstacle
    } else if (this.x === player.x && this.y === player.y) {
        // Collision with player
        player.takeDamage(projectileDamage); // Reduce health
        return true; // Mark for removal
    }


    return false; // No collision
  }
}

export { Projectile };
