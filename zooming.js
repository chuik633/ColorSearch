let isDragging = false;
let isZoomed = false;
const tooltip = d3.select('.tooltip')




let cluster_mode = ''

function syncZoom_clusterMode(mode){
    cluster_mode = mode

}

function addZoomFunctionality(svg) {
    const svg_rect = d3.select("svg").node();
    const rect = svg_rect.getBoundingClientRect();
    const leftPosition = rect.left + window.scrollX; 

    console.log("rect", rect);
    svg.on("dblclick", function(event) {
        svg.transition().duration(300).attr("transform", "translate(0, 0) scale(1)");
        isZoomed = false
        tooltip.style("display", 'none')
    });
    let selectionBox = null;
    let startX, startY;
    tooltip.style("pointer-events", "none").style('position', 'absolute')
   
    

    svg.on("mousedown", function(event) {
        if(!isZoomed && cluster_mode =="HSL"){
            const [mouseX, mouseY] = d3.pointer(event);
            startX = mouseX;
            startY = mouseY;
        
            selectionBox = svg.append("rect")
              .attr("class", "selection-box")
              .attr('fill', 'none')
              .attr('stroke', 'black')
              .attr('stroke-width', 0.8)
              .attr("x", startX)
              .attr("y", startY)
              .attr("width", 0)
              .attr("height", 0);
        
            tooltip.style("display", 'flex').text("Drag to select an area to zoom in on")
                    .style('left', `${leftPosition+startX + 5}px`)
                    .style('transform', 'translate(0, 0)')
                    .style('top', `${startY - 15}px`)


            isDragging = true;
        }
     
    });

    function mouseMoveZoom(event){
        if(cluster_mode =="HSL"){
            if (!isDragging) {
                tooltip.style("display", 'none')
                return
            };
            const [mouseX, mouseY] = d3.pointer(event);
        
            const select_width = mouseX - startX;
            const select_height = mouseY - startY;
        
            selectionBox
              .attr("width", Math.abs(select_width))
              .attr("height", Math.abs(select_height))
              .attr("x", select_width < 0 ? mouseX : startX) 
              .attr("y", select_height < 0 ? mouseY : startY);  

        }
      
        
    }



    svg.on("mouseup", function(event) {
        if(cluster_mode =="HSL"){
            if (!isDragging) return;
            const [mouseX, mouseY] = d3.pointer(event);
        
            const x = Math.min(startX, mouseX);
            const y = Math.min(startY, mouseY);
            const select_width = Math.abs(mouseX - startX);
            const select_height = Math.abs(mouseY - startY);
        
            tooltip.style("display", 'flex').text("Press Return to zoom")
                    .style('left', `${leftPosition+x + select_width / 2}px`)
                    .style('transform', 'translate(-50%,0)')
                    .style('top', `${y - 20}px`)
    
    
        
            // Remove the selection box
            isDragging = false;

        }
    
    });
  
    // Listen for the "Return" key press to trigger zoom
    d3.select(window).on("keydown", function(event) {
      if (event.key === "Enter") {
        if (selectionBox) {
          const [startX, startY] = [parseFloat(selectionBox.attr("x")), parseFloat(selectionBox.attr("y"))];
          const select_width = parseFloat(selectionBox.attr("width"));
          const select_height = parseFloat(selectionBox.attr("height"));
  
          zoomToSelection(startX, startY, select_width, select_height);
          isZoomed = true;
          selectionBox.remove();
          tooltip.style("display", 'flex').text("Double click to zoom out")
            .style('left', `${leftPosition+x + select_width / 2}px`)
            .style('transform', 'translate(-50%,0)')
            .style('top', `${y - 20}px`)
         
          
        }
      }
    });
  
    // Function to apply zoom into the selected area
    function zoomToSelection(x, y, width, height) {
      const svgWidth = +svg.attr("width");
      const svgHeight = +svg.attr("height");
  
      const scaleX = svgWidth / width;
      const scaleY = svgHeight / height;
      const scale = Math.min(scaleX, scaleY);  
  
      const translateX = -x * scale + (svgWidth - width * scale) / 2;
      const translateY = -y * scale + (svgHeight - height * scale) / 2;
  

      tooltip.style("display", 'none')
      svg.transition().duration(300)
        .attr("transform", `scale(${scale})`);
    }
    return mouseMoveZoom
  }
  