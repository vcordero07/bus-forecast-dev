//07-24-2017

const apiKeys = {
  MBTA: '1VI-9UmYpE64qhHFmhr1ew',
  WeatherUnderground: '682f91fd7c03e86f',
  DarkSky: '93ee5f3d7542687660862c09d91dbb09',
  gglMaps: 'AIzaSyDca9-UHxjzg6OwiRMbw6nnSLtJBD4ck88', //'AIzaSyBzwpCEKRqw8gXTUZZ1oVuB3TuMG-aCV1Q',
  gglMapsEmbed: 'AIzaSyBGzzJie0PbkgWchsE_sKmKchexe1QMReo',
};

const endPoints = {
  MBTARoutes: 'https://realtime.mbta.com/developer/api/v2/routes',
  MBTABusStop: 'https://realtime.mbta.com/developer/api/v2/stopsbyroute',
  MBTAPredictionsByStop: 'https://realtime.mbta.com/developer/api/v2/predictionsbystop',
  MBTAStopsByLocation: 'https://realtime.mbta.com/developer/api/v2/stopsbylocation',
  MBTARoutesByStop: 'https://realtime.mbta.com/developer/api/v2/routesbystop',
  WeatherUnderground: `https://api.wunderground.com/api/${apiKeys.WeatherUnderground}/conditions/q/`,
  DarkSky: `https://api.darksky.net/forecast/${apiKeys.DarkSky}/`,
  gglMapsGeocode: `https://maps.googleapis.com/maps/api/geocode/json`, //?latlng=40.714224,-73.961452&key=YOUR_API_KEY
};

let busRouteID;
let strLat;
let strLon;
let strStopID;
let busDirection = 0;
let minTime = 0;
let toggleMode;
let geoCity;
let geoState;
let isOutOfState = false;
let busStopName = '';

let MBTAQuery = {
  // route: busRouteID,
  // stop: strStopID,
  // direction: busDirection,
};
let MapsQuery = {
  zoom: 15,
  size: '320x320',
  sensor: false,
};

let geoQuery = {
  key: apiKeys.gglMaps,
};

let getDataFromApi = (searchTerm, query, callback) => {
  query.api_key = apiKeys.MBTA;
  query.format = 'json';
  //console.log('query:', query);
  $.getJSON(searchTerm, query, function(data) {
      displayData(data, callback);
    })
    .fail(function(data) {
      //console.log('error data:', data);
      if (data.status === 404) {
        // $('.error-catch-message').html(`<br><br>${data.responseText}`);
        hideShow(['.stops-title'], []);
        BootstrapDialog.show({
          title: 'Ohoh - 404 MBTA Error:',
          message: `${data.responseText}<br><br>
          It looks like that bus is not working. Please try again later.`,
          type: BootstrapDialog.TYPE_WARNING,
          buttons: [{
            label: 'Close',
            action: function(dialogRef) {
              dialogRef.close();
            }
          }]
        });
      }
    });
};

let getWUDataFromApi = (searchTerm, lat, lon, callback) => {
  $.ajax({
      url: `${searchTerm}${lat},${lon}.json`,
      method: 'GET'
    })
    .done(function(data) {
      displayData(data, callback);
    })
    .fail(function(data) {
      //console.log('error data:', data);
      if (data.status === 404) {
        //$('.error-catch-message').html(`<br><br>${data.responseText}`);
        hideShow(['.stops-title'], []);
        BootstrapDialog.show({
          title: 'Ohoh - 404 WeatherUnderground Error:',
          message: `${data.responseText}`,
          type: BootstrapDialog.TYPE_WARNING,
          buttons: [{
            label: 'Close',
            action: function(dialogRef) {
              dialogRef.close();
            }
          }]
        });
      }
    });
};

let getDKDataFromApi = (searchTerm, lat, lon, callback) => {
  $.ajax({
      url: `${searchTerm}${lat},${lon}`,
      dataType: 'jsonp',
      method: 'GET'
    })
    .done(function(data) {
      displayData(data, callback);
    })
    .fail(function(data) {
      //console.log('error data:', data);
      if (data.status === 404) {
        //$('.error-catch-message').html(`<br><br>${data.responseText}`);
        hideShow(['.stops-title'], []);
        BootstrapDialog.show({
          title: 'Ohoh - 404 DarkSky Error:',
          message: `${data.responseText}`,
          type: BootstrapDialog.TYPE_WARNING,
          buttons: [{
            label: 'Close',
            action: function(dialogRef) {
              dialogRef.close();
            }
          }]
        });
      }
    });
};
let getScreenWidth = () => {
  // console.log('$(window).width():', $(window).width());
  if ($(window).width() < 400) {
    // console.log('345:', 345);
    return 345;
  } else if ($(window).width() > 961) {
    // console.log('600:', 600);
    return 600;
  } else {
    // console.log('400:', 400);
    return 400;
  }
};

let getMapsData = (lat, lon, RoutesMap = null, RoutesPath = null) => {
  //console.log('lat, lon:', lat, lon);
  let mapElement;
  let paddingLeft = getScreenWidth();
  let imgWidth = getScreenWidth();
  let imgHeight = ($(window).width() < 400) ? 320 : 600;
  // console.log('busDirection:', busDirection);
  // console.log('(busDirection === 0):', (busDirection === '0'));
  let routeDirection = (busDirection === '0') ? 'Outbound' : 'Inbound';
  if (RoutesMap) {
    if (toggleMode === 'nearby') {
      resultElement = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}${RoutesMap}&style=feature:poi|visibility:off&size=${imgWidth}x${imgHeight}&sensor=false&key=AIzaSyDca9-UHxjzg6OwiRMbw6nnSLtJBD4ck88`;
      $('.route-map').html(`
      <div class="map-title"><h5>Nearby Map</h5></div>
      <img id="nearby-static-map" data-padding-left="${paddingLeft}" src = "${resultElement}" alt = "Nearby Map ${lat}, ${lon}" height="${imgHeight}" width="${imgWidth}" >
      `);
    } else if (toggleMode === 'routes') {
      resultElement = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&path=color:0xff0000ff|weight:1${RoutesPath}${RoutesMap}&style=feature:poi|visibility:off&size=${imgWidth}x${imgHeight}&sensor=false&key=AIzaSyDca9-UHxjzg6OwiRMbw6nnSLtJBD4ck88`;
      $('.route-map').html(`
      <div class="map-title"><h5>Route ${routeDirection} Map</h5></div>
      <img id="route-static-map" data-padding-left="${paddingLeft}" src = "${resultElement}" alt = "Route Map ${lat}, ${lon}" height="${imgHeight}" width="${imgWidth}" >
      `);
    }
  } else {
    resultElement = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&markers=size:mid%7Ccolor:0xff0000|${lat},${lon}&style=feature:poi|visibility:off&size=${imgWidth}x${imgHeight}&sensor=false&key=AIzaSyDca9-UHxjzg6OwiRMbw6nnSLtJBD4ck88`;
    $('.map-stop-location').html(`
    <div class="map-title"><h5>${busStopName} Map</h5></div>
    <img id="static-map" data-padding-left="${paddingLeft}" src = "${resultElement}" alt = "Bus Stop Map ${lat}, ${lon}" height="${imgHeight}" width="${imgWidth}" >
    `);
  }
  // console.log(($(window).width() < 400));
  if (getScreenWidth() < 400) {
    $('.map-title').removeClass('screen-width lg-screen-width').addClass('sm-screen-width');
    $('.stops-title').removeClass('screen-width lg-screen-width').addClass('sm-screen-width');
    $('.list-group').removeClass('screen-width lg-screen-width').addClass('sm-screen-width');
  } else if ($(window).width() >= 961) {
    $('.map-title').removeClass('sm-screen-width screen-width').addClass('lg-screen-width');
    $('.stops-title').removeClass('sm-screen-width screen-width').addClass('lg-screen-width');
    $('.list-group').removeClass('sm-screen-width screen-width').addClass('lg-screen-width');
  } else {
    $('.map-title').removeClass('sm-screen-width lg-screen-width').addClass('screen-width');
    $('.stops-title').removeClass('sm-screen-width lg-screen-width').addClass('screen-width');
    $('.list-group').removeClass('sm-screen-width lg-screen-width').addClass('screen-width');
  }
}

let getCurrentTime = () => {
  let time = new Date();
  let hours = time.getHours() > 12 ? time.getHours() - 12 : time.getHours();
  let am_pm = time.getHours() >= 12 ? "PM" : "AM";
  hours = hours < 10 ? "0" + hours : hours;
  let minutes = time.getMinutes() < 10 ? "0" + time.getMinutes() : time.getMinutes();
  let seconds = time.getSeconds() < 10 ? "0" + time.getSeconds() : time.getSeconds();

  time = hours + ":" + minutes + ":" + seconds + " " + am_pm;
  return time;
};

let generateRoutesData = (data) => {
  resultElement = '';
  //data.mode = 3 is bus
  data.mode[3].route.forEach(item => {
    if (!item.hasOwnProperty('route_hide')) {
      resultElement += `<option value="${item.route_id}">${item.route_name}</option>`;
    }
  });
  $('.selectpicker').append(resultElement);
  $('.selectpicker').selectpicker({});
};

let generateBusStopData = (data) => {
  let imgMarkerStr = "";
  let imgMarkerPath = "";
  // hideShow([], ['.route-map-container']);

  resultElement = '';
  data.direction[busDirection].stop.forEach(item => {
    resultElement += `
    <li class='list-group-item'
    data-lat='${item.stop_lat}'
    data-lon='${item.stop_lon}'
    data-stopid='${item.stop_id}'
    data-busname='${item.stop_name}'
    ><a href='#'>${item.stop_name}</a></li>
    `;
    imgMarkerStr += `&markers=size:tiny%7Ccolor:0xff0000|${item.stop_lat},${item.stop_lon}`;
    imgMarkerPath += `|${item.stop_lat},${item.stop_lon}`;
  });
  $('.bus-stop-list').html(resultElement);

  let centerStop = imgMarkerPath.split('|');
  centerStop = centerStop[Math.round(centerStop.length / 2)].split(',');
  getMapsData(centerStop[0], centerStop[1], imgMarkerStr, imgMarkerPath);
};

let generatePreditionsByStopData = (data) => {
  resultElement = '';
  let validTime = '';
  let errorMsg = '';
  minTime = 0;
  //if there is not mode available for this route then display this message
  if (!data.hasOwnProperty('mode')) {
    errorMsg = 'No predictions available for this bus stop at this time 1.';
    $('.error-msg').html(errorMsg);
    return;
  }

  if (busRouteID.constructor === Array) {
    //console.log('busRouteID.constructor = true');
    //console.log('busDirection:', busDirection);
    for (let x = 0; x < busRouteID.length; x++) {
      //if there is data display pass
      for (let i = 0; i < data.mode[0].route.length; i++) {
        if (data.mode[0].route[i].route_id === busRouteID[x]) {
          let currentTime = new Date();
          validTime = `<h6>Valid as of ${getCurrentTime()}</h6>`;
          //console.log("data.mode.route", data.mode[0].route[i]);
          //use this to get only the most current predictions
          //recursiveIteration(data.mode[0].route[i])
          $('.next-bus-predictions').append(`<div class="bus-grid-time-item smallb">Route ${busRouteID[x]}:</div>` + data.mode[0].route[i].direction[0].trip.map(function(item) {
            minTime = Math.round(item.pre_away / 60);
            resultElement = `<div class="bus-grid-time-item small">${minTime}<h6>min</h6></div>`;
            return resultElement;
          }).toString().replace(',', ' ') + '<br>');

          $('.bus-valid-time').html(validTime);
          break;
        } else {
          errorMsg = 'No predictions available for this bus stop at this time 2.'
          $('.error-msg').html(errorMsg);
        }
      }
    }
  } else {
    //console.log('busRouteID.constructor = false');
    //if there is data display pass
    for (let i = 0; i < data.mode[0].route.length; i++) {
      if (data.mode[0].route[i].route_id === busRouteID) {
        let currentTime = new Date();
        validTime = `<h6>Valid as of ${getCurrentTime()}</h6>`;
        //console.log("data.mode.route", data.mode[0].route[i]);
        //use this to get only the most current predictions
        //recursiveIteration(data.mode[0].route[i])
        //use this to get all the predictions
        data.mode[0].route[i].direction[0].trip.forEach(item => {
          //console.log('itemForEach:', Math.round(item.pre_away / 60));
          minTime = Math.round(item.pre_away / 60)
          resultElement = `<div class="bus-grid-time-item small">${minTime}<h6>min</h6></div>`;
          $('.next-bus-predictions').append(resultElement);
        });

        $('.bus-valid-time').html(validTime);
        break;
      } else {
        errorMsg = 'No predictions available for this bus stop at this time 2.'
        $('.error-msg').html(errorMsg);
      }
    }
  }
};

let generateWeatherUndergroundData = (data) => {
  resultElement = "";

  resultElement = `<p
  data-forecasturl='${data.current_observation.forecast_url}'
  data-icon='${data.current_observation.icon}'
  data-iconurl='${data.current_observation.icon_url}'
  data-tempf='${data.current_observation.temp_f}'
  data-weather='${data.current_observation.weather}'>
  Current Weather: ${data.current_observation.weather} <br/>
  Current Temp:${data.current_observation.temp_f} <br/>
  </p>`;
};

let generateWeatherBgSwithcer = (data) => {
  if (data.currently.temperature >= 100) {
    //console.log('#C0392D', data.currently.temperature);
    $('body').css("background-color", "#C0392D");
  } else if (data.currently.temperature >= 90 && data.currently.temperature < 100) {
    //console.log('#D35400', data.currently.temperature);
    $('body').css("background-color", "#D35400");
  } else if (data.currently.temperature >= 80 && data.currently.temperature < 90) {
    //console.log('#E67E22', data.currently.temperature);
    $('body').css("background-color", "#E67E22");
  } else if (data.currently.temperature >= 70 && data.currently.temperature < 80) {
    //console.log('#F39C12', data.currently.temperature);
    $('body').css("background-color", "#F39C12");
  } else if (data.currently.temperature >= 60 && data.currently.temperature < 70) {
    //console.log('#F1C40F', data.currently.temperature);
    $('body').css("background-color", "#F1C40F");
  } else if (data.currently.temperature >= 50 && data.currently.temperature < 60) {
    //console.log('#2ECC71', data.currently.temperature);
    $('body').css("background-color", "#2ECC71");
  } else if (data.currently.temperature >= 40 && data.currently.temperature < 50) {
    //console.log('#27AE60', data.currently.temperature);
    $('body').css("background-color", "#27AE60");
  } else if (data.currently.temperature >= 30 && data.currently.temperature < 40) {
    //console.log('#3498DB', data.currently.temperature);
    $('body').css("background-color", "#3498DB");
  } else if (data.currently.temperature >= 20 && data.currently.temperature < 30) {
    //console.log('#2980D9', data.currently.temperature);
    $('body').css("background-color", "#2980D9");
  } else if (data.currently.temperature >= 10 && data.currently.temperature < 20) {
    //console.log('#9B59B6', data.currently.temperature);
    $('body').css("background-color", "#9B59B6");
  } else if (data.currently.temperature >= 0 && data.currently.temperature < 10) {
    //console.log('#8E44AD', data.currently.temperature);
    $('body').css("background-color", "#8E44AD");
  } else if (data.currently.temperature >= -10 && data.currently.temperature < 0) {
    //console.log('#34495E', data.currently.temperature);
    $('body').css("background-color", "#34495E");
  } else if (data.currently.temperature >= -20 && data.currently.temperature < -10) {
    //console.log('#2C3E50', data.currently.temperature);
    $('body').css("background-color", "#2C3E50");
  } else {
    //console.log('Warning:', "Please don't go outside!");
  };
};

let generateDarkSkyData = (data) => {
  resultElement = "";

  resultElement = `
  <div class='weather-window'
  data-icon='${data.currently.icon}>'
  data-summary='${data.currently.summary}'
  data-time='${data.currently.time}'
  data-temperature='${data.currently.temperature}'>
  <figure class="icons">
    <canvas id="${data.currently.icon}" width="60" height="60">
    </canvas>
  </figure>
  <span><h4>${data.currently.temperature}&#176;</h4> in ${geoCity}</span>
  <h6> {${data.currently.summary}}</h6>
  </div>
  `;
  // generateWeatherBgSwithcer(data);

  $('.weather-message').html(resultElement);
  getSkyIcons(data.currently.icon);
};

let generateGeocodingData = (data) => {
  geoCity = '';

  data.results[0].address_components.forEach(item => {
    if (item.types.hasOwnProperty('0')) {
      if (item.types[0] === 'locality') {
        geoCity = item.long_name;
        //console.log('geoCity:', geoCity);
        // return geoCity;
      };
      if (item.types[0] === 'administrative_area_level_1') {
        geoState = item.short_name;
        //console.log('geoState:', geoState);
        if (geoState !== 'MA') {
          BootstrapDialog.show({
            title: 'Out of the State?',
            message: "Hi, it looks like you are outside of MA, but don't worry here is an example for a nearby location in Cambridge.",
            type: BootstrapDialog.TYPE_WARNING,
            buttons: [{
              label: 'Close',
              action: function(dialogRef) {
                dialogRef.close();
              }
            }]
          });
          //console.log('msg:', "it looks like you are outside of MA, but don't worry here is an example for harvard");
          MBTAQuery.lat = '42.373716';
          MBTAQuery.lon = '-71.100371';
          strLat = '42.373716';
          strLon = '-71.100371';
          // return false;
        }
        getGeoLocation();
      }
    }
  });
};

let generateStopByLocationData = (data) => {
  let imgMarkerStr = '';
  let imgMarkerPath = '';
  resultElement = '';

  data.stop.forEach(item => {
    resultElement += `
    <li class='list-group-item'
    data-lat='${item.stop_lat}'
    data-lon='${item.stop_lon}'
    data-stopid='${item.stop_id}'
    data-busname='${item.stop_name}'
    data-distance='${item.distance}'
    ><a href='#'>${item.stop_name}</a></li>
    `;
    imgMarkerStr += `&markers=size:mid%7Ccolor:0xff0000|${item.stop_lat},${item.stop_lon}`;
    imgMarkerPath += `|${item.stop_lat},${item.stop_lon}`;
  });
  $('.bus-stop-list').html(resultElement);

  let centerStop = imgMarkerPath.split('|');
  centerStop = centerStop[Math.round(centerStop.length / 2)].split(',');
  getMapsData(centerStop[0], centerStop[1], imgMarkerStr, imgMarkerPath);
};

let generateRoutesByStopData = (data) => {
  busRouteID = [];
  data.mode[0].route.forEach(item => {
    busRouteID.push(`${item.route_id}`);
  });
  //console.log('busRouteID:', busRouteID);
};

let displayData = (data, display) => {
  let resultElement;
  switch (display) {

    case 'RoutesData':
      //console.log("displayRoutesData: ", data);
      generateRoutesData(data);
      break;

    case 'BusStopData':
      //console.log('displayBusStopData :', data);
      generateBusStopData(data);
      break;

    case 'PreditionsByStopData':
      //console.log('displayPreditionsByStop data: ', data);
      generatePreditionsByStopData(data);
      break;

    case 'WUData':
      //console.log("displayWUData: ", data);
      generateWeatherUndergroundData(data);
      break;

    case 'DarkSkyData':
      //console.log('DarkSkyData: ', data);
      generateDarkSkyData(data);
      break;

    case 'GeocodingData':
      //console.log('GeocodingData', data);
      generateGeocodingData(data);
      break;

    case 'StopByLocation':
      //console.log('StopByLocationData:', data);
      generateStopByLocationData(data);
      break;

    case 'RoutesByStop':
      //console.log('RoutesByStopData:', data);
      generateRoutesByStopData(data);
      break;
  }
};

let recursiveIteration = (object) => {
  let resultElement;
  // [5, 15, 25]
  for (var property in object) {
    if (object.hasOwnProperty(property)) {
      if (typeof object[property] == "object") {
        recursiveIteration(object[property]);
      } else {
        //found a property which is not an object, check for your conditions here
        if (property === 'pre_away') {
          //console.log('math.min(object[property]) :', object[property]);
          //to display only the next bus
          minTime = (minTime === 0) ? object[property] : Math.min(object[property], minTime);
          //to display all the trips for that specific stop
          //minTime = object[property];
          resultElement = `<h3>${Math.round(minTime / 60)}</h3><h6>min<h6>`;
          $('.next-bus-predictions').html(resultElement);
        }
      }
    }
  }
};

let getBusStopID = event => {
  //console.log(event.currentTarget);
  strLat = event.currentTarget.getAttribute('data-lat');
  strLon = event.currentTarget.getAttribute('data-lon');
  strStopID = event.currentTarget.getAttribute('data-stopid');
  busStopName = event.currentTarget.getAttribute('data-busname');
  MBTAQuery.stop = event.currentTarget.getAttribute('data-stopid');
  getDKDataFromApi(endPoints.DarkSky, strLat, strLon, 'DarkSkyData');

  if (toggleMode === 'routes') {
    MBTAQuery.direction = busDirection;
  } else {
    getDataFromApi(endPoints.MBTARoutesByStop, MBTAQuery, 'RoutesByStop');
  };

  geoQuery.latlng = `${strLat}, ${strLon}`;
  getDataFromApi(endPoints.gglMapsGeocode, geoQuery, 'GeocodingData');
  getDataFromApi(endPoints.MBTAPredictionsByStop, MBTAQuery, 'PreditionsByStopData');
  getMapsData(strLat, strLon);
};

let getSkyIcons = (event) => {
  let keyEvent = event.toUpperCase().replace(/-/g, '_')
  let icons = new Skycons({
    'color': 'black'
  });

  icons.set(event, Skycons[keyEvent]);
  icons.play();
};

let getBusDirection = event => {
  if ($('select').val() === "") {
    hideShow(['.stops-title'], [])
    BootstrapDialog.show({
      title: 'Warning',
      message: 'Please select a route.',
      type: BootstrapDialog.TYPE_WARNING,
      buttons: [{
        label: 'Close',
        action: function(dialogRef) {
          dialogRef.close();
        }
      }]
    });
    // $('.error-catch-message').html('<br><br><p>Please select a route.</p>');
  } else {
    // getClearMSG('all');
    // console.log('event:', event);
    // console.log('$(select)', $('select'));
    // console.log('$(select)', $('select')[0].selectedOptions[0].innerHTML);
    busStopName = '';
    MBTAQuery.route = $('select').val();
    busRouteID = $('select').val();
    busStopName = $('select')[0].selectedOptions[0].innerHTML;
    $('.stops-title').html(`<h5>Route ${busStopName} Stops</h5>`)
    busDirection = $('input:checked').val();
    getDataFromApi(endPoints.MBTABusStop, MBTAQuery, 'BusStopData');
  }
};

let getClearMSG = (options) => {
  switch (options) {
    case 'all':
      $('.bus-stop-list, .bus-valid-time, .error-msg, .next-bus-predictions, .weather-message, .route-map, .map-stop-location, .error-catch-message').html("");
      break;
    case 'msg-only':
      $('.bus-valid-time, .error-msg, .next-bus-predictions, .weather-message, .map-stop-location').html("");
      break;
  }
};

let getLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
  } else {
    $('.error-msg').html("Geolocation is not supported by this browser.");
  }
};

let showPosition = (position) => {
  strLat = position.coords.latitude;
  strLon = position.coords.longitude;
  MBTAQuery.lat = position.coords.latitude;
  MBTAQuery.lon = position.coords.longitude;

  //harvard lat and lon// strLat = '42.373716';// strLon = '-71.100371';// MBTAQuery.lat = '42.373716';// MBTAQuery.lon = '-71.100371';
  //Honolulu, HI, USA//lat = 21.315603//lon = -157.858093
  //SFO lat and lon//lat = 	37.773972//lon =  -122.431297
  //strLat = '37.773972';strLon = '-122.431297';MBTAQuery.lat = '37.773972'; MBTAQuery.lon = '-122.431297';

  geoQuery.latlng = `${strLat}, ${strLon}`;
  getDataFromApi(endPoints.gglMapsGeocode, geoQuery, 'GeocodingData');
};

let getGeoLocation = () => {
  if (!MBTAQuery.lat) {
    return false;
  }
  getDataFromApi(endPoints.MBTAStopsByLocation, MBTAQuery, 'StopByLocation');
  hideShow(['.loading-bar'], ['.cd-container']);
  $('.find-bus-by-route').css('pointer-events', 'auto');
  MBTAQuery = {};
};

let hideShow = (toHide = [], toShow = []) => {
  toHide.forEach(function(item, indx) {
    $(item).hide()
  });
  toShow.forEach(function(item, indx) {
    $(item).show()
  });
};

let appendContentData = () => {
  return `
      <span class="appended row">
      <section id="bus-weather-info" role="contentinfo">
        <div class="col-sm-12">
          <div class="weather-message"></div>
          <div class="bus-message">
            <div class="next-bus-route-id"></div>
            <div class="next-bus-predictions bus-grid-time"></div>
          </div>
            <div class="bus-valid-time error-msg"></div>
        </div>
      </section>
      </span>
    `;
}

let createEventListeners = () => {
  $('[data-toggle="tooltip"]').tooltip();

  $('.info-btn').on('click', (event) => {
    BootstrapDialog.show({
      title: `<img src="img/bus-forecast-Logo-64.png" alt="Bus Forecast Logo" width="64" height="64"> <div class="logo">Bus<span class="txt-bolder">Forecast</span></div>`,
      message: `Do you live in MA? Do you commute/use the MBTA?
      <br>If yes, there are two things that you need to do before you leave home, check the weather and check when the next bus arrives.
      <br>Bus Forecast achieve these two things. You have two options to search for, by Routes or by Nearby location. Routes provides a list of all the buses available and you can pick the one that you need. Nearby, gives you a list with the nearest 15 bus stops around your location. `,
      type: BootstrapDialog.TYPE_PRIMARY,
      buttons: [{
        label: 'Close',
        action: function(dialogRef) {
          dialogRef.close();
        }
      }]
    });
  });

  $('.find-bus-by-location').on('click', (event) => {
    MBTAQuery = {};
    geoState = null;
    isOutOfState = null;
    getClearMSG('all');
    toggleMode = 'nearby';
    $('.find-bus-by-route').css('pointer-events', 'none');
    hideShow(['.by-route-opts', '.cd-container'], ['.by-location-opts', '.loading-bar']);
    hideShow([], ['.route-map-container']);
    $('.stops-title').html(`<h5>Stops</h5>`)
    getLocation();
  });

  $('.find-bus-by-route').on('click', (event) => {
    MBTAQuery = {};
    $('select').val('default');
    $('select').selectpicker("refresh");
    getClearMSG('all');
    toggleMode = 'routes';
    hideShow(['.by-location-opts', '.cd-container'], ['.by-route-opts']);
    hideShow([], ['.route-map-container']);
  });

  $('.bus-stop-list').on('click', 'li', (event) => {
    if ($(event.currentTarget).hasClass('selected-stop')) {
      $('.appended').remove();
      $(event.currentTarget).closest('li').siblings().show();
      $('li.selected-stop ').removeClass('selected-stop');
      getClearMSG('msg-only');
      hideShow(['.bus-message', '#bus-weather-info', '.map-stop-location'], ['.direction-opt, .route-map']);
      return;
    }
    getClearMSG('msg-only');

    $('li.selected-stop ').removeClass('selected-stop ');
    $(event.currentTarget).addClass('selected-stop ');
    $(event.currentTarget).closest('li').siblings().hide();
    hideShow(['.direction-opt, .route-map'], ['.bus-message', '#bus-weather-info', '.map-stop-location']);
    $(event.currentTarget).parent().append(
      appendContentData()
    );

    getBusStopID(event);

    minTime = 0;
    MBTAQuery = {};
  });

  $('.selectpicker, input[type="radio"]').on('change', (event) => {
    getClearMSG('all');
    if (toggleMode === "routes") {
      getBusDirection(event);
      hideShow([], ['.cd-container']);
    }
  });

  $('.options-btn').on('click', (event) => {
    hideShow(['.by-location-opts', '.by-route-opts', '.cd-container', '.bus-message', '#bus-weather-info', '#map-info', '.route-map-container', '.loading-bar'], ['.search-by-opts']);
    hideShow(['.options-btn'], []);
  });

  $(window).resize(event => {
    // console.log('event:', event);
    if (getScreenWidth() < 400) {
      $('.map-title').removeClass('screen-width lg-screen-width').addClass('sm-screen-width');
      $('.stops-title').removeClass('screen-width lg-screen-width').addClass('sm-screen-width');
      $('.list-group').removeClass('screen-width lg-screen-width').addClass('sm-screen-width');
      $('#static-map').attr({
        width: 345,
        height: 320
      });
      $('#route-static-map').attr({
        width: 345,
        height: 320
      });
      $('#nearby-static-map').attr({
        width: 345,
        height: 320
      });
    } else if ($(window).width() >= 961) {
      // console.log('getScreenWidth():', getScreenWidth());
      $('.map-title').removeClass('sm-screen-width screen-width').addClass('lg-screen-width');
      $('.stops-title').removeClass('sm-screen-width screen-width').addClass('lg-screen-width');
      $('.list-group').removeClass('sm-screen-width screen-width').addClass('lg-screen-width');
      $('#static-map').attr({
        width: 600,
        height: 600
      });
      $('#route-static-map').attr({
        width: 600,
        height: 600
      });
      $('#nearby-static-map').attr({
        width: 600,
        height: 600
      });
    } else {
      $('.map-title').removeClass('sm-screen-width lg-screen-width').addClass('screen-width');
      $('.stops-title').removeClass('sm-screen-width lg-screen-width').addClass('screen-width');
      $('.list-group').removeClass('sm-screen-width lg-screen-width').addClass('screen-width');
      $('#static-map').attr({
        width: 400,
        height: 600
      });
      $('#route-static-map').attr({
        width: 400,
        height: 600
      });
      $('#nearby-static-map').attr({
        width: 400,
        height: 600
      });
    }
  });

};

const renderApp = () => {
  hideShow(['.wrapper', 'footer', '.options-btn', '.by-location-opts', '.by-route-opts', '.cd-container', '.bus-message', '#bus-weather-info', '#map-info', '.loading-bar'], [])
  getDataFromApi(endPoints.MBTARoutes, MBTAQuery, 'RoutesData');
  createEventListeners();
  hideShow([], ['.wrapper', '.footer']);
};

$(document).ready(renderApp);
