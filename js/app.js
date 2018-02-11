var map;
var bounds;
var largeInfowindow;

//callback function for googleapis
function initMap() {
    largeInfowindow = new google.maps.InfoWindow();
    bounds = new google.maps.LatLngBounds();
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 47.76095, lng: -122.205588},
        zoom: 11,
        mapTypeControl: false
    });
    ko.applyBindings(new ViewModel());
}

var ViewModel = function () {

    var self = this;
    this.searchRestaurant = ko.observable('');
    this.restaurantMapList = ko.observableArray([]);
    this.wikiListArray = ko.observableArray([]);

    locations.forEach(function (location) {
        self.restaurantMapList.push(new RestaurantMarker(location));
    });

    // restaurantLocationList viewed on map
    this.restaurantLocationList = ko.computed(function () {
        var searchRestaurantFilter = self.searchRestaurant().toLowerCase();
        if (!searchRestaurantFilter) {
            return self.restaurantMapList();
        } else {
            return ko.utils.arrayFilter(self.restaurantMapList(), function (location) {
                var match = location.title.toLowerCase().includes(searchRestaurantFilter);
                location.visible(match);
                return match;
            });
        }
    }, this);
};

var RestaurantMarker = function (data) {
    var self = this;
    this.title = data.title;
    this.position = data.location;
    // Style the markers a bit. This will be our listing marker icon.
    var defaultIcon = makeMarkerIcon('0091ff');
    // Foursquare clientID and secret key
    var clientSecret = 'BPD245ZOG4AYW20U10YBJRY0VIRWCC3NPGUDJ3CTBLPTSDRV';
    var clientID = 'PVHG02V5ZQPQBQTDFUP03IYRV3401OPM32FZVIHZIVZVUSFF';
    this.visible = ko.observable(true);

    // Create a marker per location, and put into markers array
    this.marker = new google.maps.Marker({
        map: map,
        position: this.position,
        title: this.title,
        animation: google.maps.Animation.DROP,
        icon: defaultIcon
    });

    self.markersFilter = ko.computed(function () {
        if (self.visible()) {
            self.marker.setMap(map);
        } else {
            self.marker.setMap(null);
        }
    });


    // get JSON request of foursquare data
    var reqURL = 'https://api.foursquare.com/v2/venues/search?ll=' + this.position.lat + ',' + this.position.lng + '&client_id=' + clientID + '&client_secret=' + clientSecret + '&v=20170801' + '&query=' + this.title;

    $.getJSON(reqURL).done(function (data) {
      self.venueDetail =new VenueDetail(data.response.venues[0]);
    }).fail(function () {
        alert('Something went wrong with foursquare');
    });

    // Create an onclick even to open an infowindow at each marker with bounce feature
    this.marker.addListener('click', function () {
        populateInfoWindow(this, self.venueDetail, largeInfowindow);
    });

    // creates bounce effect when item selected
    this.bounce = function (place) {
        google.maps.event.trigger(self.marker, 'click');
    };


    // show item info when selected from list
    this.locationMarkerInfo = function (location) {
        google.maps.event.trigger(self.marker, 'click');
    };
};

var VenueDetail = function (venue){
    this.phone = venue.contact.formattedPhone ? venue.contact.formattedPhone : 'N/A';
    this.street = venue.location.formattedAddress[0] ? venue.location.formattedAddress[0] : 'N/A';
    this.city = venue.location.formattedAddress[1] ? venue.location.formattedAddress[1] : 'N/A';
};

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker,venueDetail, infowindow) {
    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
        // Clear the infowindow content to give the streetview time to load.
        infowindow.setContent('');
        infowindow.marker = marker;
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function () {
            marker.setAnimation(null);
        }, 1400);

        // Make sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener('closeclick', function () {
            infowindow.marker = null;
        });
        var streetViewService = new google.maps.StreetViewService();
        var radius = 50;

        var windowContent = '<h4>' + marker.title + '</h4>' +
            '<p>' + venueDetail.street + "<br>" + venueDetail.city + '<br>' + venueDetail.phone + "</p>";
        // In case the status is OK, which means the pano was found, compute the
        // position of the streetview image, then calculate the heading, then get a
        // panorama from that and set the options
        var getStreetView = function (data, status) {
            if (status == google.maps.StreetViewStatus.OK) {
                var nearStreetViewLocation = data.location.latLng;
                var heading = google.maps.geometry.spherical.computeHeading(
                    nearStreetViewLocation, marker.position);
                infowindow.setContent(windowContent + '<div>' + marker.title + '</div><div id="pano"></div>');
                var panoramaOptions = {
                    position: nearStreetViewLocation,
                    pov: {
                        heading: heading,
                        pitch: 20
                    }
                };
                var panorama = new google.maps.StreetViewPanorama(
                    document.getElementById('pano'), panoramaOptions);
            } else {
                infowindow.setContent('<div>' + marker.title + '</div>' + '<div style="color: red">No Street View Found</div>');
            }
        };
        // Use streetview service to get the closest streetview image within
        // 50 meters of the markers position
        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
        // Open the infowindow on the correct marker.
        infowindow.open(map, marker);
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

// handle map error
function mapError() {
    alert('An error occurred while loading Google Maps!');
}



