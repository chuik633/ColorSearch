function setup(){
    createCanvas(windowWidth, windowHeight);
    p5grain.setup();
    p5grain.setup({
    ignoreWarnings: true,
    ignoreErrors: true,
  });
//   frameRate(5)
}

function preload() {
    texture = loadImage("textture.jpg")
}
  
  
function draw(){
    // clear();
    background('black')
    blendMode(BLEND)
    filter(BLUR, 100);
    tint(255, 255, 255, 20);
    image(texture, 0,0, width, height)
    
    noTint();
    // blendMode(BLEND)
    // applyMonochromaticGrain(100);
    // applyChromaticGrain(10)

}