let sketch = function(p,parentDiv, circles) {
    console.log("SKETCH CALLED")
    let noiseZoom = 0.03;
    let noiseMag = 2;
  

    p.preload = function() {
      p.texture = p.loadImage("textture.jpg");
    };
  
    p.setup = function() {
        const rect = parentDiv.getBoundingClientRect();
        let width = rect.width;
        let height = rect.height;
        const canvas = p.createCanvas(width, height);
        console.log("CANVAS CREATED")
        canvas.parent(parentDiv);
    };
  
    p.draw = function() {
      p.clear();
      if (circles) {
        drawCirclePack(circles);
      }
    };
  
    function createGrainyCircleWithOpacity(x, y, radius, fullcolor) {
      radius = radius*p.noise(p.frameCount * .008, x*noiseZoom, y*noiseZoom)
      fullcolor = p.color(fullcolor);
      let no_color = p.color(p.red(fullcolor), p.green(fullcolor), p.blue(fullcolor), 0);
      p.noFill();
  
      for (let r = 0; r < radius; r += 1) {
        let inter = p.map(r, 0, radius, 0, 1);
        let c = p.lerpColor(fullcolor, no_color, inter);
        p.strokeWeight(.8);
        p.stroke(c);
        p.ellipse(x,y,r*2,r*2)
      }
    
    }
  
    function drawCirclePack(circles) {
      for (let i = 0; i < circles.length; i++) {
        p.fill(circles[i].color);
        p.noStroke();
        createGrainyCircleWithOpacity(circles[i].x, circles[i].y, 2 * circles[i].r, circles[i].color);
      }
    }
  };
  
 