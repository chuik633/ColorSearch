const data = await d3.json('../data/df_colorImage.json')
const clusterData = await d3.json('../data/cluster_info.json')
const dataObject = data.reduce((acc, item) => {
  acc[item.id] = item; 
  return acc;
}, {});

console.log("Data:", data)
console.log("Cluster Info:", clusterData)

const padding = {
    top: 10,
    bottom: 10,
    left: window.innerWidth*.25,
    right: 10,
  };
  
const width = window.innerWidth
const height = window.innerHeight
const innerHeight = height - padding.top - padding.bottom;
const innerWidth = width - padding.left - padding.right;

const container = d3.select("#test-container")
                    .style("width", `${width}px`)
                    .style("height", `${height}px`);

const color_container = d3.select("#selected-colors-container")
const swatch_container = d3.select("#selected-swatches-container")

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
const node_radius = 5
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


//inner clusters
function getInnerClusterNodes(){
  
  const innerNodes = data.map((d)=>{
    return  { 
      ...d,
      radius: node_radius,
      x: xScale(d.cluster_x),
      y:yScale(d.cluster_y)
  }
  })

  const innerNode = svg.selectAll("rect")
        .data(innerNodes)
        .enter()
        .append("rect")
        .attr("saved-status", '+')
        .attr("width", d =>2* d.radius)
        .attr("height", d => 2*d.radius)
        .attr("x", d => d.x)
        .attr('stroke-width',.5)
        .attr("y", d => d.y)
        .attr("fill", d => d.vibrant_color)
        .attr("class", "innerNode")
        .on('mouseover', function(event,d){
          const saved_status =  d3.select(this).attr("saved-status")
          plus.text(saved_status)
          d3.select(this).attr('stroke', 'black')
          if(saved_status == "+"){
            plus.style('display', 'inherit')
            .style("text-anchor", "middle")
            .attr('x', d.x +d.radius)
            .attr('y', d.y+d.radius + 3)
            .attr('fill', 'black')

          }else{
            d3.select(this)
              .attr('stroke', d.vibrant_color)
              .style('opacity',1)
              .attr('fill', 'none')
          }
         
         
        })
        .on('mousedown', function(event,d){
          const saved_status =  d3.select(this).attr("saved-status")
          plus.text(saved_status)
          if(saved_status == "+"){
            d3.select(this).attr('stroke', d.vibrant_color).attr("fill", 'black')
            plus.style('display', 'inherit')
              .style("text-anchor", "middle")
              .style("pointer-events", "none")
              .attr('x', d.x +d.radius)
              .attr('y', d.y+d.radius + 3)
              .attr('fill', 'white')
           
          }
          
        })
        .on('click',function(event,d){
          const saved_status =  d3.select(this).attr("saved-status")
          if(saved_status == "+"){
            saveSwatch(d.id)
            d3.select(this).attr("saved-status", "-")
            plus.text('-')
            d3.select(this).attr('stroke',d.vibrant_color).attr("fill", 'none')
          }
          

        })
        .on('mouseleave', function(event,d){
          const saved_status =  d3.select(this).attr("saved-status")
          if(saved_status == "+"){
            d3.select(this).attr('stroke',d.vibrant_color).attr("fill", d.vibrant_color)
          }
          plus.style('display', 'none')
        
        })
    

    const plus = svg.append('text')
        .text("+").attr("class", 'plus-text')
        .style("text-anchor", "top")
        .style('display', 'none')
        .attr('font-size', 12)
        .style("pointer-events", "none");
  return [innerNodes, innerNode]
  

}
function getInnerClusterSim(innerNodes, innerNode){
  const cluster_nums = Array.from(new Set(clusterData.map(d=>d.cluster_num)))
  const innerSimulation = d3.forceSimulation(innerNodes)
    .force("collision", d3.forceCollide().radius(d => d.radius*3/2))
    .force("cluster", forceCluster(.05))
    .alphaDecay(0.005) 
    .alphaTarget(0.01)
    .on("tick", () => ticked())

  

  function ticked() {
    innerNode
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



}

function layoutClutersInner(){
  const [innerNodes, innerNode] = getInnerClusterNodes()
  const clusterSimInner = getInnerClusterSim(innerNodes, innerNode)

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

//Run things

// layoutClustersOuter()
layoutClutersInner()


container.append("div").attr('class', "text-blur")






//////////////////////////////////////

//TODO: implement
function saveSwatch(id){
  console.log("saving swatch ", id)
  const data_entry = dataObject[id]
  color_container.append('div')
    .attr('class', 'saved-color')
    .style('width', `${node_radius*2}px`)
    .style('height', `${node_radius*2}px`)
    .style('background-color', data_entry.vibrant_color)
    
}


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

