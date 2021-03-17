const gKey = 'AIzaSyCRp2lbrs-v_gZuyA8HJfvw6Ih4XKXCyI4';
const owKey = 'gzBySF4Dg5x2zcSSi7pJ';

let lat;
let lon;
let antLon;
let antLat;

// nav elements
const searchCont = document.querySelector('.search-container');
const navSearch = document.querySelector('#search-bar');
const currLocation = document.querySelector('.map-marker');
const submitBtn = document.querySelector('#search-btn');

// landing page elements
const landingSearch = document.querySelector('#landing-search-bar');
const landingCurrLoc = document.querySelector('.landing-map-marker');
const landingSubmitBtn = document.querySelector('#landing-search-btn');

// results page elements
const antipodeBtn = document.querySelector('#antipdal-btn');
const locationAppendCont = document.querySelector('#location-append');
let titleEl;
// elements for country data from rest countries
const countryName = document.querySelector('.country');
const flag = document.querySelector('.flag');
const timeZone = document.querySelector('.timezone');
const language = document.querySelector('.language');

// pages
const landingPg = document.querySelector('#landing-pg');
const resultsPg = document.querySelector('.results-pg');

// event listeners

// ** nav-bar ** current location icon - get current coordinates
currLocation.addEventListener('click', function () {
  navigator.geolocation.getCurrentPosition(function (position) {
    lat = position.coords.latitude;
    lon = position.coords.longitude;

    clearLocation();
    reverseGeo(lat, lon);

    // toggles visibility for the second page successfully
    if (resultsPg.classList.contains('hide')) {
      resultsPg.classList.remove('hide');
    }
    if (landingPg.classList.contains('hide') === false) {
      landingPg.classList.add('hide');
    }
  });
});

// ** nav-bar ** searched location
submitBtn.addEventListener('click', function (e) {
  e.preventDefault();
  const searchValue = navSearch.value;
  clearLocation();
  searchGeo(searchValue);
  navSearch.value = '';
});

// ** landing page ** current location icon - get current coordinates
landingCurrLoc.addEventListener('click', function () {
  landingPg.classList.add('hide'); // toggles visibility of landing page.
  // **** we need a loading bar or animation like Robert suggested while geolocation pulls the coordinates
  navigator.geolocation.getCurrentPosition(function (position) {
    lat = position.coords.latitude;
    lon = position.coords.longitude;

    clearLocation();
    reverseGeo(lat, lon);

    if (resultsPg.classList.contains('hide')) {
      resultsPg.classList.remove('hide');
    }
    if (searchCont.classList.contains('hide')) {
      searchCont.classList.remove('hide'); // toggles visibility of navbar
    }
  });
});

//  ** landing page ** searched location
landingSubmitBtn.addEventListener('click', function (e) {
  e.preventDefault();
  landingPg.classList.add('hide');

  const searchValue = landingSearch.value;

  clearLocation();
  searchGeo(searchValue);

  if (resultsPg.classList.contains('hide')) {
    resultsPg.classList.remove('hide');
  }
  if (searchCont.classList.contains('hide')) {
    searchCont.classList.remove('hide'); // toggles visibility of navbar
  }
});

// ** results page **
antipodeBtn.addEventListener('click', function () {
  getFromLocalStorage(lat, lon);
  getAntipodes(lat, lon);
  clearLocation();
  reverseGeo(antLat, antLon);
  onWater(antLat, antLon);
});

// functions
// antipodal coordinates
function getAntipodes(x, y) {
  antLat = x * -1;
  if (lon >= 0) {
    antLon = y - 180;
  } else if (lon < 0) {
    antLon = y + 180;
  }
  console.log((180 - y) * -1);
  console.log(antLat, antLon);
}

// fetch api using coordinates - https://developers.google.com/maps/documentation/geocoding/overview#geocoding-requests
async function reverseGeo(x, y) {
  fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${x},${y}&key=${gKey}`
  )
    .then(function (response) {
      if (response.status !== 200) {
        // modal
        console.log('damn');
      } else {
        return response.json().then(function (data) {
          console.log(data);
          if (data.status === 'ZERO_RESULTS') {
            appendLocation('Shit');
            return;
          }

          onWater(x, y).then(function (bool) {
            const isWater = bool;
            console.log(isWater);

            if (!isWater) {
              const addressComp = data.results[0].address_components;

              const locality = addressComp.filter(function (obj) {
                return obj.types.includes('locality');
              })[0]?.long_name;
              const subLocality = addressComp.filter(function (obj) {
                return obj.types.includes('sublocality');
              })[0]?.long_name;
              const adminLvlOne = addressComp.filter(function (obj) {
                return obj.types.includes('administrative_area_level_1');
              })[0]?.long_name;
              const country = addressComp.filter(function (obj) {
                return obj.types.includes('country');
              })[0]?.long_name;

              const countryShort = addressComp.filter(function (obj) {
                return obj.types.includes('country');
              })[0]?.short_name;
              console.log(countryShort);
              getCountries(countryShort);

              let cityEl;

              if (locality) {
                cityEl = locality;
              } else if (subLocality && !locality) {
                cityEl = subLocality;
              }
              appendLocation(cityEl, adminLvlOne, country);
            } else {
              const addressComp = data.results[0].address_components;
              const nature = addressComp.filter(function (obj) {
                return obj.types.includes('natural_feature');
              })[0]?.long_name;
              console.log(nature);
              appendLocation(nature);
            }
          });
          saveToLocalStorage(lat, lon);
          initMap(x, y);
        });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
}

// fetch api for search bar - https://developers.google.com/maps/documentation/geocoding/overview#geocoding-requests
function searchGeo(x) {
  fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${x}&key=${gKey}
  `)
    .then(function (response) {
      if (response.status !== 200) {
        // modal
      } else {
        return response.json().then(function (data) {
          console.log(data);
          const lat = data.results[0].geometry.location.lat;
          const lon = data.results[0].geometry.location.lng;

          if (data.status === 'ZERO_RESULTS') {
            appendLocation('Shit');
            return;
          }

          onWater(lat, lon).then(function (bool) {
            const isWater = bool;
            console.log(isWater);

            if (!isWater) {
              const addressComp = data.results[0].address_components;

              const locality = addressComp.filter(function (obj) {
                return obj.types.includes('locality');
              })[0]?.long_name;
              const subLocality = addressComp.filter(function (obj) {
                return obj.types.includes('sublocality');
              })[0]?.long_name;
              const adminLvlOne = addressComp.filter(function (obj) {
                return obj.types.includes('administrative_area_level_1');
              })[0]?.long_name;
              const country = addressComp.filter(function (obj) {
                return obj.types.includes('country');
              })[0]?.long_name;

              const countryShort = addressComp.filter(function (obj) {
                return obj.types.includes('country');
              })[0]?.short_name;
              console.log(countryShort);
              getCountries(countryShort);

              let cityEl;

              if (locality) {
                cityEl = locality;
              } else if (subLocality && !locality) {
                cityEl = subLocality;
              }
              appendLocation(cityEl, adminLvlOne, country);
            } else {
              const addressComp = data.results[0].address_components;
              const nature = addressComp.filter(function (obj) {
                return obj.types.includes('natural_feature');
              })[0]?.long_name;
              console.log(nature);
              appendLocation(nature);
            }
          });
          console.log(lat, lon);
          saveToLocalStorage(lat, lon);
          initMap(lat, lon);
        });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
}

// map https://developers.google.com/maps/documentation/javascript/overview
function initMap(x, y) {
  if (x && y) {
    document.getElementById('map').innerHTML = '';
    const map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: x, lng: y },
      zoom: 10,
      mapTypeId: 'satellite',
      mapTypeControl: false,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_CENTER,
      },
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.LEFT_CENTER,
      },
      scaleControl: false,
      streetViewControl: false,
      streetViewControlOptions: {
        position: google.maps.ControlPosition.LEFT_TOP,
      },
      fullscreenControl: false,
    });
    map.setTilt(45);
  }
}

// append name of location for map
function appendLocation(x, y, z) {
  titleEl = document.createElement('div');
  titleEl.classList.add('current-location-cont');
  titleEl.innerHTML = `
  <div class="location-header">
  <h2>${x ? x : ''},</h2>
  <h2>${y ? y : ''}</h2>
  </div>
  <h2>${z ? z : ''}</h2>`;
  locationAppendCont.appendChild(titleEl);
  console.log(locationAppendCont.appendChild(titleEl));
}

// clear name of location for map
function clearLocation() {
  if (titleEl) {
    locationAppendCont.removeChild(titleEl);
  }
}

// save selected coordinates to local storage
function saveToLocalStorage(x, y) {
  if (x && y) {
    localStorage.setItem('lat', x);
    localStorage.setItem('lon', y);
  }
}

// get selected coordinates from local storage
function getFromLocalStorage() {
  lat = JSON.parse(localStorage.getItem('lat'));
  lon = JSON.parse(localStorage.getItem('lon'));
}

// on water api - https://onwater.io/ - simply gives a true or false as to whether or not the coordinates are on land. function called when we select the button to view antipodal location. If google doesn't give us anything, this still tells us whether we are on land or water.
function onWater(x, y) {
  return new Promise(function (resolve, reject) {
    fetch(
      `https://api.onwater.io/api/v1/results/${x},${y}?access_token=${owKey}`
    )
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        const water = data.water; // true or false in the json object - can use for conditional logic
        console.log('we are drowning: ' + water);
        resolve(water);
      })
      .catch(function (err) {
        reject(err);
      });
  });
}

// countries data https://restcountries.eu/
function getCountries(x) {
  fetch(`https://restcountries.eu/rest/v2/alpha/${x}`)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      console.log(data);
      countryName.textContent = `${data.name}, ${data.alpha2Code}`;
      flag.src = data.flag;
      data.timezones.forEach(function (element) {
        timeZone.innerHTML = `${element}, `;
        console.log(element);
      });
    })
    .catch(function (err) {
      console.log('Error:', err);
    });
}

// // fetch for fish data
// function getFish() {
//   fetch('https://fishbase.ropensci.org/species?offset=100')
//     .then(function (response) {
//       console.log(response);
//       return response.json();
//     })
//     .then(function (data) {
//       console.log(data);
//     });
// }

// getFish();

// function getNasa(x,y) {
//   fetch(
//     `https://api.nasa.gov/planetary/earth/assets?lon=-${x}&lat=${y}&date=2018-01-01&&dim=0.10&api_key=8nssXB6HM9dQ02LP8ZPLLNxSbtsSIt4hIWisVIVG`
//   )
//     .then(function (response) {
//       return response.json();
//     })
//     .then(function (data) {
//       console.log(data);
//     });
// }
