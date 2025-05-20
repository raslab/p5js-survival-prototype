class Particle {
  constructor(p, x, y, color, size, lifetime) {
    this.p = p; // Store the p5 instance
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
    this.lifetime = lifetime;
    this.startTime = this.p.millis(); // Record the start time of the particle - Use this.p.millis()

    // Random velocity
    this.velocity = this.p.createVector(this.p.random(-1, 1), this.p.random(-1, 1)).normalize().mult(this.p.random(1, 3)); // Use this.p.createVector and normalize/multiply for consistent speed
  }

  update() {
    let elapsed = this.p.millis() - this.startTime; // Use this.p.millis()
    let lifeProgress = this.p.constrain(elapsed / this.lifetime, 0, 1); // Progress from 0 to 1 - Use this.p.constrain

    // Update position based on velocity
    this.x += this.velocity.x;
    this.y += this.velocity.y;

    // Check if particle is finished
    return lifeProgress >= 1; // Return true if particle should be removed
  }

  draw(healthBarHeight, offsetX) { // Accept healthBarHeight and offsetX
    let elapsed = this.p.millis() - this.startTime; // Use this.p.millis()
    let lifeProgress = this.p.constrain(elapsed / this.lifetime, 0, 1); // Progress from 0 to 1 - Use this.p.constrain
    let alpha = this.p.lerp(255, 0, lifeProgress); // Fade out the particle - Use this.p.lerp

    this.p.noStroke(); // Use this.p.noStroke
    this.p.fill(this.color[0], this.color[1], this.color[2], alpha); // Particle color with fading transparency - Use this.p.fill
    // Draw particle as a circle, shifted down by healthBarHeight and right by offsetX
    this.p.ellipse(this.x + offsetX, this.y + healthBarHeight, this.size); // Draw particle as a circle - Use this.p.ellipse
  }
}

export { Particle };
