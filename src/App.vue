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
          <div v-if="validLastSearchCityList.length > 0" class="search-history">
            <span>History:</span>
            <div class="search-history-list">
              <button
                v-for="city in validLastSearchCityList"
                :key="city"
                @click="searchHistory(city)"
              >
                {{ city }}
              </button>
            </div>
          </div>
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
import { onMounted, ref } from 'vue';
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

function checkIsLocalStorageAvailable() {
  try {
    let storage = window.localStorage;
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return false;
  }
}

const historyData = ref(null);
const isLocalStorageAvailable = checkIsLocalStorageAvailable();

function getInfoInLocalStorage() {
  let data = null;
  if (!isLocalStorageAvailable) return data;

  let lastData = localStorage.getItem('weatherForecast');
  if (!lastData) return data;

  data = JSON.parse(lastData);
  return data;
}

function setInfoInLocalStorage(cityName, fourDaysList, humidityList) {
  if (!isLocalStorageAvailable) return false;
  const pendingData = {
    [cityName]: {
      fourDaysList,
      humidityList,
      timestamp: Date.now(),
    },
  };
  const currentData = getInfoInLocalStorage();
  if (!currentData) {
    localStorage.setItem('weatherForecast', JSON.stringify(pendingData));
  } else {
    const finalData = Object.assign(currentData, pendingData);
    localStorage.setItem('weatherForecast', JSON.stringify(finalData));
  }

  return true;
}

// 24 小時內搜尋過的城市名稱
const validLastSearchCityList = computed(() => {
  if (!historyData.value) return [];
  const result = [];
  for (let cityName of Object.keys(historyData.value)) {
    if (checkIsHistoryDataAvailable(cityName)) {
      result.push(cityName);
    }
  }

  return result;
});

onMounted(() => {
  historyData.value = getInfoInLocalStorage();
  searchInput.value = 'Taipei';
  searchByCityName();
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

async function setNewWeatherInfo(cityName) {
  const { data: geocodingData, error: geocodingError } = await getGeocoding(
    cityName
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

  const isSetSuccess = setInfoInLocalStorage(
    cityName,
    fourDaysTemperature.value,
    fourDaysHumidity.value
  );
  if (isSetSuccess) {
    if (!historyData.value) {
      historyData.value = {};
    }
    historyData.value[cityName] = {
      fourDaysList: fourDaysTemperature.value,
      humidityList: fourDaysTemperature.value,
    };
  }
}

function checkIsHistoryDataAvailable(cityName) {
  if (!historyData.value) return false;
  if (!historyData.value[cityName]) return false;
  const targetData = historyData.value[cityName];
  const currentTimestamp = Date.now();
  const ifPassADay = currentTimestamp - targetData.timestamp >= 86400000;
  return !ifPassADay;
}

function searchHistory(cityName) {
  searchError.value = '';
  searchInput.value = cityName;
  setHistoryWeatherInfo(cityName);
}

function setHistoryWeatherInfo(cityName) {
  const targetHistory = historyData.value[cityName];
  fourDaysTemperature.value = targetHistory.fourDaysList;
  fourDaysHumidity.value = targetHistory.humidityList;
}

async function searchByCityName() {
  searchError.value = '';
  fourDaysTemperature.value = [];
  fourDaysHumidity.value = [];
  const cityName = searchInput.value.trim();
  if (cityName === '') {
    searchError.value = 'emptyInputError';
    return;
  }
  if (checkIsHistoryDataAvailable(cityName)) {
    setHistoryWeatherInfo(cityName);
  } else {
    await setNewWeatherInfo(cityName);
  }
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
    margin-bottom: 20px;
    flex-wrap: wrap;
    letter-spacing: 0.05em;

    .search-label {
      width: 100%;
      margin-bottom: 10px;
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

    .search-history {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      span {
        margin-right: 5px;
        letter-spacing: 0.05em;
      }
      &-list {
        display: flex;
        gap: 5px;
        button {
          cursor: pointer;
          background-color: #f2f4f6;
          padding: 5px 10px;
          border: 1px solid #000;
          border-radius: 5px;
          letter-spacing: 0.05em;
          transition: color 0.3s, background-color 0.3s;

          &:hover {
            background-color: #000;
            color: #fff;
          }
        }
      }
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
