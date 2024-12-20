

// const data = await d3.json('../data/df_colorImage.json')
// console.log("loaded data:", data)

function displayImageSwatch(container, entry, image_width, x,y){
    const image_link = entry.image_link
    const swatches = entry.swatches

    //display the image
    const image = new Image();
    image.src = image_link;
    image.onload = function() {
        container.append("img")
            .attr("src", image_link)
            .attr('class', "swatch-image-" + entry.id)
            .style("opacity", 0)
            .style("position", "absolute")
            .style("top", y+"px")
            .style("left", x+'px')
            .style("width", image_width+"px")
            .style('transition', 'opacity 0.5s ease')
            .style("height", "auto");

        //display the swatches
        
        function show_swatch(swatch){
            const padding = image_width/7
            const scaleFactor = image_width /swatch.origional_image_width;
            const swatch_width = swatch.width *scaleFactor - padding*2;
            const swatch_height = swatch.height *scaleFactor -padding*2;
            const swatch_x = swatch.x *scaleFactor + padding;
            const swatch_y = swatch.y *scaleFactor + padding;
            console.log("Swatch", swatch)
            // console.log('swatch_width info', swatch_width, swatch_height,swatch.origional_image_width)
            // console.log('backgroundheight',image_width, scaleFactor)

            container.append("div")
                .attr('class', 'swatch')
                .attr('id', `${entry.id}-${swatch.color.slice(2)}`)
                .style("position", "absolute")
                .style('transition', 'background-color 0.5s ease')
                .style("top", `${y+swatch_y}px`)
                .style("left", `${x+swatch_x}px`)
                .style("width", `${swatch_width}px`)
                .style("height", `${swatch_width}px`)
                // .style('border-radius',`${swatch_width}px`)
                .style("background-image", `url(${image_link})`)
                .style("background-size", `${image_width}px ${image_width * image.naturalHeight/ image.naturalWidth}px`)
                // .style('background-color', swatch.color)
                .style("background-position", `-${swatch_x}px -${swatch_y}px`)
                .style('border', '.8px solid black')
                .style("opacity", 1)
                .on('mouseover',()=>{
                    d3.select(`#${entry.id}-${swatch.color.slice(2)}`)
                        .style('background-color', swatch.color)
                        .style("background-image", `none`)

                    d3.select(".swatch-image-" + entry.id).style("opacity", .3)
                })
                .on('mouseleave',()=>{
                    d3.select(`#${entry.id}-${swatch.color.slice(2)}`)
                        .style('background-color', 'none')
                        .style("background-image", `url(${image_link})`)
                    d3.select(".swatch-image-" + entry.id).style("opacity", .2)
                })
                .on('click', ()=>{
                   const popup_container  = d3.select('.popup-container')
                   showSwatch(popup_container, entry)
                })
        }

        // for(const swatch of swatches){
        //     show_swatch(swatch)
        // }
        // show_swatch(swatches[2])
        console.log(swatches)
        show_swatch(swatches[2])
        // show_swatch(swatches[1])
        // show_swatch(swatches[0])
    }

}

function displaySwatch(container, swatch, swatch_width, swatch_height, image_link){
    const scaleFactor = swatch_width/swatch.width
    let image_width = swatch.origional_image_width*scaleFactor
    const padding = 10
    const swatch_x = swatch.x *scaleFactor + padding;
    const swatch_y = swatch.y *scaleFactor + padding;
    console.log('swatch here', swatch)
    console.log(swatch_width, image_width)
    container.append("div")
                .attr('class', 'swatch')
                .attr('id', `swatch-${swatch.color.slice(2)}`)
                .style("width", `${swatch_width - padding*2}px`)
                .style("height", `${swatch_height - padding*2}px`)
                .style("background-image", `url(${image_link})`)
                .style("background-size", `${image_width}px`)
                .style("background-position", `-${swatch_x}px -${swatch_y}px`)
                .style('border', '.8px solid black')
                .style("opacity", 1)
                .on('mouseover',()=>{
        
                    d3.select(`#swatch-${swatch.color.slice(2)}`)
                        .style('background-color', swatch.color)
                        .style("background-image", `none`)
                })
                .on('mouseleave',()=>{
                    d3.select(`#swatch-${swatch.color.slice(2)}`)
                        .style('background-color', 'none')
                        .style("background-image", `url(${image_link})`)
                })

}



function showSwatchCollection(popup_container, collection_data){
    popup_container.selectAll("*").remove() //clear the pop up
    popup_container.style('display', 'flex')
    popup_container.on('click', ()=>{
        popup_container.selectAll("*").remove()
        popup_container.style('display', 'none')

    })
    const collection_popup = popup_container.append('div').attr('class', 'collection-popup')
    const close_popup = collection_popup.append('div')
                        .text('x').attr('id', 'close_popup')
                        .on('mouseover', ()=> d3.select("#close_popup").style('font-weight','500'))
                        .on('mouseleave', ()=> d3.select("#close_popup").style('font-weight','200'))
                        .on('click', ()=> {
                            popup_container.selectAll("*").remove()
                            popup_container.style('display', 'none')})
    
    
    const swatches_container = collection_popup.append('div').attr('class', 'swatches-container')
    const swatch_width = 100
    const max_swatch_height = 100
    
    for(const selected_entry of collection_data){
        for(const swatch of selected_entry.swatches){
            if (swatch['selected'] == 1 || swatch['selected'] == 0){// display this swatch
                const swatch_height = Math.min(max_swatch_height, swatch.height* swatch_width/swatch.width)
                displaySwatch(swatches_container, swatch, swatch_width, swatch_height, selected_entry.image_link)
                
            }
        }
    }

}

function showColorCollection(popup_container, colors){
    popup_container.selectAll("*").remove() //clear the pop up
    popup_container.style('display', 'flex')
    popup_container.on('click', ()=>{
        popup_container.selectAll("*").remove()
        popup_container.style('display', 'none')

    })
    const color_popup = popup_container.append('div').attr('class', 'color-popup').attr('id', 'canvas-container')
    // appendCanvasToDiv();
    let colors2 = [{x:50,y:50, r:50, color:"red"}]
    new p5((p) => sketch(p, color_popup.node(),colors));
    

}

function showSwatch(popup_container, entry){
    console.log("SHOWING SWATCH", entry)
    popup_container.selectAll("*").remove() //clear the pop up
    popup_container.style('display', 'flex')
    popup_container.on('click', ()=>{
        popup_container.selectAll("*").remove()
        popup_container.style('display', 'none')

    })
    const collection_popup = popup_container.append('div').attr('class', 'swatches-popup')

    const image_container = collection_popup.append('div').attr('class', 'swatches-container')
    const swatch_width = 100
    const max_swatch_height = 100

    for(const swatch of entry.swatches){
        const swatch_height = Math.min(100, swatch.height* swatch_width/swatch.width)
        displaySwatch(image_container, swatch, swatch_width, swatch_height, entry.image_link)
        
    }
    const close_popup = collection_popup.append('div')
                        .text('x').attr('id', 'close_popup')
                        .on('mouseover', ()=> d3.select("#close_popup").style('font-weight','500'))
                        .on('mouseleave', ()=> d3.select("#close_popup").style('font-weight','200'))
                        .on('click', ()=> {
                            popup_container.selectAll("*").remove()
                            popup_container.style('display', 'none')})

    const info_container = collection_popup.append("div").attr("class", "card-info");
    const fields = {
        "title":'title',
         "museum":'data_source',
         "date": 'date_str'
        };
    for (const [field_text, field] of Object.entries(fields)) {
        const field_container = info_container
            .append("div")
            .attr("class", "field-container");

        field_container.append("text").text(field_text).attr("class", "field-label");
    
        field_container
            .append("text")
            .text(entry[field])
            .attr("class", "field-text");
    }       
    
    const field_container = info_container
        .append("div")
        .attr("class", "field-container");

    field_container.append("text").text("Description").attr("class", "field-label");
    field_container
        .append("text")
        .text(entry['notes'][0]['content'])
        .attr("class", "field-text");
        
    const colors_palette = collection_popup
        .append("div")
        .attr("class", "card-colors");
    for (const color of entry.main_color) {
        if (String(color).includes("#")) {
        colors_palette
            .append("div")
            .attr("class", "card-color")
            .style("background", color);
        }
    }

                

}


// // //TESTING
// const width = window.innerWidth
// const height = window.innerHeight


// const container = d3.select("#test-container")
//                     .style("width", `${width}px`)
//                     .style("height", `${height}px`);

// const popup_container = container.append('div').attr('class', 'popup-container')

// const collection_data = [data[0], data[1], data[2],  data[3], data[4], data[5]].map(d=>{
//     console.log(d.swatches)
//     const newd = d
//     newd.swatches[0]['selected'] = 1
//     return newd
// })

// displayImageSwatch(container, data[4], 200,50,300)
// displayImageSwatch(container, data[3], 200,50,100)
// displayImageSwatch(container, data[1], 200,300,100)
// displayImageSwatch(container, data[2], 200,550,100)
// // showSwatchCollection(popup_container, collection_data)