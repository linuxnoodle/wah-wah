var bird = {
  x: -1,
  y: -1,
  y_vel: 0,
  score: 0,
  high_score: 0,
  global_high_score: 0
};
var pipes = [];
var paused = true, start = true, dead = false;

var neroTexture, pillarTexture, backgroundTexture, music;

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
}

function preload(){
  // load assets
  neroTexture = loadImage("nero.png");
  pillarTexture = loadImage("pillar.png");
  backgroundTexture = loadImage("burning.png");
  music = createAudio("funky.opus");
}

// initialization
// ========================================
function setup(){
  frameRate(60);
  createCanvas(windowWidth, windowHeight);
  bird.x = windowWidth/8;
  bird.y = windowHeight/2;

  window.addEventListener("resize", () => {
    resizeCanvas(windowWidth, windowHeight);
  });

  setInterval(() => {
    if (paused) return;
    // pipe top should have a constant gap of 300 pixels
    let bottom = Math.floor(Math.random() * ((windowHeight - 300) - 300) + 300),
        top = windowHeight - bottom - 300;
    pipes.push({
      x: windowWidth,
      top: top,
      bottom: bottom,
      given_point: false
    });
  }, 850);

  // initialize music
  music.loop();
  music.play();

  // show initial instructions
  paused = true;
  textSize(32);
  text("Press space or press to flap", windowWidth/2, windowHeight/2);
}

function draw(){
  // TODO: add fire distortion effect to backgroundTexture
  background(backgroundTexture);

  // draw nero (bird)
  fill(255);
  // rotate image based on velocity
  push();
  translate(bird.x, bird.y);
  rotate(bird.y_vel * 0.1 + 20);
  imageMode(CENTER);
  image(neroTexture, 0, 0, 69, 100);
  pop();

  // draw pipes
  fill(255);
  for (let i = 0; i < pipes.length; ++i){
    // draw pillars instead of rectangles, with the same dimensions, but vertically offset to keep scaling
    image(pillarTexture, pipes[i].x - 25, pipes[i].top - 795, 100, 800);
    image(pillarTexture, pipes[i].x - 25, pipes[i].top + 290, 100, 800);
  }

  // draw score
  textSize(32);
  text("Score: " + bird.score, windowWidth/32, 64);

  // draw menu text
  if (paused){
    if (start){
      // draw background so you can read text
      fill(0, 0, 0, 200);
      rect(0, 0, windowWidth, windowHeight);

      fill(64, 64, 128);
      textSize(32);
      text(`
        nomen tuum est Nero. vos volo effugire ab Rome quia vis music.
        sed, Roma est in flammat! et tu es in flammat! incipire?
        Press space or press to flap, and press escape to pause.
      `, windowWidth/3, 2*windowHeight/5);
    } else if (dead){
      fill(0, 0, 0, 200);
      rect(0, 0, windowWidth, windowHeight);
      
      fill(64, 64, 128);
      textSize(32);
      text(`
        tu mortuus est. tuus summum score est ${bird.high_score}.
        altissimus score in ubique est ${bird.global_high_score}.
        Press space or click to restart.`
        , windowWidth/3, 2*windowHeight/5);
    }
    return;
  } 

  game_update();
}

// updating
// ========================================
function game_update(){
  updateBird();
  updatePipes();
}

function updateBird(){
  // bird physics
  bird.y_vel += 0.5;
  bird.y += bird.y_vel;

  // bird collision detection
  if (bird.y > windowHeight){
    dead = true;
    game_reset();
  }
  
  if (bird.y < 0){
    bird.y = 0;
    bird.y_vel = 0;
  }

  // bird pipe detection
  // only need to check the first pipe as the bird can only be in range of one pipe at a time
  if (pipes.length > 0){
    let y_center = bird.y - 50;
    if ((bird.x + 50) > pipes[0].x && bird.x < pipes[0].x + 50){
      if (y_center < pipes[0].top || y_center + 50 > windowHeight - pipes[0].bottom){
        dead = true;
        game_reset();
      }
    }
  }
}

function updatePipes(){
  if (pipes.length == 0) return;
  
  for (let i = 0; i < pipes.length; ++i){
    pipes[i].x -= 10;
    if (pipes[i].x < -50){
      pipes.splice(i, 1);
    }
  }
  if (pipes.length > 0 && pipes[0].x < bird.x && pipes[0].x + 50 > bird.x && !pipes[0].given_point){
    bird.score++;
    pipes[0].given_point = true;
  }
}

function game_reset(){
  bird.x = windowWidth/8;
  bird.y = windowHeight/2;
  bird.y_vel = 0;
  pipes = [];
  paused = true;
  if (dead){
    bird.high_score = Math.max(bird.high_score, bird.score);
    // send post request to server with score
    // one of you are eventually going to break this and i am going to be miffed >:(
    fetch("/scores", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        score: bird.high_score
      })
    }).then(res => res.json()).then(data => {
      bird.global_high_score = data.score;
    });
  }
  bird.score = 0;
}

// input handling
// ========================================
function flap(){
  bird.y_vel = -12;
}

function keyPressed(){
  if (keyCode == ESCAPE) {
    paused = !paused;
    start = dead = false;
  } else { 
    start = paused = dead = false;
  }

  if (key == ' '){
    flap();
  }
}

function mousePressed(){
  flap();
  start = paused = dead = false;
}
