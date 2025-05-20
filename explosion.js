class Explosion {
  constructor(x, y, cellSize, duration, p) { // Accept p instance
    this.x = x;
    this.y = y;
    this.cellSize = cellSize;
    this.startTime = p.millis(); // Record the start time of the explosion - Use p.millis
    this.duration = duration * 1000; // Duration in milliseconds
    this.maxRadius = this.cellSize * 1.5; // Maximum visual radius of the explosion
  }

  update(p) { // Accept p instance
    let elapsed = p.millis() - this.startTime; // Use p.millis
    this.animationProgress = p.constrain(elapsed / this.duration, 0, 1); // Progress from 0 to 1 - Use p.constrain

    // Check if animation is finished
    return this.animationProgress >= 1; // Return true if explosion should be removed
  }

  draw(p, healthBarHeight, offsetX) { // Accept p instance, healthBarHeight, and offsetX
    let currentRadius = p.lerp(0, this.maxRadius, this.animationProgress); // Use p.lerp
    let alpha = p.lerp(255, 0, this.animationProgress); // Fade out the explosion - Use p.lerp

    p.noStroke(); // Use p.noStroke
    p.fill(255, 165, 0, alpha); // Orange color with fading transparency - Use p.fill
    // Draw expanding circle, shifted down by healthBarHeight and right by offsetX
    p.ellipse(this.x * this.cellSize + this.cellSize / 2 + offsetX, this.y * this.cellSize + this.cellSize / 2 + healthBarHeight, currentRadius * 2); // Draw expanding circle - Use p.ellipse
  }
}

export { Explosion };
