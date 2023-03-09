<template>
  <div></div>
</template>

<script setup>
import useApi from '@/composable/useApi.js';

async function getGeocoding(cityName) {
  const { result, execute } = useApi();
  await execute({
    url: '/geo/1.0/direct',
    params: {
      q: cityName,
      limit: 1,
    },
  });

  const [target] = result.value;
  return {
    lat: target.lat,
    lon: target.lon,
  };
}

async function getWetherForecast(lat, lon) {
  const { result, execute } = useApi();
  await execute({
    url: 'data/2.5/forecast',
    params: {
      lat,
      lon,
      units: 'metric',
    },
  });

  return result;
}

console.log(getGeocoding, getWetherForecast);
function getFourDaysWeatherInfoList(weatherInfoList) {
  const perEightHourInfo = weatherInfoList.filter(
    (weather, index) => index % 8 === 0
  );
  perEightHourInfo.pop();
  return perEightHourInfo;
}

function getMinAndMaxTemperature(weatherInfoList) {
  return weatherInfoList.map((weather) => {
    const {
      main: { temp_min, temp_max },
      dt_txt,
    } = weather;

    const label = dt_txt.split(' ')[0];

    return {
      label,
      min: temp_min,
      max: temp_max,
    };
  });
}

function getHumidity(weatherInfoList) {
  return weatherInfoList.map((weather) => {
    const {
      main: { humidity },
    } = weather;

    return humidity;
  });
}
</script>
<style lang="scss">
@use 'normalize.css/normalize.css';
</style>
