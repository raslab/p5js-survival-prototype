import { Explosion } from './explosion.js';
import { createParticles } from './sketch.js'; // Import createParticles from sketch.js

class Bomb {
  constructor(x, y, timer, cellSize, bombImage, explosionDuration) {
    this.x = x;
    this.y = y;
    this.timer = timer;
    this.cellSize = cellSize;
    this.bombImage = bombImage; // This now holds the player sprite sheet
    this.explosionDuration = explosionDuration; // Duration for the explosion animation

    // Sprite properties
    this.frameWidth = 16;
    this.frameHeight = 16;
  }

  draw(p, healthBarHeight, offsetX) { // Accept p instance, healthBarHeight, and offsetX
    // Calculate source rectangle for the bomb frame (10th frame, index 9)
    let sx, sy, sWidth, sHeight;
    sWidth = this.frameWidth;
    sHeight = this.frameHeight;
    sy = 0; // Assuming all frames are in a single row
    sx = 9 * this.frameWidth; // 10th frame is at index 9

    // Extract the bomb frame from the sprite sheet just before drawing
    let bombFrame = this.bombImage.get(sx, sy, sWidth, sHeight);

    if (bombFrame && bombFrame.width > 0) { // Use extracted bombFrame
        // Draw the extracted sprite, shifted down by healthBarHeight and right by offsetX
        p.image(bombFrame, this.x * this.cellSize + offsetX, this.y * this.cellSize + healthBarHeight, this.cellSize, this.cellSize);
    } else {
        // Draw placeholder, shifted down by healthBarHeight and right by offsetX
        p.fill(0); // Black placeholder
        p.ellipse(this.x * this.cellSize + this.cellSize / 2 + offsetX, this.y * this.cellSize + this.cellSize / 2 + healthBarHeight, this.cellSize * 0.7);
    }
    // Always draw timer on bomb, regardless of image, shifted down by healthBarHeight and right by offsetX
    p.fill(255); // White text
    p.textSize(this.cellSize * 0.5);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(this.timer, this.x * this.cellSize + this.cellSize / 2 + offsetX, this.y * this.cellSize + this.cellSize / 2 + healthBarHeight);
  }

  update() { // Does not use p5 functions
    this.timer--;
    return this.timer <= 0; // Return true if bomb should explode
  }

  explode(gridSizeX, gridSizeY, grid, player, opponents, p, particles, healthBarHeight) {
      let explosionRadius = 1; // 1 cell radius
      let affectedCells = [];
      let newExplosions = []; // Array to hold new Explosion instances

      // Get cells within explosion radius
      for (let i = -explosionRadius; i <= explosionRadius; i++) {
          for (let j = -explosionRadius; j <= explosionRadius; j++) {
              let cellX = this.x + i;
              let cellY = this.y + j;

              // Check bounds
              if (cellX >= 0 && cellX < gridSizeX && cellY >= 0 && cellY < gridSizeY) {
                  affectedCells.push({x: cellX, y: cellY});
                  newExplosions.push(new Explosion(cellX, cellY, this.cellSize, this.explosionDuration, p));
                  createParticles(particles, this.cellSize, cellX, cellY, 10, [255, 100, 0], p, healthBarHeight); // Pass particles array, cellSize, and healthBarHeight
              }
          }
      }

      // Process affected cells
      for (let cell of affectedCells) {
          // Remove opponents in affected cells - Handled in sketch.js

          // Remove obstacles in affected cells
          if (grid[cell.x][cell.y] === 'obstacle') {
              grid[cell.x][cell.y] = 'empty';
          }

          // Check for player in affected cells
          if (player.x === cell.x && player.y === cell.y) {
              player.takeDamage(30); // Reduce health
          }
      }
      return { affectedCells: affectedCells, newExplosions: newExplosions }; // Return affected cells and new explosions
  }
}

export { Bomb };
