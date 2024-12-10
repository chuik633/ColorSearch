// ------------- DATA-------------
const data = await d3.json('./data/df_colorImage.json')
const clusterData = await d3.json('./data/cluster_info.json')
const location_data = await d3.json('./data/df_location.json')

const dataObject = data.reduce((acc, item) => {
  acc[item.id] = item; 
  return acc;
}, {});
console.log("Data:", data)
console.log("Cluster Info:", clusterData)
console.log('Data with place:', location_data)

const data_placefilter = data.filter(d=>d.place)
const places = new Set(data_placefilter.map(d=>d.place).reduce((acc, curr) => acc.concat(curr), []));




// ------------- GLOBAL CONSTNATS-------------
let cluster_mode = ""
const cluster_options = document.querySelectorAll(
  'input[name="cluster-options"]'
);
for (const cluster_option of cluster_options) {
  cluster_option.addEventListener("change", () => {
    const selected_option = cluster_option.value;
    set_cluster_mode(selected_option);
  });
}

let currentSimulation = null;
const width = window.innerWidth
const height = window.innerHeight
const side_bar_width = Math.max(300, width*.3)

const padding = {
    top: 10,
    bottom: 10,
    left: side_bar_width,
    right: 0,
};
const innerHeight = height - padding.top - padding.bottom;
const innerWidth = width - padding.left - padding.right;
  

// ------------- Containers / svgs------------
const container = d3.select("#test-container")
                    .style("width", `${width}px`)
                    .style("height", `${height}px`);

const popup_container = container.append('div').attr('class', 'popup-container').style("display", 'none')
const side_bar_container = d3.select("#side-panel").style("width", `${side_bar_width}px`)

const color_container = d3.select("#selected-colors-container").style("width", `${side_bar_width-20}px`)
color_container.append("h3").text("your palette")
const swatch_container = d3.select("#selected-swatches-container")
                            .style("width", `${side_bar_width-20}px`)
                            .style("height", `${height/2}px`)
swatch_container.append('h3').text("your swatches")


const svg = container
    .append("svg")
    .attr("viewBox", [0, 0, innerWidth, innerHeight])
    // .attr("transform", `translate(${padding.left}, ${padding.top})`)
    .attr("width", innerWidth)
    .attr("height", innerHeight)
    .attr("class", `color-search-svg`)
    .style("border", "none");
const html_plot_container =container.append('div')
  .attr('class', 'html-plot-container')
  .style("width", `${innerWidth}px`)
  .style("height", `${innerHeight}px`)
  .style('pointer-events', 'none')
  // .style("transform", `translate(${padding.left}, ${padding.top})`)

//blurr filters                       
const filter = svg.append("defs")
    .append("filter")
    .attr("id", "backgroundBlur")
    .append("feGaussianBlur")
    // .attr("in", "SourceGraphic")  // Applies blur to everything behind the circle
    .attr("stdDeviation", 10);   // Adjust the blur strength (higher = more blur)


//rSCale: scale depends on the number
const min_cluster_size = d3.min(Array.from(clusterData.map(d=>d.cluster_size)))
const max_cluster_size = d3.max(Array.from(clusterData.map(d=>d.cluster_size)))
const node_radius = Math.max(Math.min(height, width)/(data.length/2), 3) 
const max_node_radius = Math.max(Math.min(height, width)/(data.length/3), node_radius*2) 
const min_radius =  Math.sqrt( Math.sqrt(max_cluster_size))*(node_radius+3)
const max_radius = Math.sqrt(max_cluster_size)*(node_radius+2)

const rScale = d3.scaleLinear().domain([min_cluster_size, max_cluster_size]).range([min_radius, max_radius])

//xScale:
const min_x = d3.min(Array.from(clusterData.map(d=>d.cluster_x)))
const max_x = d3.max(Array.from(clusterData.map(d=>d.cluster_x)))
const xScale = d3.scaleLinear().domain([min_x, max_x]).range([padding.left,innerWidth - 100])

//yScale
const min_y = d3.min(Array.from(clusterData.map(d=>d.cluster_y)))
const max_y = d3.max(Array.from(clusterData.map(d=>d.cluster_y)))
const yScale = d3.scaleLinear().domain([min_y, max_y]).range([100,innerHeight - 100])

//latitude scale
const min_lat = d3.min(Array.from(location_data.map(d=>d.latitude)))
const max_lat = d3.max(Array.from(location_data.map(d=>d.latitude)))
const latScale = d3.scaleLinear().domain([min_lat, max_lat]).range([padding.left,innerWidth - 100])

//longitudescale
const min_long = d3.min(Array.from(location_data.map(d=>d.longitude)))
const max_long = d3.max(Array.from(location_data.map(d=>d.longitude)))
const longScale = d3.scaleLinear().domain([min_long, max_long]).range([100,innerHeight - 100])

//-----------------------------LAYOUT FUNCTIONS--------------------------------------------------------------------------
////-----------------------------HSL-----------------------------
function getInnerClusterNodes(){
  
  const innerNodes = data.map((d)=>{
    return  { 
      ...d,
      radius: node_radius,
      x: xScale(d.cluster_x),
      y:yScale(d.cluster_y)
  }
  })

  const innerNode = svg.selectAll(".innerNode")
  .data(innerNodes)
  .join(
    // Enter phase: Elements that need to be added
    enter => enter.append("rect")
      .attr("saved-status", '+')
      .attr("width", d => 2 * d.radius)
      .attr("height", d => 2 * d.radius)
      .attr("x", d => d.x)
      .attr('stroke-width', .5)
      .attr("y", d => d.y)
      .attr("fill", d => d.vibrant_color)
      .attr("class", "innerNode")
      .on('mouseover', function(event, d) {
        const saved_status = d3.select(this).attr("saved-status");
        plus.text(saved_status);
        d3.select(this).attr('stroke', 'black');

        if (saved_status == "+") {
          plus.style('display', 'inherit')
            .style("text-anchor", "middle")
            .attr('x', d.x + d.radius)
            .attr('y', d.y + d.radius + 3)
            .attr('fill', 'black');
        } else {
          d3.select(this)
            .attr('stroke', d.vibrant_color)
            .style('opacity', 1)
            .attr('fill', 'none');
        }
      })
      .on('mousedown', function(event, d) {
        const saved_status = d3.select(this).attr("saved-status");
        plus.text(saved_status);
        if (saved_status == "+") {
          d3.select(this).attr('stroke', d.vibrant_color).attr("fill", 'black');
          plus.style('display', 'inherit')
            .style("text-anchor", "middle")
            .style("pointer-events", "none")
            .attr('x', d.x + d.radius)
            .attr('y', d.y + d.radius + 3)
            .attr('fill', 'white');
        }
      })
      .on('click', function(event, d) {
        const saved_status = d3.select(this).attr("saved-status");
        if (saved_status == "+") {
          saveSwatch(d.id);
          d3.select(this).attr("saved-status", "-");
          plus.text('-');
          d3.select(this).attr('stroke', d.vibrant_color).attr("fill", 'none');
        }
      })
      .on('mouseleave', function(event, d) {
        const saved_status = d3.select(this).attr("saved-status");
        if (saved_status == "+") {
          d3.select(this).attr('stroke', d.vibrant_color).attr("fill", d.vibrant_color);
        }
        plus.style('display', 'none');
      }),

    // Update phase: Elements that need to be updated
    update => update
      .attr("width", d => 2 * d.radius)  // Update width
      .attr("height", d => 2 * d.radius)  // Update height
      .attr("x", d => d.x)  // Update x
      .attr("y", d => d.y)  // Update y
  );
    

    const plus = svg.append('text')
        .text("+").attr("class", 'plus-text svg-no-select')
        .style("text-anchor", "top")
        .style('display', 'none')
        .attr('font-size', 12)
        .style("pointer-events", "none");
  return [innerNodes, innerNode]
  

}
function getInnerClusterSim(innerNodes, innerNode){
  const innerSimulation = d3.forceSimulation(innerNodes)
    .force("collision", d3.forceCollide(.01).radius(d => d.radius*1.5))
    .force("x", d3.forceX((d) => d.x).strength(0.01))
    .force("y", d3.forceY((d) => d.y).strength(0.01))
    .force("cluster", forceCluster(.001))
    .alphaDecay(0.05) 
    .on("tick", () => ticked())


  function ticked() {
    innerNode
        .attr("radius", d => d.radius)
        .attr("x", d => Math.max(d.radius, Math.min(innerWidth - d.radius, d.x))) 
        .attr("y", d => Math.max(d.radius, Math.min(innerHeight - d.radius, d.y))); 
  }
  const clusterCenters = clusterData.map((d) => ({
      x: xScale(d.cluster_x), 
      y: yScale(d.cluster_y)             
  }));

  function forceCluster(strength) {
      return (alpha) => {
        innerNodes.forEach(d => {
              const cluster = clusterCenters[d.cluster_num];
              if (!cluster) return;

              const dx = cluster.x - d.x;
              const dy = cluster.y - d.y;

              d.vx += dx * strength * alpha;
              d.vy += dy * strength * alpha;
          });
      };
  }


  function drag(innerSimulation) {
    function dragstarted(event, d) {
      if (!event.active) innerSimulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    } 
    function dragended(event, d) {
      if (!event.active) innerSimulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
  }
  innerNode.call(drag(innerSimulation));



  return innerSimulation

}



function layoutClutersInner(){
  const square_size = node_radius*2 + 2
  const num_rows = innerHeight/square_size
  const num_cols = innerWidth/square_size
  const strokew = .05
  for(let i =0;i<num_rows; i++){
      svg.append('rect').attr('class', 'gridline')
        .attr('x', 0)
        .attr('y', i*square_size)
        .attr('width', innerWidth)
        .attr('height', strokew)
        .attr('fill', "#827A7A")
  }
  for(let i =0;i<num_cols; i++){
    svg.append('rect').attr('class', 'gridline')
      .attr('x', i*square_size)
      .attr('y', 0)
      .attr('width', strokew)
      .attr('height',innerHeight)
      .attr('fill', "#827A7A")
  }

  const mouseZoomFn = addZoomFunctionality(svg)
  const [innerNodes, innerNode] = getInnerClusterNodes()

   let activeNodes = [];
  svg.on("mousemove", (event) => {
    if(isDragging){
      mouseZoomFn(event)

    }else{
      tooltip.style("display", 'none')

    
    let [mouseX, mouseY] = d3.pointer(event);
    for(let d of innerNodes){
      const dx = d.x - mouseX;
      const dy = d.y - mouseY;
      const dist = Math.sqrt(dx ** 2 + dy ** 2);
      if (dist <= 0) {
        d.radius=max_node_radius
      }
      else if (dist >= 50) {
        d.radius=node_radius
        
      }else{
        const radius = max_node_radius - (dist / 50) * (max_node_radius - node_radius);
        d.radius=radius
      }
     
    }

    svg.selectAll(".innerNode")
      .data(innerNodes)
      .attr("width", d => 2 * d.radius)
      .attr("height", d => 2 * d.radius)


    activeNodes = innerNodes.filter((d) => {
      const dx = d.x - mouseX;
      const dy = d.y - mouseY;
      return Math.sqrt(dx ** 2 + dy ** 2) < 100; 
    });


    if (activeNodes.length > 0) {
      currentSimulation=getInnerClusterSim(activeNodes, innerNode);

    }
  }});

  svg.on("mouseout", () => {
    activeNodes = [];
  });


  
  // addMiniMap(svg)

  



}


//Outer clusters
function getOuterClusterNodes(){
  const outerNodes = clusterData.map((d) =>({
    ...d,
    radius: rScale(d.cluster_size),
    x: xScale(d.cluster_x),
    y:yScale(d.cluster_y),
  }))


  const outerNode = html_plot_container.selectAll(".outerNode")
      .data(outerNodes)
      .enter()
      .append("div")
      .attr("class", d => "outerNode cluster-" + d.cluster_num)
      .style("width", d => `${d.radius * 2}px`)
      .style("height", d => `${d.radius * 2}px`)
      // .style("background-color", d => d.average_color)
      .style("left", d => `${d.x - d.radius}px`)
      .style("top", d => `${d.y - d.radius}px`)
      // .style("backdrop-filter", "blur(15.300000190734863px)")
      .style('opacity', .5);
  
  
  return [outerNodes, outerNode]

}
function getOuterClusterSim(outerNodes, outerNode){
  console.log(outerNodes, outerNode)

  const outerSim = d3.forceSimulation(outerNodes)
                    .force("collide", d3.forceCollide().radius(d=>d.radius))
                    .force("x", d3.forceX(d=>d.x).strength(0.01))
                    .force("y", d3.forceY(d=>d.y).strength(0.01))
                    .on('tick', ()=>ticked())

 
  function ticked() {
    outerNode
      .style("left", d => `${Math.max(d.radius, Math.min(window.innerWidth - d.radius, d.x)) - d.radius}px`)
      .style("top", d => `${Math.max(d.radius, Math.min(window.innerHeight - d.radius, d.y)) - d.radius}px`);
  }            

  
}

function layoutClustersOuter(){
  const [outerNodes, outerNode] = getOuterClusterNodes()
  const clusterSim = getOuterClusterSim(outerNodes,outerNode)

}


////-----------------------------LOCATION-----------------------------
function getLocationNodes(innerNodes) {
  // Create or update the existing nodes in the SVG
  const innerNode = svg.selectAll(".innerNode")
    .data(innerNodes)
    .join(
      enter => enter.append("rect")
        .attr("class", "innerNode")
        .attr("saved-status", '+')
        .attr("width", d => 2 * d.radius)
        .attr("height", d => 2 * d.radius)
        .attr("x", d => d.x)
        .attr('stroke-width', .5)
        .attr("y", d => d.y)
        .attr("fill", d => d.vibrant_color)
        .on('mouseover', function (event, d) {
          const saved_status = d3.select(this).attr("saved-status");
          plus.text(saved_status);
          d3.select(this).attr('stroke', 'black');
          if (saved_status == "+") {
            plus.style('display', 'inherit')
              .style("text-anchor", "middle")
              .attr('x', d.x + d.radius)
              .attr('y', d.y + d.radius + 3)
              .attr('fill', 'black');
          } else {
            d3.select(this)
              .attr('stroke', d.vibrant_color)
              .style('opacity', 1)
              .attr('fill', 'none');
          }
        })
        .on('mousedown', function (event, d) {
          const saved_status = d3.select(this).attr("saved-status");
          plus.text(saved_status);
          if (saved_status == "+") {
            d3.select(this).attr('stroke', d.vibrant_color).attr("fill", 'black');
            plus.style('display', 'inherit')
              .style("text-anchor", "middle")
              .style("pointer-events", "none")
              .attr('x', d.x + d.radius)
              .attr('y', d.y + d.radius + 3)
              .attr('fill', 'white');
          }
        })
        .on('click', function (event, d) {
          const saved_status = d3.select(this).attr("saved-status");
          if (saved_status == "+") {
            saveSwatch(d.id);
            d3.select(this).attr("saved-status", "-");
            plus.text('-');
            d3.select(this).attr('stroke', d.vibrant_color).attr("fill", 'none');
          }
        })
        .on('mouseleave', function (event, d) {
          const saved_status = d3.select(this).attr("saved-status");
          if (saved_status == "+") {
            d3.select(this).attr('stroke', d.vibrant_color).attr("fill", d.vibrant_color);
          }
          plus.style('display', 'none');
        }),

      update => update
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .attr('width', d=>d.radius*2)
        .attr('height', d=>d.radius*2)
    );

      const plus = svg.append('text')
        .text("+").attr("class", 'plus-text svg-no-select')
        .style("text-anchor", "top")
        .style('display', 'none')
        .attr('font-size', 12)
        .style("pointer-events", "none");
  return innerNode;
}

function updateLocationSim(innerNodes, innerNode) {
  const innerSimulation = d3.forceSimulation(innerNodes)
    .force("x", d3.forceX((d) => d.x).strength(0.01))
    .force("y", d3.forceY((d) => d.y).strength(0.01))
    .force("collision", d3.forceCollide().radius(d => d.radius*1.5))
    .alphaDecay(0.01)
    .on("tick", () => ticked());

  function ticked() {
    innerNode
      .attr("radius", d => d.radius)
      .attr("x", d => Math.max(d.radius, Math.min(innerWidth - d.radius, d.x)))
      .attr("y", d => Math.max(d.radius, Math.min(innerHeight - d.radius, d.y)));
  }
  innerSimulation.alpha(1).restart();
  return innerSimulation
}

function layoutLocation() {
  const mapContainer = html_plot_container.append('div').attr('class', 'map-container')
    .style('width', innerWidth + 'px')
    .style('height', innerHeight + 'px');

  const mapboxAccessToken = 'pk.eyJ1IjoiY2h1aWs2MzMiLCJhIjoiY20zdGhpbzc1MDh3eTJxcHhvaHN6dGQ1YyJ9.ARosqVuMeqSpdYeSpEsOug';
  const map = L.map(mapContainer.node(), {
    scrollWheelZoom: false,
    maxZoom: 15,
    dragging: true,
    touchZoom: false,
    zoomControl: false,
    doubleClickZoom: false,
    detectRetina: true,
  }).setView([40.7128, -74.0060], 13);

  const tileLayerLink = `https://api.mapbox.com/styles/v1/chuik633/{style_id}/tiles/{z}/{x}/{y}?access_token=${mapboxAccessToken}`;
  const tileLayer = L.tileLayer(tileLayerLink, {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    style_id: "cm4fzik0a01np01qrh26iho9t",
    tileSize: 512,
    zoomOffset: -1,
    maxZoom: 18,
  }).addTo(map);

  map.addLayer(tileLayer);
  var bounds = L.latLngBounds([min_lat, min_long], [max_lat, max_long]);
  map.fitBounds(bounds);

function adjustZoomToFit() {
  const mapContainer = document.querySelector('.map-container');
  const containerWidth = mapContainer.offsetWidth;
  const containerHeight = mapContainer.offsetHeight;
  console.log("conatin", containerWidth,containerHeight)
  const mapAspectRatio = (bounds.getNorth() - bounds.getSouth()) / (bounds.getEast() - bounds.getWest());
  const containerAspectRatio = containerWidth / containerHeight;

  console.log("ratio map v container", mapAspectRatio,containerAspectRatio)
  const zoomLevel = map.getBoundsZoom(bounds);
  let adjustedZoom = zoomLevel;

  if (mapAspectRatio > containerAspectRatio) {
    console.log('wider')
    adjustedZoom = map.getBoundsZoom(bounds, {paddingTopLeft: [0, containerHeight]});
  } else {
    adjustedZoom = map.getBoundsZoom(bounds, {paddingTopLeft: [containerWidth, 0]});
  }
  console.log("adjusted zoome", adjustedZoom)

  map.setView(bounds.getCenter(), adjustedZoom);
}

adjustZoomToFit();

  const innerNodes = location_data.map((d) => {
    const point = map.latLngToContainerPoint([d.latitude, d.longitude]);
    return {
      ...d,
      radius: node_radius,
      x: point.x,
      y: point.y,
      original_x:point.x,
      original_y:point.y,
    };
  });

  let innerNode = getLocationNodes(innerNodes);

  let activeNodes = [];
  svg.on("mousemove", (event) => {
    let [mouseX, mouseY] = d3.pointer(event);
    for(let d of innerNodes){
      const dx = d.x - mouseX;
      const dy = d.y - mouseY;
      const dist = Math.sqrt(dx ** 2 + dy ** 2);
      if (dist <= 0) {
        d.radius=max_node_radius
      }
      else if (dist >= 50) {
        d.radius=node_radius
        
      }else{
        const radius = max_node_radius - (dist / 50) * (max_node_radius - node_radius);
        d.radius=radius
      }
     
    }

    svg.selectAll(".innerNode")
      .data(innerNodes)
      .attr("width", d => 2 * d.radius)
      .attr("height", d => 2 * d.radius)


    activeNodes = innerNodes.filter((d) => {
      const dx = d.x - mouseX;
      const dy = d.y - mouseY;
      return Math.sqrt(dx ** 2 + dy ** 2) < 100; 
    });


    if (activeNodes.length > 0) {
      currentSimulation=updateLocationSim(activeNodes, innerNode);

    }
  });

  svg.on("mouseout", () => {
    activeNodes = [];
  });

  
}



////-----------------------------PARAMETER SETTING-----------------------------
function set_cluster_mode(mode) {
  if (cluster_mode == mode) {
    console.log("nochange");
    return;
  }
  syncZoom_clusterMode(mode)
  console.log("selecting mode", mode);
  cluster_mode = mode;

  updateClusterLayout()
  
}
set_cluster_mode("HSL");



////-----------------------------DRIVING THE LAYOUT-----------------------------
function updateClusterLayout(){
  console.log(currentSimulation)
  if (currentSimulation != null) {
    console.log("STOPPING SIMULATION")
    currentSimulation.stop();
    currentSimulation = null;
  }
  svg.selectAll("*").remove()
  svg.on("mousemove", null)
  html_plot_container.selectAll("*").remove()
  html_plot_container.on("mousemove", null)
  if(cluster_mode == 'HSL'){
    layoutClutersInner()
  }else{

    layoutLocation()
  }
  

}



////-----------------------------SAVING THE SWATCHES-----------------------------
let saved_swatches = []
//TODO: implement
let swatch_x_curr = 20;
let swatch_y_curr = 20;
function saveSwatch(id){
  console.log("saving swatch ", id)
  saved_swatches.push(dataObject[id])
  const data_entry = dataObject[id]
  color_container.append('div')
    .attr('class', 'saved-color')
    .style('width', `${node_radius*2}px`)
    .style('height', `${node_radius*2}px`)
    .style('background-color', data_entry.vibrant_color)

  const swatch_width = 50
  displayImageSwatch(swatch_container,  dataObject[id],swatch_width , swatch_x_curr, swatch_y_curr)
  swatch_x_curr+=swatch_width + 2

  if(swatch_x_curr > side_bar_width-20){
    swatch_x_curr = 0;
    swatch_y_curr += swatch_width*1.5
  }
    
}

const popupSwatchesBtn  = swatch_container.append('div').attr('class', 'button').text('expand')
popupSwatchesBtn.on('click', (event)=>{
  showSwatchCollection(popup_container, saved_swatches)
})


//Chat gpt helper functions to convert between hex and rgb
function hexToRgb(hex) {
  const bigint = parseInt(hex.slice(1), 16); // remove '#' and convert to integer
  const r = (bigint >> 16) & 255; // extract red
  const g = (bigint >> 8) & 255;  // extract green
  const b = bigint & 255;         // extract blue
  return { r, g, b };
}

function rgbToHex(r, g, b) {
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase()}`;
}

// layoutSwatches()

