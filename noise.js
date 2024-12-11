
let circles
function preload() {
    texture = loadImage("textture.jpg")
}

function setup(){
    createCanvas(windowWidth, windowHeight);
    p5grain.setup();
    p5grain.setup({
    ignoreWarnings: true,
    ignoreErrors: true,
  });
  let colors = [
    color(255, 0, 0),     // Red
    color(0, 255, 0),     // Green
    color(0, 0, 255),     // Blue
  ];
     circles = createCirclePack(200,200,100,colors)
}

  

let noiseZoom = .03
let noiseMag = 2

function draw() {
    clear()
    drawCirclePack(circles)
    // stroke('black')
    // applyMonochromaticGrain(2)
   
  }

function createGrainyCircleWithOpacity(x, y, radius, fullcolor) {
fullcolor = color(fullcolor)
no_color = color(red(fullcolor), green(fullcolor), blue(fullcolor),0)
noFill()

for (let r = 1; r < radius; r +=2) {
    const increment =2/(r)
    for (let i = 0; i < TWO_PI; i += increment) {
        let xx = x + cos(i) * r;
        let yy = y + sin(i) * r;

        let inter = map(r, 0, radius, 0, 1);
        let c = lerpColor(fullcolor, no_color, inter);
        
        let r_shift =  noiseMag*noise(r*noiseZoom,frameCount*noiseZoom)


        strokeWeight(.4)
        // fill(c)
        stroke(c);
        ellipse(xx +r_shift, yy+r_shift,4,4); 
    }
}
}



function drawCirclePack(circles){
    console.log('circles', circles)
    for (let i = 0; i < circles.length; i++) {
      fill(circles[i].color);
      noStroke();
      createGrainyCircleWithOpacity(circles[i].x, circles[i].y, 2*circles[i].r, circles[i].color);
    }


}

function createCirclePack(centerx, centery, radius,colors ) {
    let circles = [];
    let numCircles = colors.length;
    let circleRadius =  sqrt((radius * radius) / (numCircles * PI));  

    for (let i = 0; i < numCircles; i++) {
      let placed = false;
      let attempts = 0;
  
      while (!placed && attempts < 20) {
        attempts++;
        
        // Random position within the large circle
        let angle = random(TWO_PI);
        let distance = random(radius - circleRadius); 
        let x = cos(angle) * distance + centerx;
        let y = sin(angle) * distance + centery;
        
        let overlap = false;
        for (let j = 0; j < circles.length; j++) {
          let d = dist(x, y, circles[j].x, circles[j].y);
          if (d < circleRadius*2) {
            overlap = true;
            break;
          }
        }
        if (!overlap || attempts == 10) {
          circles.push({ x: x, y: y, color: colors[i], r: circleRadius/1.5 + random()*circleRadius/2});
          placed = true;
        }
      }
    }
    return circles
}


