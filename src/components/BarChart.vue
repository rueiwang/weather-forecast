<template>
  <div class="bar-chart">
    <div v-for="info in data" :key="info.label" class="bar-chart-group">
      <div class="bar" :style="barStyle(info.max)">
        <div class="bar-temperature">{{ info.max }}{{ unit }}</div>
      </div>
      <div
        class="bar"
        :class="{ 'bar-negative': info.min < 0 }"
        :style="barStyle(info.min)"
      >
        <div class="bar-temperature">{{ info.min }}{{ unit }}</div>
      </div>
      <div class="bar-basic-line" :style="barBasicLineStyle"></div>
      <div class="bar-label">{{ info.label }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
  unit: {
    type: String,
    default: '°C',
  },
});

const minTemperature = computed(() => {
  const ascendingByMin = [...props.data].sort((a, b) => a.min - b.min);

  return ascendingByMin[0].min;
});

const zeroLinePos = computed(() => {
  if (minTemperature.value < 0) {
    return 100 - -minTemperature.value + 1;
  } else {
    return 101;
  }
});
const barBasicLineStyle = computed(() => {
  return {
    'grid-row-start': zeroLinePos,
    'grid-row-end': zeroLinePos.value + 1,
  };
});

function barStyle(temperature) {
  let gridRowStart = zeroLinePos.value - temperature;
  let gridRowEnd = zeroLinePos.value;
  if (temperature < 0) {
    gridRowStart = zeroLinePos.value + 1;
    gridRowEnd = zeroLinePos.value - temperature;
  }
  return {
    'grid-row-start': gridRowStart,
    'grid-row-end': gridRowEnd,
  };
}
</script>

<style scoped lang="scss">
.bar-chart {
  display: flex;
  max-width: 60%;

  &-group {
    flex: 1;
    display: grid;
    grid-template-rows: repeat(101, 1fr);

    height: 50vh;
    position: relative;

    .bar {
      position: relative;
      border-radius: 5px 5px 0 0;
      width: 80%;
      margin: 0 auto;

      &:nth-child(odd) {
        background-color: #ff3300;
      }

      &:nth-child(even) {
        background-color: #9bbcff;
        grid-column: 2;
      }
    }

    .bar-temperature {
      position: absolute;
      left: 50%;
      top: 0;
      transform: translate(-50%, -100%);
    }

    .bar-negative {
      border-radius: 0 0 5px 5px;
      .bar-temperature {
        top: auto;
        bottom: 0;
        transform: translate(-50%, 100%);
      }
    }

    .bar-label {
      position: absolute;
      left: 50%;
      transform: translate(-50%);
      text-align: center;
    }
  }

  .bar-basic-line {
    grid-column-start: 1;
    grid-column-end: 3;
    background-color: #000;
  }
}
</style>
