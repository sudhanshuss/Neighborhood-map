var map;
var bounds;
var largeInfowindow;
function initMap(){
    ko.applyBindings(new ViewModel());
}

var ViewModel = function(){

    var self = this;
    largeInfowindow = new google.maps.InfoWindow();
    bounds = new google.maps.LatLngBounds();
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 40.7413549, lng: -73.9980244},
        zoom: 13,
        mapTypeControl: false
    });

    this.searchRestaurant = ko.observable('');
    this.restaurantMapList = ko.observableArray([]);

    locations.forEach(function(location){
        self.restaurantMapList.push(new RestaurantMarker(location))
    });

    // locations viewed on map
    this.locationList = ko.computed(function() {
        var searchFilter = self.searchRestaurant().toLowerCase();
        if (searchFilter) {
            return ko.utils.arrayFilter(self.restaurantMapList(), function(location) {
                var str = location.title.toLowerCase();
                var result = str.includes(searchFilter);
                location.visible(result);
                return result;
            });
        }
        self.restaurantMapList().forEach(function(location) {
            location.visible(true);
        });
        return self.restaurantMapList();
    }, self);
}

var RestaurantMarker = function(data){
    var self = this;
    this.title = data.title;
    this.position = data.location;
    // Style the markers a bit. This will be our listing marker icon.
    var defaultIcon = makeMarkerIcon('0091ff');
    this.visible = ko.observable(true);

    // Create a marker per location, and put into markers array
    this.marker = new google.maps.Marker({
        map: map,
        position: this.position,
        title: this.title,
        animation: google.maps.Animation.DROP,
        icon: defaultIcon
    });

    // Create an onclick even to open an indowindow at each marker
    this.marker.addListener('click', function() {
        populateInfoWindow(this, largeInfowindow);

    });
}

    // This function populates the infowindow when the marker is clicked. We'll only allow
    // one infowindow which will open at the marker that is clicked, and populate based
    // on that markers position.
    function populateInfoWindow(marker, infowindow) {
    // Check to make sure the infowindow is not already opened on this marker.
        if (infowindow.marker != marker) {
            infowindow.marker = marker;
             infowindow.setContent('<div>' + marker.title + '</div>');
             infowindow.open(map, marker);
             // Make sure the marker property is cleared if the infowindow is closed.
              infowindow.addListener('closeclick',function(){
                  infowindow.setMarker = null;
                       });
                       }
               }

// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34));
    return markerImage;
}
