import citiesRU from './citiesRU.js';

let center = [53.902284, 27.561831];

function init() {
  let map = new ymaps.Map("map", {
    center: center,
    zoom: 7
  });
  map.controls.remove('geolocationControl'); // удаляем геолокацию
  map.controls.remove('trafficControl'); // удаляем контроль трафика
  map.controls.remove('typeSelector'); // удаляем тип
  map.controls.remove('fullscreenControl'); // удаляем кнопку перехода в полноэкранный режим

  let placemark;

  // Слушаем клик на карте.
  map.events.add('click', function (e) {
    let coords = e.get('coords');

    // Если метка уже создана – просто передвигаем ее.
    if (placemark) {
      placemark.geometry.setCoordinates(coords);
    }
    // Если нет – создаем.
    else {
      placemark = createPlacemark(coords);
      map.geoObjects.add(placemark);
      // Слушаем событие окончания перетаскивания на метке.
      placemark.events.add('dragend', function () {
        getAddress(placemark.geometry.getCoordinates());
      });
    }
    getAddress(coords);
  });

  // Создание метки.
  function createPlacemark(coords) {
    return new ymaps.Placemark(coords, {
      iconCaption: 'поиск...'
    }, {
      preset: 'islands#violetDotIconWithCaption',
      draggable: true
    });
  }

  // Определяем адрес по координатам (обратное геокодирование).
  function getAddress(coords) {
    placemark.properties.set('iconCaption', 'поиск...');
    ymaps.geocode(coords).then(function (res) {
      let firstGeoObject = res.geoObjects.get(0);

      placemark.properties
        .set({
          // Формируем строку с данными об объекте.
          iconCaption: [
            // Название населенного пункта или вышестоящее административно-территориальное образование.
            firstGeoObject.getLocalities().length ? firstGeoObject.getLocalities() : firstGeoObject.getAdministrativeAreas(),
          ],
          // В качестве контента балуна задаем строку с населенного пункта.
          balloonContent: firstGeoObject.getLocalities()
        });
      if (firstGeoObject.getLocalities()[0]) {
        let city = firstGeoObject.getLocalities()[0];
        if (city) {
          let radius = $('#radius').val();
          getCityCode(city).then((wikiDataId) => {
            if (wikiDataId != -1)
              getAllData(wikiDataId, radius).then((allData) => {
                console.log(allData);
                drawPath(city, allData, map)
              });
          });
        }
      }
    });
  }
}
ymaps.ready(init);

function getCityCode(city) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: 'https://www.wikidata.org/w/api.php',
      data: {
        action: 'wbgetentities',
        sites: 'ruwiki',
        titles: city,
        format: 'json',
        origin: '*'
      },
      dataType: 'json',
      success: function (data) {
        let wikiDataId = Object.keys(data.entities)[0];
        resolve(wikiDataId);
      },
      error: function (error) {
        reject(error);
      }
    });
  });
}

function findNearCities(url) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: url,
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': '544ab5c1d1msh21eb38ee3d08c9ap1c3972jsn80695f100c3d',
        'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
      },
      success: function (data) {
        resolve(data);
      },
      error: function (error) {
        reject(error);
      }
    });
  });
}

function getAllData(cityCode, radius) {
  let allData = [];
  let i = 1
  function getNextPage(url) {
    return new Promise(resolve => {
      setTimeout(() => {
        findNearCities(url).then((response) => {
          const filteredData = response.data.filter(city => citiesRU.some(cityRU => cityRU.wikiDataId === city.wikiDataId && cityRU.id === city.id));
          allData = allData.concat(filteredData);
          let nextLink;
          if (response.links)
            nextLink = response.links.find(link => link.rel === 'next');
          if (nextLink) {
            resolve(getNextPage(`https://wft-geo-db.p.rapidapi.com${nextLink.href}`));
            console.log(i++)
          } else {
            resolve(allData);
          }
        });
      }, 1500);
    });
  }
  return getNextPage(`https://wft-geo-db.p.rapidapi.com/v1/geo/places/${cityCode}/nearbyPlaces?radius=${radius}&types=CITY&distanceUnit=KM&countryIds=Q184&minPopulation=5000&languageCode=ru`);
}

function drawPath(city, cities, map) {
  let refs = cities.map(city => [city.latitude, city.longitude]);
  refs.unshift(city);
  refs.push(city);
  console.log(refs)
  // Построение маршрута.
  // По умолчанию строится автомобильный маршрут.
  let multiRoute = new ymaps.multiRouter.MultiRoute({
    // Точки маршрута. Точки могут быть заданы как координатами, так и адресом. 
    referencePoints: refs
  }, {
    // Автоматически устанавливать границы карты так,
    // чтобы маршрут был виден целиком.
    boundsAutoApply: true
  });

  // Добавление маршрута на карту.
  map.geoObjects.each(function (geoObject) {
    if (geoObject instanceof ymaps.multiRouter.MultiRoute) {
      map.geoObjects.remove(geoObject);
    }
  });

  map.geoObjects.add(multiRoute);

  //вывод длины пути
  multiRoute.model.events.add('requestsuccess', function () {
    let length = multiRoute.model.getRoutes()[0].properties.get('distance').text;
    $('.distance').html(`<b>Общая протяжённость пути:</b> ${length}`);
    
    let time = multiRoute.model.getRoutes()[0].properties.get('duration').text;
    $('.time').html(`<b>Время, затрачиваемое на путь:</b> ${time}`);
  });

  // вывод городов
  let ctes = `${city} → `;
  let _ctes = cities.map(city => city.name);
  _ctes.forEach(city => {
    ctes += `${city} → `
  })
  ctes += city;
  $('.cities').html(`<b>Путь:</b> ${ctes}`);
}