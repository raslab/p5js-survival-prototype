import { Player } from './player.js';
import { Opponent } from './opponent.js';
import { Projectile } from './projectile.js';
import { Bomb } from './bomb.js';
import { Explosion } from './explosion.js';
import { Particle } from './particle.js';

const sketch = (p) => {

  // Grid parameters
  let gridSizeX = 15;
  let gridSizeY = 26;
  let gridSize = gridSizeX; // Keep gridSize for loops that only use one dimension if needed, but prefer gridSizeX/Y
  let cellSize;
  let grid = [];

  // Player
  let player;

  // Opponents
  let opponents = [];
  let spawnChance = 0.1; // 10% chance
  let shooterSpawnChance = 0.3; // 30% chance for shooter enemy

  // Projectiles
  let projectiles = [];
  let projectileSpeed = 0.2; // Projectiles move one cell per turn
  let projectileDamage = 10; // Damage dealt by projectiles - Keep for now as it's used in Projectile class

  // Bombs
  let bombs = [];
  let bombTimer = 3; // Bomb timer value - Keep for now to pass to Bomb constructor

  // Explosions
  let explosions = []; // To track active explosions for animation
  let explosionDuration = 0.5; // Duration of explosion animation in seconds

  // Particles
  let particles = []; // To track active particles for animation

  let collisionDamage = 20; // Damage taken per collision from basic enemy

  // Exits
  let exits = [];

  // Game state
  let gameState = 'playing'; // 'playing', 'win', 'lose'

  // Sprite sheet variables
  let playerSpriteSheet;
  let opponentSpriteSheet;
  let projectileSpriteSheet;
let tilesSpriteSheet;
let bombImage; // Variable for bomb image

// Opponent sprite sheet variables
let basicOpponentImage;
  let shooterOpponentImage;


  p.preload = () => {
    // Load sprite sheets
    playerSpriteSheet = p.loadImage('assets/player.png');
    opponentSpriteSheet = p.loadImage('assets/enemy.png'); // This likely contains both basic and shooter sprites
    tilesSpriteSheet = p.loadImage('assets/tiles.png');
    projectileSpriteSheet = p.loadImage('assets/blockbits.png'); // Corrected variable name
    // Assign playerSpriteSheet to bombImage to pass the whole sheet to Bomb
    bombImage = playerSpriteSheet;

    // Assign the loaded opponent sprite sheet to the specific variables
    basicOpponentImage = opponentSpriteSheet;
    shooterOpponentImage = opponentSpriteSheet;
  }

  // Health bar parameters
  let healthBarHeight = 50; // Height of the health bar area

  p.setup = () => {
    // Create canvas
    p.createCanvas(500, 800); // Adjusted for vertical layout (width, height)

    // Grid parameters
    cellSize = (p.height - healthBarHeight) / gridSizeY; // Calculate cellSize based on the grid area height

    // Initialize grid
    grid = []; // Clear existing grid
    for (let i = 0; i < gridSizeX; i++) {
      grid[i] = [];
      for (let j = 0; j < gridSizeY; j++) {
        grid[i][j] = 'empty';
      }
    }

    // Set initial player position and create player instance
    // Find a random empty cell for the player
    let emptyCells = [];
    for (let i = 0; i < gridSizeX; i++) {
      for (let j = 0; j < gridSizeY; j++) {
        if (grid[i][j] === 'empty') {
          emptyCells.push({ x: i, y: j });
        }
      }
    }

    if (emptyCells.length > 0) {
      let randomIndex = p.floor(p.random(emptyCells.length));
      let playerStartPos = emptyCells[randomIndex];
      player = new Player(playerStartPos.x, playerStartPos.y, cellSize, playerSpriteSheet); // Use playerSpriteSheet
      grid[player.x][player.y] = 'player';
    } else {
      // Fallback if no empty cells are found (shouldn't happen in a new grid)
      player = new Player(0, 0, cellSize, playerSpriteSheet);
      grid[player.x][player.y] = 'player';
    }

    // Clear existing exits and define new random exit positions
    exits = [];
    placeExits();

    // Place obstacles and walls
    placeObstaclesAndWalls();
  }

  function placeExits() {
      let placedExits = 0;
      while (placedExits < 3) { // Place 3 exits
          let randomX = p.floor(p.random(gridSizeX));
          let randomY = p.floor(p.random(gridSizeY));

          // Ensure the cell is empty and not the player start
          if (grid[randomX][randomY] === 'empty' && !(randomX === player.x && randomY === player.y)) {
              exits.push({ x: randomX, y: randomY });
              grid[randomX][randomY] = 'exit';
              placedExits++;
          }
      }

      // Place obstacles around exits
      for (let exit of exits) {
          for (let i = -1; i <= 1; i++) {
              for (let j = -1; j <= 1; j++) {
                  let obstacleX = exit.x + i;
                  let obstacleY = exit.y + j;

                  // Ensure the cell is within bounds, not the exit itself, not the player, and currently empty
                  if (obstacleX >= 0 && obstacleX < gridSizeX && obstacleY >= 0 && obstacleY < gridSizeY &&
                      !(obstacleX === exit.x && obstacleY === exit.y) &&
                      !(obstacleX === player.x && obstacleY === player.y) &&
                      grid[obstacleX][obstacleY] === 'empty') {
                      grid[obstacleX][obstacleY] = 'obstacle';
                  }
              }
          }
      }
  }

  function placeObstaclesAndWalls() {
    let numberOfObstaclesToPlace = p.floor(p.random(30, 40)); // Increased number of obstacles
    let placedObstacles = 0;

    // Place individual random obstacles
    while (placedObstacles < numberOfObstaclesToPlace * 0.7) { // Place about 70% as individual obstacles
      let randomX = p.floor(p.random(gridSizeX));
      let randomY = p.floor(p.random(gridSizeY));

      // Ensure the cell is empty and not an exit or player start
      if (grid[randomX][randomY] === 'empty' && !isExit(randomX, randomY) && !(randomX === player.x && randomY === player.y)) {
        grid[randomX][randomY] = 'obstacle';
        placedObstacles++;
      }
    }

    // Place random wall segments
    let numberOfWalls = p.floor(p.random(6, 10)); // Increased number of walls (6 to 9)
    for (let i = 0; i < numberOfWalls; i++) {
        let currentX = p.floor(p.random(gridSizeX));
        let currentY = p.floor(p.random(gridSizeY));
        let wallLength = p.floor(p.random(4, 8)); // Wall length of 4 to 7 cells
        let placedInSegment = 0;

        // Random initial direction
        let dx = p.random([-1, 0, 1]);
        let dy = p.random([-1, 0, 1]);
        // Ensure at least one direction is non-zero
        if (dx === 0 && dy === 0) {
            if (p.random() < 0.5) dx = 1; else dy = 1;
        }


        while(placedInSegment < wallLength) {
             // Check bounds and if the cell is empty
            if (currentX >= 0 && currentX < gridSizeX && currentY >= 0 && currentY < gridSizeY &&
                grid[currentX][currentY] === 'empty' && !isExit(currentX, currentY) && !(currentX === player.x && currentY === player.y)) {

                grid[currentX][currentY] = 'obstacle';
                placedInSegment++;

                // Randomly change direction slightly
                if (p.random() < 0.3) { // 30% chance to change direction
                    dx = p.random([-1, 0, 1]);
                    dy = p.random([-1, 0, 1]);
                     // Ensure at least one direction is non-zero
                    if (dx === 0 && dy === 0) {
                        if (p.random() < 0.5) dx = 1; else dy = 1;
                    }
                }

                currentX += dx;
                currentY += dy;

            } else {
                // Stop placing this wall segment if we hit a boundary or occupied cell
                break;
            }
        }
    }
  }

  function isExit(x, y) {
      for (let exit of exits) {
          if (exit.x === x && exit.y === y) {
              return true;
          }
      }
      return false;
  }
  p.draw = () => {
    let offsetX = (p.width - (gridSizeX * cellSize)) / 2; // Calculate horizontal offset
    p.background(220);

    // Update player animation
    player.update(p); // Pass p instance

    // Update opponent animations
    for (let opponent of opponents) {
        opponent.update(p); // Pass p instance
    }

    // Update projectile animations and check collisions
    updateProjectiles(p); // Pass p instance

    // Draw grid and cells based on state
    // Adjust drawing to start below the health bar
    for (let i = 0; i < gridSizeX; i++) {
      for (let j = 0; j < gridSizeY; j++) {
        p.stroke(0);
        p.noFill();
        // Draw cell outline, shifted down by healthBarHeight and right by offsetX
        p.rect(i * cellSize + offsetX, j * cellSize + healthBarHeight, cellSize, cellSize);

        let cellState = grid[i][j];

        if (cellState === 'obstacle') {
          // Draw obstacle using frame 4 from tilesSpriteSheet (index 3), shifted down and right
          p.image(tilesSpriteSheet, i * cellSize + offsetX, j * cellSize + healthBarHeight, cellSize, cellSize, 3 * 16, 0, 16, 16);
        } else if (cellState === 'exit') {
           // Draw exit using frame 8 from tilesSpriteSheet (index 7), shifted down and right
           p.image(tilesSpriteSheet, i * cellSize + offsetX, j * cellSize + healthBarHeight, cellSize, cellSize, 7 * 16, 0, 16, 16);
        } else {
            // Draw empty cell using frame 2 from tilesSpriteSheet (index 1), shifted down and right
            p.image(tilesSpriteSheet, i * cellSize + offsetX, j * cellSize + healthBarHeight, cellSize, cellSize, 0 * 16, 0, 16, 16);
        }
      }
    }

    // Draw player, shifted down by healthBarHeight and right by offsetX
    player.draw(p, healthBarHeight, offsetX); // Pass p instance, healthBarHeight, and offsetX

    // Draw opponents, shifted down by healthBarHeight and right by offsetX
    for (let opponent of opponents) {
        opponent.draw(p, healthBarHeight, offsetX); // Pass p instance, healthBarHeight, and offsetX
    }

    // Draw projectiles, shifted down by healthBarHeight and right by offsetX
    for (let projectile of projectiles) {
        projectile.draw(p, healthBarHeight, offsetX); // Pass p instance, healthBarHeight, and offsetX
    }

    // Draw bombs, shifted down by healthBarHeight and right by offsetX
    for (let bomb of bombs) {
        bomb.draw(p, healthBarHeight, offsetX); // Pass p instance, healthBarHeight, and offsetX
    }

    // Draw explosions, shifted down by healthBarHeight and right by offsetX
    let explosionsToRemove = [];
    for (let i = 0; i < explosions.length; i++) {
        let explosion = explosions[i];
        explosion.draw(p, healthBarHeight, offsetX); // Draw the explosion animation, shifted down and right
        if (explosion.update(p)) { // Update animation and check if finished - Pass p instance
            explosionsToRemove.push(i); // Mark for removal
        }
    }

    // Remove finished explosions (iterate backwards to avoid index issues)
    for (let i = explosionsToRemove.length - 1; i >= 0; i--) {
        explosions.splice(explosionsToRemove[i], 1);
    }

    // Draw and update particles, shifted down by healthBarHeight and right by offsetX
    let particlesToRemove = [];
    for (let i = 0; i < particles.length; i++) {
        let particle = particles[i];
        particle.draw(p, healthBarHeight, offsetX); // Draw the particle, shifted down and right
        if (particle.update(p)) { // Update particle and check if finished - Pass p instance
            particlesToRemove.push(i); // Mark for removal
        }
    }

    // Remove finished particles (iterate backwards to avoid index issues)
    for (let i = particlesToRemove.length - 1; i >= 0; i--) {
        particles.splice(particlesToRemove[i], 1);
    }


    // Game state display
    if (gameState === 'win') {
      // Draw a semi-transparent overlay
      p.fill(0, 255, 0, 150); // Green with transparency
      p.rect(0, 0, p.width, p.height);

      // Draw win text
      p.textSize(96); // Larger text
      p.fill(255); // White text
      p.textAlign(p.CENTER, p.CENTER);
      p.text('You Win!', p.width / 2, p.height / 2);
    } else if (gameState === 'lose') {
      // Draw a semi-transparent overlay
      p.fill(255, 0, 0, 150); // Red with transparency
      p.rect(0, 0, p.width, p.height);

      // Draw lose text
      p.textSize(96); // Larger text
      p.fill(255); // White text
      p.textAlign(p.CENTER, p.CENTER);
      p.text('You Lose!', p.width / 2, p.height / 2);
    }

    // Display Player Health (Health Bar) at the top
    let healthBarX = 10; // 10 pixels from the left
    let healthBarY = 10; // 10 pixels from the top
    let healthBarWidth = p.width - 20; // Full width minus padding
    let currentHealthBarHeight = healthBarHeight - 20; // Use allocated height minus padding
    let healthPercentage = player.health / 100; // Assuming max health is 100

    // Draw health bar background
    p.noStroke();
    p.fill(200); // Gray background
    p.rect(healthBarX, healthBarY, healthBarWidth, currentHealthBarHeight);

    // Draw current health
    p.fill(0, 255, 0); // Green health
    if (player.health < 50) {
        p.fill(255, 255, 0); // Yellow when health is below 50
    }
    if (player.health < 20) {
        p.fill(255, 0, 0); // Red when health is below 20
    }
    p.rect(healthBarX, healthBarY, healthBarWidth * healthPercentage, currentHealthBarHeight);

    // Draw health text on top of the bar
    p.fill(0); // Black text
    p.textSize(16);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`${player.health}`, healthBarX + healthBarWidth / 2, healthBarY + currentHealthBarHeight / 2);


    if (gameState === 'win') {
      p.textSize(64);
      p.fill(0, 255, 0);
      p.text('You Win!', p.width / 2, p.height / 2); // Keep centered on the whole canvas for now
    } else if (gameState === 'lose') {
      p.textSize(64);
      p.fill(255, 0, 0);
      p.text('You Lose!', p.width / 2, p.height / 2); // Keep centered on the whole canvas for now
    }

  }

  p.keyPressed = () => {
    if (gameState === 'playing') {
      // Decrement explosion timers and remove expired explosions
      let explosionsToRemove = [];
      for (let i = 0; i < explosions.length; i++) {
          explosions[i].timer--; // timer is not a p5 property
          if (explosions[i].timer <= 0) {
              explosionsToRemove.push(i);
          }
      }

      // Remove expired explosions (iterate backwards to avoid index issues)
      for (let i = explosionsToRemove.length - 1; i >= 0; i--) {
          explosions.splice(explosionsToRemove[i], 1);
      }

      let moved = false;
      let dx = 0;
      let dy = 0;

      if (p.keyCode === p.LEFT_ARROW) {
        dx = -1;
        moved = true;
      } else if (p.keyCode === p.RIGHT_ARROW) {
        dx = 1;
        moved = true;
      } else if (p.keyCode === p.UP_ARROW) {
        dy = -1;
        moved = true;
      } else if (p.keyCode === p.DOWN_ARROW) {
        dy = 1;
        moved = true;
      } else if (p.keyCode === 32) { // Spacebar to place bomb
          // Check if a bomb already exists at the player's position
          let bombExists = false;
          for(let bomb of bombs) {
              if (bomb.x === player.x && bomb.y === player.y) {
                  bombExists = true;
                  break;
              }
          }
          if (!bombExists) {
               bombs.push(new Bomb(player.x, player.y, bombTimer, cellSize, bombImage, explosionDuration)); // Pass bombImage (extracted frame)
          }
          // Bomb placement doesn't count as a move for opponent turn
          return;
      }


      // If a move key was pressed, attempt to move the player
      if (moved) {
          let movementSuccessful = player.move(dx, dy, gridSizeX, gridSizeY, grid); // Pass gridSizeX and gridSizeY

          if (movementSuccessful) {
              // Decrement bomb timers and explode if necessary
              updateBombs(p); // Pass p instance

              // Check for win condition after player moves
              checkForWin();

              // If not won, move opponents and spawn new ones, and update projectiles
              if (gameState === 'playing') {
                  moveOpponents(p, projectileSpriteSheet); // Pass p instance and projectileSpriteSheet
                  spawnOpponent(p); // Pass p instance
                  checkForLoss(); // Check for loss after opponents and projectiles move
              }
          }
      }
    }
  }

  function updateBombs(p) {
      let bombsToExplode = [];
      for (let i = 0; i < bombs.length; i++) {
          if (bombs[i].update()) { // update does not use p5 functions
              bombsToExplode.push(i); // Mark for explosion
          }
      }

      // Explode bombs (iterate backwards to avoid index issues)
      let affectedCellsFromExplosions = [];
      let newExplosions = [];
      for (let i = bombsToExplode.length - 1; i >= 0; i--) {
          let bomb = bombs[bombsToExplode[i]];
          let explosionResult = bomb.explode(gridSizeX, gridSizeY, grid, player, opponents, p, particles); // Pass gridSizeX and gridSizeY, particles array
          affectedCellsFromExplosions.push(...explosionResult.affectedCells);
          newExplosions.push(...explosionResult.newExplosions);
          bombs.splice(bombsToExplode[i], 1);
      }

      // Add new explosion instances to the global explosions array
      explosions.push(...newExplosions);


      // Remove opponents in affected cells after all bombs have exploded
      if (affectedCellsFromExplosions.length > 0) {
          opponents = opponents.filter(opponent => {
              for (let cell of affectedCellsFromExplosions) {
                  if (opponent.x === cell.x && opponent.y === cell.y) {
                      return false; // Remove opponent if in an affected cell
                  }
              }
              return true; // Keep opponent otherwise
          });
      }
  }


  function moveOpponents(p, projectileImage) {
      let newProjectilesData = [];
      for (let opponent of opponents) {
          let projectileData = opponent.move(gridSizeX, gridSizeY, grid, player, opponents, p); // Pass gridSizeX and gridSizeY
          if (projectileData) {
              newProjectilesData.push(projectileData);
          }
      }
      for (let data of newProjectilesData) {
          projectiles.push(new Projectile(data.x, data.y, data.directionX, data.directionY, cellSize, projectileSpeed, projectileSpriteSheet, p)); // Corrected arguments
      }
  }

  function updateProjectiles(p) {
      let projectilesToRemove = [];
      for (let i = 0; i < projectiles.length; i++) {
          let projectile = projectiles[i];

          let shouldRemove = projectile.update(gridSizeX, gridSizeY, grid, player, p, projectileDamage); // Pass gridSizeX and gridSizeY, projectileDamage
          if (shouldRemove) {
              projectilesToRemove.push(i); // Mark for removal
          }
      }

      // Remove projectiles that collided or went out of bounds (iterate backwards to avoid index issues)
      for (let i = projectilesToRemove.length - 1; i >= 0; i--) {
          projectiles.splice(projectilesToRemove[i], 1);
      }
  }


  function spawnOpponent(p) {
    if (p.random() < spawnChance) {
      let emptyCells = [];
      for (let i = 0; i < gridSizeX; i++) { // Use gridSizeX
        for (let j = 0; j < gridSizeY; j++) { // Use gridSizeY
          // Only consider cells that are empty and not obstacles or exits or player start
          if (grid[i][j] === 'empty' && grid[i][j] !== 'obstacle' && !isExit(i, j) && !(i === player.x && j === player.y)) {
            emptyCells.push({ x: i, y: j });
          }
        }
      }

      if (emptyCells.length > 0) {
        let randomIndex = p.floor(p.random(emptyCells.length));
        let newOpponentPos = emptyCells[randomIndex];

        // Randomly choose enemy type
        let enemyType = p.random() < shooterSpawnChance ? 'shooter' : 'basic';

        opponents.push(new Opponent(newOpponentPos.x, newOpponentPos.y, enemyType, cellSize, basicOpponentImage, shooterOpponentImage)); // Opponent constructor does not use p5 functions directly
        grid[newOpponentPos.x][newOpponentPos.y] = 'opponent'; // Still mark as opponent on grid
      }
    }
  }

  function checkForWin() { // Does not use p5 functions
    for (let exit of exits) {
      if (player.x === exit.x && player.y === exit.y) {
        gameState = 'win';
        break;
      }
    }
  }

  function checkForLoss() { // Does not use p5 functions directly, but calls player.takeDamage which does not use p5 functions
    if (player.health <= 0) {
      gameState = 'lose';
    } else {
        // Check for collision with basic opponents
        // Iterate backwards to safely remove collided opponents
        for (let i = opponents.length - 1; i >= 0; i--) {
            let opponent = opponents[i];
            if (opponent.type === 'basic' && player.x === opponent.x && player.y === opponent.y) { // Corrected player.y
                player.takeDamage(collisionDamage); // Reduce health on collision using player method
                createParticles(particles, cellSize, player.x, player.y, 15, [255, 0, 0], p); // Pass particles array and cellSize

                // Remove the collided opponent
                opponents.splice(i, 1);
                if (player.health <= 0) {
                    gameState = 'lose';
                }
                // No break here, as player could collide with multiple basic enemies in one turn
            }
        }
    }
  }
};

// Function to create particles - needs access to p5 functions
export function createParticles(particles, cellSize, x, y, num, color, p, healthBarHeight) { // Added particles and cellSize parameters and healthBarHeight
    for (let i = 0; i < num; i++) {
        // Adjust particle starting position to account for healthBarHeight
        particles.push(new Particle(p, x * cellSize + cellSize / 2, y * cellSize + cellSize / 2 + healthBarHeight, color, p.random(5, 15), p.random(300, 800))); // Pass p instance and add healthBarHeight
    }
}


// Create a new p5 instance with your sketch
new p5(sketch);
