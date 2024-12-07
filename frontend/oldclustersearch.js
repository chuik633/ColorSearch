const data = await d3.json('../data/df_colorImage.json')
console.log("loaded data:", data)

const padding = {
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,
  };
  
const width = window.innerWidth
const height = window.innerHeight
const innerHeight = height - padding.top - padding.bottom;
const innerWidth = width - padding.left - padding.right;

const container = d3.select("#test-container")
                    .style("width", `${width}px`)
                    .style("height", `${height}px`);
const svg = container
    .append("svg")
    .attr("viewBox", [0, 0, innerWidth, innerHeight])
    .attr("transform", `translate(${padding.left}, ${padding.top})`)
    .attr("width", innerWidth)
    .attr("height", innerHeight)
    .attr("class", `color-search-svg`)
    .style("border", "none");

function layoutSwatches(){
  const [x_min, x_max] = data[0].cluster_x_range
  const [y_min, y_max] = data[0].cluster_y_range

  //scales
  const xScale = d3.scaleLinear().domain([x_min, x_max]).range([100,innerWidth - 100])
  const yScale = d3.scaleLinear().domain([y_min, y_max]).range([100,innerHeight - 100])

  const radius = 8


  let id_num = 0
  //lay out the nodes without any clustering
  let nodes = data.map((d) => {
    id_num+=1
    return {
      ...d,
      x:xScale(d.cluster_x),
      y:yScale(d.cluster_y),
      radius: radius,
      id: id_num
    }
  })
  //TODO: change the domain to match the actual counts
  const rScale = d3.scaleLinear().domain([0,100]).range([50,120])
  let clusterCounts = d3.rollup(data, v=> v.length, d=>d.cluster_num)
  let clusterPosVals =  d3.rollup(data, v=> {
    const avgColor = v.reduce((acc, cur) => {
      const { r, g, b } = hexToRgb(cur.vibrant_color); // Convert hex to RGB
      acc.r += r;
      acc.g += g;
      acc.b += b;
      return acc;
    }, { r: 0, g: 0, b: 0 });
    const avgHexColor = rgbToHex(
      Math.round(avgColor.r /v.length), 
      Math.round(avgColor.g / v.length), 
      Math.round(avgColor.b / v.length)
    );
  
   return { 
      avg_color: avgHexColor,
      x:v[0].cluster_x,
      y:v[0].cluster_y
    }
  }, d=>d.cluster_num)

  let clusterPosInfo =  Array.from(clusterCounts).map(entry => {
    const cluster_num = entry[0]
    const count = clusterCounts.get(cluster_num)
    return {
      cluster_num: cluster_num,
      avg_color: clusterPosVals.get(cluster_num).avg_color, 
      count: count,
      radius: rScale(count),
      x: xScale(clusterPosVals.get(cluster_num).x),
      y: yScale(clusterPosVals.get(cluster_num).y),
    }
  })

  const sim = d3.forceSimulation(nodes)
      .force('collide', d3.forceCollide(d=>d.radius+1))
      .force("y", d3.forceY(d => d.y).strength(0.05)) 
      .force('charge', d3.forceManyBody().strength(-1))
      .force('x', d3.forceX(d => d.x).strength(0.05))
      // .force("center", d3.forceCenter(width/2, height/2))
      .alpha(1).alphaDecay(0.05).restart()

  const parentSim = d3.forceSimulation(clusterPosInfo)
    .force('collide', d3.forceCollide(d=>d.radius+4))
    .force("y", d3.forceY(d => d.y).strength(0.1)) 
    .force('charge', d3.forceManyBody().strength(0))
    .force('x', d3.forceX(d => d.x).strength(0.1))
    // .force("center", d3.forceCenter(width/2, height/2))
    .alpha(1).alphaDecay(0.05).restart()

  parentSim.on("tick", () => {
    clusterNodes.each(d=>{
      d.x = Math.max(padding.left, Math.min(innerWidth - padding.right, d.x))
      d.y = Math.max(padding.top, Math.min(innerWidth - padding.bottom, d.y))
    })
    clusterNodes
          .attr("cx", d => d.x )
          .attr("r", d => d.radius )
          .attr("cy", d => d.y);
  }); 

  sim.on("tick", () => {
    nodes.forEach(d=>{
      d.x = Math.max(padding.left, Math.min(innerWidth - padding.right, d.x))
      d.y = Math.max(padding.top, Math.min(innerWidth - padding.bottom, d.y))
    })

    node
        .attr("cx", d => d.x )
        .attr("r", d => d.radius )
        .attr("cy", d => d.y);
}); 
  const node = svg.selectAll('.node')
                  .data(nodes)
                  .enter().append('circle')
                  .attr('class', d=> 'swatch' + ` swatch${d.id}`)
                  .attr('r', d=> d.radius)
                  .attr('cy', d=> d.y)
                  .attr('cx', d=> d.x)
                  .style('fill', d=> d.vibrant_color)
                  .on('mouseover',(event,d)=>{
                    d3.selectAll('.swatch').style('stroke', 'none')
                    d3.select(`.swatch${d.id}`)
                        .style('stroke', 'black')
                        .style('fill', 'black')
                  })
                  .on('mouseleave', (event,d)=>{
                  
                    d3.select(`.swatch${d.id}`).style('fill', d.vibrant_color)
                  })
                  .on('click', (event, d)=>{
                    //add the swatch to collection
                    saveSwatch(d.id)
                    
                  })



  
  const clusterNodes = svg.selectAll('.node')
                  .data(clusterPosInfo)
                  .enter().append('circle')
                  .attr('r', d=> d.radius)
                  .attr('class', d=>'cluster cluster-'+d.cluster_num)
                  .attr('cy', d=> d.y)
                  .attr('cx', d=> d.x)
                  .style('stroke', d=> d.avg_color)
                  .style('fill', d=> d.avg_color)
                  // .style('transition', 'fill 1s ease')
                  .on('mouseover', (event,d)=>{
                    d3.select('.cluster-'+d.cluster_num).style('fill', 'none')
                  })

                  .on('click', (event,d)=>{
                    d3.select('.cluster-'+d.cluster_num).style('fill', 'none')
                    sim.restart()
                  })

  

   


}

function saveSwatch(id){
  console.log("saving swatch ", id)

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

layoutSwatches()

