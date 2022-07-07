<template>
<div style="width: 100%">
  <canvas id="logo" ref="logo"></canvas>
</div>
</template>

<script lang='ts'>
import Vue from 'vue';
import vuetify from '@/plugins/vuetify';
import lodash, { lte } from 'lodash';
import { ref, watch, defineComponent, computed, onMounted, watchEffect, onUnmounted } from '@vue/composition-api';

function sort_order(x: any) {
  let test = x;
  const test_with_index = [];
  for (let i = 0; i < test.length; i += 1) {
    test_with_index.push([test[i], i]);
  }
  test_with_index.sort((left, right) => (left[0] < right[0] ? -1 : 1));
  const indexes = [];
  test = [];
  for (let j = 0; j < test_with_index.length; j += 1) {
    test.push(test_with_index[j][0]);
    indexes.push(test_with_index[j][1]);
  }
  return indexes;
}

export default defineComponent({
  name: 'BarChart',
  props: ['seqlogo', 'width', 'motif'],
  setup(props, ctx) {
    const dataFromParent = computed(() => props.seqlogo);
    const widthFromParent = computed(() => props.width);
    const motifFromParent = computed(() => props.motif);

    async function beginGraph() {
      /* eslint-disable no-param-reassign */
      const controller = (ctx as any).refs.logo.getContext('2d');
      controller.clearRect(0, 0, widthFromParent.value, 300);
    }

    async function checker(data: any[]) {
      await beginGraph();
      /* eslint-disable no-param-reassign */
      /* eslint-disable prefer-destructuring */
      const settings = {
        textcolor: 'black',
        bgcolor: 'white',
        border: 35,
        padding: 6,
        labelfont: '14px Arial,sans-serif',
        letterfont: '30px Lucida Console,monospace',
        fontpixelheight: 24,
        ymaxs: 0,
      };

      // draw the background
      const controller = (ctx as any).refs.logo.getContext('2d');
      controller.save();
      const width = widthFromParent.value;
      const height = 300;
      (ctx as any).refs.logo.width = width;
      (ctx as any).refs.logo.height = height;
      controller.fillStyle = settings.bgcolor;
      controller.fillRect(0, 0, width, height);

      const valuesA = ['A', '#0d9647'];
      const valuesC = ['C', '#255c9a'];
      const valuesG = ['G', '#f7b32b'];
      const valuesT = ['T', '#d6273a'];
      for (let i = 0; i <= data.length; i += 1) {
        if (data[i]) {
          for (let j = 0; j <= data[i].length; j += 1) {
            if (data[i][j]) {
              if (data[i][j].includes('A')) {
                valuesA.push(data[i][j][1]);
              }
              if (data[i][j].includes('C')) {
                valuesC.push(data[i][j][1]);
              }
              if (data[i][j].includes('G')) {
                valuesG.push(data[i][j][1]);
              }
              if (data[i][j].includes('T')) {
                valuesT.push(data[i][j][1]);
              }
            }
          }
        }
      }
      const columns = [valuesA, valuesC, valuesG, valuesT];

      const letters = ['A', 'C', 'G', 'T'];

      const ncols = columns[0].length - 2;
      // collect stats on columns
      let ymax = settings.ymaxs;
      lodash.each(columns, (v: any[], i: any) => {
        const colsum = lodash.sum(v);
        if (colsum > ymax) ymax = Math.floor(colsum);
      });
      for (let i = 0; i < ncols; i += 1) {
        let colsum = 0;
        for (let j = 0; j < letters.length; j += 1) {
          colsum += parseFloat(columns[j][i + 2]);
        }
        if (colsum > ymax) ymax = colsum;
      }
      // draw the letters
      let columnx = settings.border;
      const columndelta = (width - settings.border) / ncols;
      const yheight = height - settings.border;
      controller.font = settings.letterfont;

      for (let col = 0; col < ncols; col += 1) {
        let lettery = yheight;
        const values = letters.map((letter: any) => {
          let value: any;
          columns.forEach((list: any, x: number) => {
            if (list.includes(letter)) {
              value = list[col + 2];
            }
          });
          return value;
        });
        const order = sort_order(values).map((val: any) => (val));
        for (let i = 0; i < letters.length; i += 1) {
          const letter = letters[order[i]];
          let weight = 0;
          let colIndex = 0;
          columns.forEach((list: any, x: number) => {
            if (list.includes(letter)) {
              weight = list[col + 2];
              colIndex = x;
            }
          });
          if (weight > 0) {
            controller.save();
            controller.fillStyle = columns[colIndex][1];
            controller.translate(columnx, lettery);
            const scaley = (yheight * weight) / (settings.fontpixelheight * ymax);
            const mt = controller.measureText(letter);
            const letterwidth = mt.width;
            const scalex = columndelta / letterwidth;
            controller.scale(scalex, scaley);
            controller.fillText(letter, 0, 0);
            controller.restore();
            lettery -= (weight * yheight) / ymax;
          }
        }

        // x-axis labels
        controller.save();
        controller.fillStyle = settings.textcolor;
        controller.textAlign = 'center';
        controller.textBaseline = 'top';
        controller.font = settings.labelfont;
        controller.fillText((col + 1).toString(), columnx + columndelta / 2, height - settings.border + settings.padding);
        controller.restore();
        columnx += columndelta;
      }

      // y-axis labels
      controller.fillStyle = settings.textcolor;
      controller.font = settings.labelfont;
      controller.textAlign = 'right';

      controller.textBaseline = 'top';
      controller.fillText('2 -', settings.border - settings.padding, 64);
      controller.textBaseline = 'top';
      controller.fillText('1.5 -', settings.border - settings.padding, 113);
      controller.textBaseline = 'center';
      controller.fillText('1 -', settings.border - settings.padding, (height / 2) + 11);
      controller.textBaseline = 'bottom';
      controller.fillText('.5 -', settings.border - settings.padding, height - 74);
      controller.textBaseline = 'bottom';
      controller.fillText('0 -', settings.border - settings.padding, height - 27);

      controller.restore();
    }
    watch(dataFromParent, async (v: any) => {
      if (v) {
        await checker(v);
      }
    });
    watch(widthFromParent, async (v: any) => {
      if (dataFromParent.value) {
        await checker(dataFromParent.value);
      }
    });
    watch(motifFromParent, async (v: any) => {
      if (!v) {
        await beginGraph();
      }
    });
    onMounted(async () => {
      await beginGraph();
    });
    return {
      checker,
      dataFromParent,
      widthFromParent,
      motifFromParent,
    };
  },
});
</script>
