
    <script src="https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=places">
    //Load the Google Maps API v 3.exp (latest expiremental) - most updated and bug free
    </script>

    <script>


//The actual javascript code

//Google Maps API documentation
//https://developers.google.com/maps/documentation/javascript/3.exp/reference

//Google Maps examples on Places API
//https://developers.google.com/maps/documentation/javascript/examples/place-search

//General overview of Places API
//https://developers.google.com/places/
//https://developers.google.com/maps/documentation/javascript/places


var REQUEST_DELAY = 150;

var placeService;        // PlaceService object that retreaves the data
var tempArray = [];      // array of places without url
var placesArray = [];    // places in this array have all information about them

var i = 0;

//user location
var userLat;
var userLng;

//arrays to be put into the table
var picList = [];
var nameList = [];
var distList = [];
var urlList = [];


//reload_js('https://maps.googleapis.com/maps/api/js?key=AIzaSyBBSM5FeS_yf2QU63jtMTYizYfDvFqv55Q&sensor=true');



//function requests new results from the Google
function setMapContents(searchCriteria, lat, lng, canvasName, searchRadius)
{
    v.showLoading();
    
    //	clean up from last update if necessary
    cleanUpLists();

    userLat = lat;
    userLng = lng;

    var centerPoint = new google.maps.LatLng(lat, lng);

    var request = {
	location: centerPoint,
	radius: searchRadius,
	types: [searchCriteria]
    };

    // map is no longer used!
    // in order for this code to work: create hidden field 
    // on any of the SmartPages (or at mapcanvaspage) called htmlDivElement
    if (placeService == null)
	placeService = new google.maps.places.PlacesService(document.getElementById('htmlDivElement'));

    placeService.nearbySearch(request, nearbySearchCallback);
}

function nearbySearchCallback(results, status) {

    if (status == google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
	alert('No results was found for this request.');
	v.hideLoading();
	return;
    }

    if (status != google.maps.places.PlacesServiceStatus.OK) {
	alert('nearbySearchCallback error: ' + status);
	v.hideLoading();
	return;
    }

    tempArray = results;
    getNext();
}

function getNext()
{
    var request = {
	placeId: tempArray[i].place_id
    };

    //	10 requests per second is only allowed
    placeService.getDetails(request, getDetailsCallback);

    i++;
}

function getDetailsCallback(place, status) 
{
    if (status == google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
	//alert('getDetailsCallback -> OVER_QUERY_LIMIT');
	populateTable();
	v.hideLoading();
	return;
    }

    if (status != google.maps.places.PlacesServiceStatus.OK) {
	alert('getDetailsCallback error: ' + status);
	v.hideLoading();
	return;
    }

    placesArray.push(place);

    //	check if all data has arrived
    if (placesArray.length == tempArray.length)
    {
	//		code to be executed after all functions returned
	populateTable();
    }


    window.setTimeout(function(){
	getNext();
    }, REQUEST_DELAY);

}

function populateTable()
{
    var distArray = [];
    var indexArray = [];

    //	create distances and index arrays
    for (var i = 0; i < placesArray.length; i++)
    {
	var placeItem = placesArray[i];

	var plLat = placeItem.geometry.location.lat();
	var plLng = placeItem.geometry.location.lng();

	var dist = calculateByCoordinates(userLat, userLng, plLat, plLng);
	addSorted(distArray, indexArray, dist, i);
    }

    //	put all info into pic, name, dist, and url lists
    for (var i = 0; i < indexArray.length; i++)
    {	
	var iIndex = indexArray[i];
	var place = placesArray[iIndex];

	var placeName = '';
	var placeDist = '';
	var placePic = '';
	var placeUrl = '';

	placeName = place.name;
	//		alert(placeName);

	placeDist = distArray[i].toString();
	placeDist = placeDist.substr(0,3) + ' Miles';
	//		alert(placeDist);

	if (place.photos == null)
	    placePic = 'http://www.spokanevalley.org/filestorage/77/NoPhotoIcon2.png';
	else
	    placePic = place.photos[0].getUrl({'maxHeight': 100, 'maxWidth': 100});

	//alert(placePic);

	//		getting place url
	//		https://plus.google.com/113959191560545696997/about
	//		https://plus.google.com/app/basic/113959191560545696997/about?hl=en

	placeUrl = place.url;

	var tempPlaceUrl = placeUrl.replace('plus.google.com', 'plus.google.com/app/basic');
	placeUrl = tempPlaceUrl;

	// uncomment for desktop version
	//placeUrl = placeUrl.concat('&fd=1');

	picList.push(placePic);
	nameList.push(placeName);
	distList.push(placeDist);
	urlList.push(placeUrl);
    }

    //	alert('nameList : ' + nameList.toString());
    //	alert('distList : ' + distList.toString());
    //	alert('picList : ' + picList.toString());
    //	alert('urlList : ' + urlList.toString());
    
    //	link lists with the table form
    v.setFieldArray('PlacePic', picList);
    v.setFieldArray('PlaceName', nameList);
    v.setFieldArray('PlaceDistance', distList);
    v.setFieldArray('PlacePlace', urlList);

    v.hideLoading();
}

function calculateByCoordinates(startLat, startLng, endLat, endLng) 
{
    var myPI = 3.1415;
    var x1 = (startLat * myPI) / 180.0;
    var x2 = (endLat * myPI) / 180.0;
    var y1 = (startLng * myPI) / 180.0;
    var y2 = (endLng * myPI) / 180.0;
    var theta = Math.abs(y1-y2);

    var dist = (Math.sin(x1) * Math.sin(x2)) + (Math.cos(x1) * Math.cos(x2) * Math.cos(theta));
    var centralAngle = Math.acos(dist);

    var radi = 3959.0;
    var valueResult = radi * centralAngle;

    return valueResult;
}

function addSorted(DistancesArray, IndexArray, NewDistD, NewIndexI)
{
    var tempDist = 0.0;
    var tempIndex = 0;
    var nLength = 0;

    DistancesArray.push(NewDistD);
    IndexArray.push(NewIndexI);
    nLength = DistancesArray.length;
    if (nLength > 1)
    {
	for (var iRow = nLength - 1; iRow > 0 ; iRow--) 
	{
	    if(DistancesArray[iRow-1] <= DistancesArray[iRow])
		break;

	    tempDist = DistancesArray[iRow];
	    tempIndex = IndexArray[iRow];
	    DistancesArray[iRow] = DistancesArray[iRow-1];
	    IndexArray[iRow] = IndexArray[iRow-1];
	    DistancesArray[iRow-1] = tempDist;
	    IndexArray[iRow-1] = tempIndex;
	}
    }
}

// not required, but nice to see
function cleanUpLists()
{
    i = 0;

    while (picList.length != 0)
	picList.pop();
    picList = [];

    while (nameList.length != 0)
	nameList.pop();
    nameList = [];

    while (distList.length != 0)
	distList.pop();
    distList = [];

    while (urlList.length != 0)
	urlList.pop();
    urlList = [];

    while (tempArray.length != 0)
	tempArray.pop();
    tempArray = [];

    while (placesArray.length != 0)
	placesArray.pop();
    placesArray = [];

}


function showUrl( url )
{
    var wnd = window.open( url, "location=no,menubar=no,toolbar=yes" );
    wnd.addEventListener('exit', function(ev) { setTimeout( v.setHybridViewFrame, 100 ); });
}  


</script>
