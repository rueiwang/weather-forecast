<template>
  <div class="pie-chart" :style="cssVariables">
    <div class="pie-chart-inside">
      <div>
        <span class="num">{{ percent }}</span
        ><span class="unit">%</span>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue';

const props = defineProps({
  percent: {
    type: Number,
    default: 100,
  },
});

const cssVariables = computed(() => {
  return {
    '--deg': `${(props.percent * 360) / 100}deg`,
  };
});
</script>
<style lang="scss">
.pie-chart {
  padding-top: 100%;
  border-radius: 50%;
  position: relative;
  background: conic-gradient(skyblue var(--deg), #eee var(--deg));
  &-inside {
    position: absolute;
    width: 80%;
    padding-top: 80%;
    border-radius: 50%;
    top: 50%;
    left: 50%;
    background-color: #fff;
    transform: translate(-50%, -50%);

    div {
      position: absolute;
      top: 50%;
      left: 50%;
      font-size: 24px;
      transform: translate(-50%, -50%);

      .num {
        font-size: 30px;
      }
    }
  }
}
</style>
