'use strict';

const permission = document.querySelector('.permission');
const positive = document.querySelector('.positive');
const negative = document.querySelector('.negative');
const error = document.querySelector('.error');

const API_KEY = '9dc488e97d8239b0fabeec683e6d440b';
const RAIN_MARGIN = 4;

async function getData({ url, options = {} }) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error('Error while trying to fetch');
  }

  const data = await response.json();
  return data;
}

function showPanel(panel) {
  hideAllPanels();
  panel.classList.remove('hidden');
}

function hideAllPanels() {
  permission.classList.add('hidden');
  positive.classList.add('hidden');
  negative.classList.add('hidden');
  error.classList.add('hidden');
}

function showPositive({ city, temperature, weather, nextRain }) {
  showPanel(positive);
  const text = positive.querySelector('p');
  text.innerHTML = `
  Ahora mismo hay ${Math.round(temperature)}º C en ${city}, ${weather} y ${
    nextRain > 0 ? `probablemente llueva en ${nextRain} hora(s).` : '<strong>toca agarrar el paraguas</strong>.'
  }`;
}
function showNegative({ city, temperature, weather }) {
  showPanel(negative);
  const text = negative.querySelector('p');
  text.innerHTML = `
  Ahora mismo hay ${Math.round(temperature)}º C en ${city} y parece que <strong>no lloverá</strong> en las próximas ${RAIN_MARGIN} horas.`;
}

async function getWeatherData({ latitude, longitude }) {
  try {
    // pedir estado actual a la API
    const currentWeather = await getData({
      url: `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=es`,
    });

    // pedir prediccion proximas horas a la API

    const nextHours = await getData({
      url: `https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&exclude=current,minutely,daily&appid=${API_KEY}&units=metric&lang=es`,
    });
    // comprobar si va a llover en las proximas RAIN_MARGIN horas

    const nextRain = nextHours.hourly.findIndex((hour) => {
      return hour.weather[0].main === 'Rain';
    });
    // mostral panel correspondiente si llueve o no lllueve

    if (nextRain > -1 && nextRain <= RAIN_MARGIN) {
      // console.log('SI VA A LLOVER');
      showPositive({
        city: currentWeather.name,
        temperature: currentWeather.main.temp,
        weather: currentWeather.weather[0].description,
        nextRain,
      });
    } else {
      // console.log('NO VA A LLOVER');
      showNegative({
        city: currentWeather.name,
        temperature: currentWeather.main.temp,
        weather: currentWeather.weather[0].description,
        nextRain,
      });
    }
  } catch (e) {
    // mostrar panel "error" si da error
    showPanel(error);
  }
}

function getUserLocation() {
  hideAllPanels();
  console.log('Asking for location...');
  navigator.geolocation.getCurrentPosition(
    (location) => {
      const { latitude, longitude } = location.coords;

      getWeatherData({ latitude, longitude });
      localStorage.setItem('permission', 'ok');
    },
    () => {
      console.error('error getting location');
      showPanel(error);
    }
  );
}

function main() {
  if (localStorage.getItem('permission') === 'ok') {
    getUserLocation();
  } else {
    showPanel(permission);
    const permissionButton = permission.querySelector('button');
    permissionButton.onclick = () => {
      getUserLocation();
    };
  }
}

main();
