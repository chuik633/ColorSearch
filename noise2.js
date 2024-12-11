let sketch = function(p,parentDiv, circles) {
    let noiseZoom = 0.03;
    let noiseMag = 2;
    let width;
    let height;

    p.preload = function() {
      p.texture = p.loadImage("textture.jpg");
    };
  
    p.setup = function() {
        const rect = parentDiv.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        const canvas = p.createCanvas(width, height);
        canvas.parent(parentDiv);
    };
  
    p.draw = function() {
      p.clear();
      if (circles) {
        drawCirclePack(circles);
        drawGrid(width, height, 3*2+2) 
      }
      
    };
  
    function createGrainyCircleWithOpacity(x, y, radius, fullcolor) {
        let dist_to_moust = p.dist(x,y, p.mouseX, p.mouseY)
        let stepsize = 1
        if(dist_to_moust < 100){
            radius = radius + p.map(dist_to_moust, 0,100,radius,  0)

        }
        if(dist_to_moust<300){
            stepsize = p.map(dist_to_moust, 0,300,1,  2)
        }else{
            stepsize=2
        }
        radius = radius/2 + radius*p.noise(p.frameCount * .008, x*noiseZoom)/2
        fullcolor = p.color(fullcolor);
        let no_color = p.color(p.red(fullcolor), p.green(fullcolor), p.blue(fullcolor), 0);
        p.noFill();

        for (let r = 0; r < radius; r += stepsize) {
            let inter = p.map(r, 0, radius, 0, 1);
            let c = p.lerpColor(fullcolor, no_color, inter);
            p.strokeWeight(stepsize/2);
            p.stroke(c);
            p.ellipse(x,y,r*2,r*2)
        }
    
    }

    function drawGrid(gridWidth, gridHeight, spacing) {
        p.stroke('grey');
        p.strokeWeight(1);
    
        for (let x = 0; x <= gridWidth; x += spacing) {
            for (let y = 0; y <= gridHeight; y += spacing) {
                let mouse_dist = p.dist(x,y,p.mouseX, p.mouseY)
                let n=0
                if(mouse_dist < 100){
                    let mag = p.map(mouse_dist, 0,100,10,0)
                    n = mag*(p.noise(mouse_dist*.05, p.frameCount*.005)-.5)
                }
                p.point(x+n,y+n)

            }

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
  
 