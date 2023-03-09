<template>
  <div>
    <label for="search">
      <input
        id="search"
        v-model="searchInput"
        type="text"
        @keyup.enter="searchByCityName"
      />
    </label>
    <span v-if="errorHint">{{ errorHint }}</span>
    <BarChart :data="fourDaysTemperature"></BarChart>
    <PieChart
      v-for="(percent, i) in fourDaysHumidity"
      :key="percent.toString() + i"
      :percent="percent"
    ></PieChart>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import useApi from '@/composable/useApi.js';
import PieChart from '@/components/PieChart.vue';
import BarChart from '@/components/BarChart.vue';
import { computed } from 'vue';

const searchInput = ref('');
const fourDaysTemperature = ref([]);
const fourDaysHumidity = ref([]);
const searchError = ref('');
const errorHint = computed(() => {
  const errorMap = {
    noCityFound:
      "Can't find the weather information. Please try other city name.",
    elseError: 'Something wrong! Please try it latter or refresh your browser.',
  };

  return errorMap[searchError.value] || '';
});

async function getGeocoding(cityName) {
  const result = {
    data: {
      lat: '',
      lon: '',
    },
    error: null,
  };

  const { data, error, execute } = useApi();
  await execute({
    url: '/geo/1.0/direct',
    params: {
      q: cityName,
      limit: 1,
    },
  });

  if (error.value) {
    result.data = null;
    result.error = 'elseError';
    searchError.value = 'elseError';

    return result;
  }

  if (data.value.length === 0) {
    result.data = null;
    result.error = 'noCityFound';
    searchError.value = 'noCityFound';

    return result;
  }

  const [target] = data.value;
  result.data.lat = target.lat || '';
  result.data.lon = target.lon || '';

  return result;
}

async function getWetherForecast(lat, lon) {
  const result = {
    data: {
      list: [],
    },
    error: null,
  };
  const { data, error, execute } = useApi();
  await execute({
    url: 'data/2.5/forecast', // Call 5 day / 3 hour forecast data
    params: {
      lat,
      lon,
      units: 'metric',
    },
  });

  if (error.value || !data.value?.list) {
    result.data = null;
    result.error = 'elseError';
    searchError.value = 'elseError';

    return result;
  }

  result.data.list = data.value.list || [];
  return result;
}

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

async function searchByCityName() {
  searchError.value = '';
  fourDaysTemperature.value = [];
  fourDaysHumidity.value = [];
  const { data: geocodingData, error: geocodingError } = await getGeocoding(
    searchInput.value
  );

  if (geocodingError) {
    searchError.value = geocodingError;
    return;
  }

  const { data: weatherData, error: weatherError } = await getWetherForecast(
    geocodingData.lat,
    geocodingData.lon
  );

  if (weatherError) {
    searchError.value = 'elseError';
    return;
  }
  const fourDaysWeatherInfoList = getFourDaysWeatherInfoList(weatherData.list);

  fourDaysTemperature.value = getMinAndMaxTemperature(fourDaysWeatherInfoList);
  fourDaysHumidity.value = getHumidity(fourDaysWeatherInfoList);
}
</script>
<style lang="scss">
@use 'normalize.css/normalize.css';
</style>
