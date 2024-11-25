// put your API key here;
const apiKey = "PU7ZkKg9HqWBxYS6q43M2e1fLhe03LLcuCTRSaPf";  

// Access to terms by term category (I.e. online_media_type > Images)
const termBaseURL = "https://api.si.edu/openaccess/api/v1.0/terms/";

// search base URL
const searchBaseURL = "https://api.si.edu/openaccess/api/v1.0/search";

// array that we will write into
let myArray = [];

// string that will hold the stringified JSON data
let jsonString = '';
let linkIDS = '';
let imageData = {}

//fetch the image info
fetch('imageLinks.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    console.log(data); // Process the JSON data here
    imageData = data
  })
  .catch(error => {
    console.error('There was a problem with the fetch operation:', error);
  });


// search: fetches an array of terms based on term category
async function fetchSearchData(searchTerm) {
  
    let url = searchBaseURL + "?api_key=" + apiKey + "&q=" + searchTerm;
    // console.log(url);
    try{
      const res = await fetch(url);
      const data = await res.json();
      let pageSize = 1000;
      let numberOfQueries = Math.ceil(data.response.rowCount / pageSize);

      //use a list of promises to make sure you get all of the data
      let promises = [];

      for(let i = 0; i < numberOfQueries; i++) {
        // making sure that our last query calls for the exact number of rows
        if (i == (numberOfQueries - 1)) {
          searchAllURL = url + `&start=${i * pageSize}&rows=${data.response.rowCount - (i * pageSize)}`;
        } else {
          searchAllURL = url + `&start=${i * pageSize}&rows=${pageSize}`;
        }
        promises.push(fetchAllData(searchAllURL)); 
      } 
      await Promise.all(promises);
      console.log("Collected the Data... Now saving", myArray.length)
      
      jsonString = JSON.stringify(myArray); 
      console.log(jsonString)

    }
    catch(error) {
      console.log(error);
    }
}

document.getElementById('dwn-btn').addEventListener('click', ()=> download("data.json", jsonString))


async function fetchAllData(url) {

    try{
      const res = await fetch(url);
      const data = await res.json();
      data.response.rows.forEach(addObject);
      console.log(myArray.length)

    }
    catch(error) {
      console.log(error);
    }
}


  // create your own array with just the data you need
const allowedObjectTypes = [
  /.*hat.*/i,
  /.*head.*/i,
  /.*cap.*/i,
  /.*glasses.*/i,
  /.*painting.*/i,
  /.*drawing.*/i,
  /.*wear.*/i,
  /.*accessor.*/i,
  /.*wig.*/i,
  /.*garment.*/i,
  /.*shoe.*/i,
  /.*blazer.*/i,
  /.*trouser.*/i,
  /.*glove.*/i,
  /.*dress.*/i,
  /.*pant.*/i,
  /.*mule.*/i,
  /.*suit.*/i,
  /.*ear.*/i,
  /.*textile.*/i,
  /.*jewel.*/i,
]

function matchObjectTypes(objectTypes) {
  return objectTypes.filter(obj => 
    allowedObjectTypes.some(regex => regex.test(obj))
  );}

function addObject(objectData) {  
    // console.log("OBJECTDATA", objectData)

    const freetext = objectData.content.freetext
    const nonRepeating = objectData.content.descriptiveNonRepeating
    const indexedStructured = objectData.content.indexedStructured

    if(indexedStructured.object_type == undefined){
      return
    }else if(matchObjectTypes(indexedStructured.object_type) == false){
      // console.log('rejecting', indexedStructured.object_type)
      return 
    }


    let image_link = undefined;
    let thumbnail_link = undefined;

    if(nonRepeating.metadata_usage['access'] == 'CC0'){
      try{
        image_link = nonRepeating.online_media.media[0].content
      }catch{
        return
      }
      try{
        thumbnail_link = nonRepeating.online_media.media[0].thumbnail
      } catch{

      }
       
    }

    //only want data with images
    if(image_link ==undefined && thumbnail_link == undefined){
      return
    }

    //get the date
    let date_str = undefined
    let date_num = undefined
    if(indexedStructured.date){
      date_str=indexedStructured.date[0]
      try{
        date_num = parseInt(date_str.split('s')[0])
      }catch{

      }
    }


    let object = {
      //title info
      title: objectData.title,
      id: objectData.id,

      //links to data stuff
      data_source: nonRepeating.data_source,
      record_link: nonRepeating.record_link,
      image_link: image_link,
      thumbnail_link: thumbnail_link,

      //credit, locational info
      date_str:date_str,
      date_num: date_num,
      place: indexedStructured.place,
      object_type: indexedStructured.object_type,
      notes: freetext.notes,
      credits: freetext.creditLine

    }
    myArray.push(object)
    return object
    
    
}
  

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}



// do the search for the fishes
const unitCode = "NMNHFISHES"
const online_media_type = "Images"
const search =  `
            Fashion 

            AND online_media_type:"${online_media_type}"
            `;
fetchSearchData(search);
