<template>
  <div class="page">
    <div class="container">
      <div class="page-content">
        <h1>Weather forecast</h1>
        <div class="page-search">
          <label class="search-label" for="search-input">
            <input
              id="search-input"
              v-model="searchInput"
              type="text"
              @keyup.enter="searchByCityName"
            />
            <button class="search-btn" @click="searchByCityName"></button>
          </label>
          <span v-if="errorHint" class="search-hint">{{ errorHint }}</span>
        </div>
        <div class="page-result">
          <BarChart
            class="page-result-bar-chart"
            :data="fourDaysTemperature"
          ></BarChart>
          <div class="page-result-pie-chart-list">
            <div
              v-for="(percent, i) in fourDaysHumidity"
              :key="percent.toString() + i"
              class="page-result-pie-chart"
            >
              <PieChart :percent="percent"></PieChart>
            </div>
          </div>
        </div>
      </div>
    </div>
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
    emptyInputError: 'Please enter a city name.',
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
      min: Math.round(temp_min),
      max: Math.round(temp_max),
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
  if (searchInput.value === '') {
    searchError.value = 'emptyInputError';
    return;
  }

  const { data: geocodingData, error: geocodingError } = await getGeocoding(
    searchInput.value.trim()
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
html,
* {
  box-sizing: border-box;
}
#app {
  font-family: Roboto, Arial, 'Microsoft JhengHei Modify', 'Microsoft JhengHei',
    PingFangTC, sans-serif;
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  min-height: 100vh;
}
.page {
  width: 100%;
  letter-spacing: 0.05em;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 360px;
  overflow: auto;
  .container {
    flex: 1;
    width: 80%;
    margin: 0 auto;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    padding: 0 10px;
    height: 100%;
  }

  &-content {
    width: 100%;
  }

  h1 {
    text-align: center;
    margin-bottom: 20px;
    margin-top: 0;
  }
  &-search {
    display: flex;
    width: 100%;
    justify-content: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    letter-spacing: 0.05em;

    .search-label {
      width: 100%;
      margin-bottom: 20px;
      display: flex;
      border: 2px solid #000;
      border-radius: 5px;
      font-size: 20px;
    }

    #search-input {
      padding: 10px;
      border: none;
      border-top-left-radius: 5px;
      border-bottom-left-radius: 5px;
      background-color: #f2f4f6;
      height: 60px;
      flex: 1;

      &:focus {
        outline: none;
      }
    }

    .search-btn {
      width: 60px;
      border-top-right-radius: 5px;
      border-bottom-right-radius: 5px;
      border: none;
      height: 100%;
      background-color: #f2f4f6;
      background-image: url('@/assets/icon-search.png');
      background-position: center;
      background-size: 50% auto;
      background-repeat: no-repeat;
      cursor: pointer;
    }

    .search-hint {
      width: 100%;
      text-align: center;
      font-size: 12px;
      color: red;
    }
  }

  &-result {
    width: 100%;
  }

  &-result-bar-chart {
    margin: 0 auto;
    margin-bottom: 20px;
  }

  &-result-pie-chart-list {
    display: flex;
    margin: 0 auto;
    gap: 20px;
    justify-content: center;
  }

  &-result-pie-chart {
    width: 25%;
    padding: 0 5%;
  }

  @media (max-width: 960px) {
    .container {
      width: 90%;
    }
  }

  @media (max-width: 767.9px) {
    .container {
      width: 100%;
    }

    &-result-pie-chart {
      width: 25%;
      padding: 0 1%;

      .pie-chart-inside {
        img {
          width: 20px;
        }
        div {
          font-size: 20px;
        }
      }
    }
  }
}
</style>
