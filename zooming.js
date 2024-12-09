let isDragging = false;
let isZoomed = false;
function addZoomFunctionality(svg) {
    svg.on("dblclick", function(event) {
        svg.transition().duration(300).attr("transform", "translate(0, 0) scale(1)");
        isZoomed = false
    });
    let selectionBox = null;
    let startX, startY;
   
    let tooltip = null;

    svg.on("mousedown", function(event) {
        if(!isZoomed){
            const [mouseX, mouseY] = d3.pointer(event);
            startX = mouseX;
            startY = mouseY;
        
            selectionBox = svg.append("rect")
              .attr("class", "selection-box")
              .attr('fill', 'none')
              .attr('stroke', 'black')
              .attr('stroke-width', 0.1)
              .attr("x", startX)
              .attr("y", startY)
              .attr("width", 0)
              .attr("height", 0);
        
            // Reset tooltip
            if (tooltip) tooltip.remove();
            tooltip = svg.append("text")
              .attr("class", "tooltip svg-no-select")
              .style("pointer-events", "none")
              .attr("x", startX + 5)
              .attr("y", startY - 5)
              .text("Drag to select an area to zoom in on");
        
            isDragging = true;
        }
     
    });

    function mouseMoveZoom(event){
        if (!isDragging) return;
        const [mouseX, mouseY] = d3.pointer(event);
    
        const select_width = mouseX - startX;
        const select_height = mouseY - startY;
    
        selectionBox
          .attr("width", Math.abs(select_width))
          .attr("height", Math.abs(select_height))
          .attr("x", select_width < 0 ? mouseX : startX)  // Adjust x position based on direction
          .attr("y", select_height < 0 ? mouseY : startY);  // Adjust y position based on direction
        
    }



    // Mouse up event: Stop the drag and show tooltip
    svg.on("mouseup", function(event) {
      if (!isDragging) return;
      const [mouseX, mouseY] = d3.pointer(event);
  
      // Get the selected area (bounding box)
      const x = Math.min(startX, mouseX);
      const y = Math.min(startY, mouseY);
      const select_width = Math.abs(mouseX - startX);
      const select_height = Math.abs(mouseY - startY);
  
      // Remove the tooltip and show instruction
      tooltip.remove();
      tooltip = svg.append("text")
        .attr("class", "tooltip svg-no-select")
        .attr("x", x + select_width / 2)
        .attr("y", y - 10)
        .attr("text-anchor", "middle")
        .style("pointer-events", "none")
        .text("Press Return to zoom");
  
      // Remove the selection box
      isDragging = false;
    });
  
    // Listen for the "Return" key press to trigger zoom
    d3.select(window).on("keydown", function(event) {
      if (event.key === "Enter") {
        // Only zoom if a selection box was made
        if (selectionBox) {
          const [startX, startY] = [parseFloat(selectionBox.attr("x")), parseFloat(selectionBox.attr("y"))];
          const select_width = parseFloat(selectionBox.attr("width"));
          const select_height = parseFloat(selectionBox.attr("height"));
  
          // Zoom into the selected area
          zoomToSelection(startX, startY, select_width, select_height);
          isZoomed = true;
  
          // Remove tooltip and selection box after zoom
          tooltip.remove();
          selectionBox.remove();
        }
      }
    });
  
    // Function to apply zoom into the selected area
    function zoomToSelection(x, y, width, height) {
      const svgWidth = +svg.attr("width");
      const svgHeight = +svg.attr("height");
  
      // Calculate the scale factors to fit the selection in the SVG
      const scaleX = svgWidth / width;
      const scaleY = svgHeight / height;
      const scale = Math.min(scaleX, scaleY);  // Use the smaller scale to fit the area
  
      // Calculate the translation needed to center the selection in the SVG
      const translateX = -x * scale + (svgWidth - width * scale) / 2;
      const translateY = -y * scale + (svgHeight - height * scale) / 2;
  
      // Apply the zoom and translation
      svg.transition().duration(300)
        .attr("transform", `scale(${scale})`);
    }
    return mouseMoveZoom
  }
  