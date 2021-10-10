<template>
<!--     <v-card ref="mainCard"> -->
      <v-stage
        ref="konvaStage"
        class="mainStage"
        :config="konvaConfig"
        v-resize="onResize">
        <v-layer
          ref="imageLayer"
          id="imageLayer">
          <v-image
            :config="image"
          />
        </v-layer>
        <v-layer
          ref="roiLayer"
          id="roiLayer"
          @mouseup="handleMouseUp">
          <template v-if="image">
            <v-circle
              v-for="c, i in objectToArray(roi.coordinates)"
              v-bind:key="i"
              @dragstart="handleDragStart"
              @dragend="handleDragEnd"
              @dragmove="handleDragMove"
              :config="c.value"/>
            <v-line
              :config="roi.generateBoundary()"/>
            <v-circle v-for="p in polygons"
              :config="p"
              v-bind:key="p.id"
              @mousedown="handleMouseDown"
              @mouseover="handleMouseOver"/>
          </template>
        </v-layer>
      </v-stage>
<!--     </v-card> -->
</template>

<script lang='ts'>

import { ref, watch, defineComponent, computed, onMounted, watchEffect } from '@vue/composition-api';
import lodash from 'lodash';
import Konva from 'konva';
import store from '@/store';
import { get_uuid, generateRouteByQuery, objectToArray } from '@/utils';

const clientReady = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));
  watchEffect(() => {
    if (ready.value) { resolve(true); }
  });
});

interface Circle {
  _id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
}

interface Point {
  x: number;
  y: number;
}

class ROI {
  coordinates: any | null;

  scalefactor: number;

  constructor(coord: Circle[] | null) {
    this.scalefactor = 1.0;
    if (coord) this.coordinates = coord;
    else {
      const width = window.innerWidth * 0.7;
      const height = window.innerHeight;
      this.coordinates = {}; // LeftTop, LeftBottom, RightTop, RightBottom
      this.initializeROI(width, height);
    }
  }

  initializeROI(width: number, height: number) {
    const rng = [[0.25, 0.25], [0.75, 0.25], [0.75, 0.75], [0.25, 0.75]];
    rng.forEach((x: number[], idx: number) => {
      const [xp, yp] = x;
      const id = get_uuid();
      const circle: any = {
        draggable: true,
        id,
        x: xp * width,
        y: yp * height,
        stroke: 'green',
        radius: 10,
      };
      if (this.coordinates) this.coordinates[id] = circle;
    });
  }

  getCoordinates(): Point[] {
    const out: Point[] = [];
    lodash.forIn(this.coordinates, (v, k) => {
      // console.log(v.attrs.id, v.attrs.x, v.attrs.y);
      const p = { x: v.x, y: v.y };
      out.push(p);
    });
    return out;
  }

  generateBoundary() {
    const coords: Point[] = this.getCoordinates();
    const points: number[] = [];
    lodash.each(coords, (v: Point, k) => {
      points.push(v.x);
      points.push(v.y);
    });
    // points.push(coords[0].x);
    // points.push(coords[0].y);
    const lineConfig = { points, stroke: 'red', strokeWidth: 1, closed: true };
    return lineConfig;
  }

  generateLattices(nx = 50, ny = 50) {
    const [p1, p2, p3, p4] = this.getCoordinates();
    const latticeCoords: Point[] = [];
    for (let i = 0; i < nx + 1; i += 1) { // column
      const currentPoint1 = {
        x: p1.x + ((p2.x - p1.x) / nx) * i,
        y: p1.y + ((p2.y - p1.y) / ny) * i,
      };
      const currentPoint2 = {
        x: p4.x + ((p3.x - p4.x) / nx) * i,
        y: p4.y + ((p3.y - p4.y) / nx) * i,
      };
      for (let j = 0; j < ny + 1; j += 1) {
        const x = currentPoint1.x + ((currentPoint2.x - currentPoint1.x) / nx) * j;
        const y = currentPoint1.y + ((currentPoint2.y - currentPoint1.y) / ny) * j;
        const p = { x, y };
        latticeCoords.push(p);
      }
    }
    return latticeCoords;
  }

  generatePolygons(nx = 50, ny = 50) {
    const lattices = this.generateLattices(nx, ny);
    const polygons: any[] = [];
    for (let i = 0; i < nx; i += 1) {
      for (let j = 0; j < ny; j += 1) {
        const lt = lattices[i * (nx + 1) + j];
        const lb = lattices[i * (nx + 1) + j + 1];
        const rt = lattices[(i + 1) * (nx + 1) + j];
        const rb = lattices[(i + 1) * (nx + 1) + j + 1];
        const center = { x: (lt.x + lb.x + rt.x + rb.x) / 4, y: (lt.y + lb.y + rt.y + rb.y) / 4 };
        const r = (Math.abs((rb.x - lt.x)) + Math.abs((rb.y - lt.y))) / 6.0;
        const polyConfig = {
          id: get_uuid(),
          x: center.x,
          y: center.y,
          radius: r,
          fill: null,
          stroke: 'black',
          strokeWidth: 1,
          posit: [j, i],
        };
        // const poly = new Konva.Line(polyConfig)
        polygons.push(polyConfig);
      }
    }
    return polygons;
  }

  // generatePolygons(nx = 50, ny = 50) {
  //   const lattices = this.generateLattices(nx, ny);
  //   const polygons: any[] = [];
  //   for (let i = 0; i < nx; i += 1) {
  //     for (let j = 0; j < ny; j += 1) {
  //       const lt = lattices[i * (nx + 1) + j];
  //       const lb = lattices[i * (nx + 1) + j + 1];
  //       const rt = lattices[(i + 1) * (nx + 1) + j];
  //       const rb = lattices[(i + 1) * (nx + 1) + j + 1];
  //       const center = { x: lt.x + lb.x + rt.x + rb.x, y: lt.y + lb.y + rt.y + rb.y };

  //       const polyConfig = {
  //         id: get_uuid(),
  //         points: [lt.x, lt.y, lb.x, lb.y, rb.x, rb.y, rt.x, rt.y],
  //         closed: true,
  //         fill: null,
  //         stroke: 'gray',
  //         strokeWidth: 1,
  //         // opacity: 0.3,
  //         posit: [j, i],
  //       };
  //       // const poly = new Konva.Line(polyConfig)
  //       polygons.push(polyConfig);
  //     }
  //   }
  //   return polygons;
  // }
}
export default defineComponent({
  name: 'AtlasBrowserCanvas',
  props: ['image', 'scaleFactor'],
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const width = window.innerWidth;
    const height = window.innerHeight;
    const konvaConfig = ref<any>({ width, height });
    const circleConfig = ref<any>({ x: 120, y: 120, radius: 5, fill: 'green', draggable: true });
    const roi = ref<ROI>(new ROI(null));
    const lines = ref<Konva.Line[]>();
    const activePointId = ref<string | null>(null);
    const polygons = ref<any[] | null>([]);
    const isMouseDown = ref(false);
    const stageWidth = ref(window.innerWidth * 0.7);
    const stageHeight = ref(window.innerHeight);
    const image = computed(() => props.image);
    const scaleFactor = computed(() => props.scaleFactor);

    function initialize() {
      roi.value = new ROI(null);
      polygons.value = [];
    }
    function handleDragStart(ev: any) {
      // console.log(ev);
      const { id } = ev.target.attrs;
      activePointId.value = id;
      polygons.value = [];
    }
    function handleDragEnd(ev: any) {
      const { id } = ev.target.attrs;
      const pos = ev.target._lastPos;
      activePointId.value = null;
    }
    function handleDragMove(ev: any) {
      const { id } = ev.target.attrs;
      const pos = ev.target._lastPos;
      if (pos.x > 5 && pos.y > 5 && pos.x < stageWidth.value && pos.y < stageHeight.value) {
        roi.value.coordinates[id].x = pos.x;
        roi.value.coordinates[id].y = pos.y;
        const coords = roi.value.getCoordinates();
      } else {
        roi.value.coordinates[id].x = Math.min(Math.max(0, pos.x), stageWidth.value);
        roi.value.coordinates[id].y = Math.min(Math.max(0, pos.y), stageHeight.value);
      }
      // console.log(activePointId.value);
    }
    function handleMouseDown(ev: any) {
      const { id } = ev.target.attrs;
      const idx = lodash.findIndex(polygons.value, { id });
      if (polygons.value) {
        if (polygons.value[idx].fill === 'red') polygons.value[idx].fill = 'transparent';
        else polygons.value[idx].fill = 'red';
      }
      isMouseDown.value = true;
    }
    function handleMouseUp(ev: any) {
      isMouseDown.value = false;
    }
    function handleMouseOver(ev: any) {
      if (isMouseDown.value) {
        const { id } = ev.target.attrs;
        const idx = lodash.findIndex(polygons.value, { id });
        if (polygons.value) {
          polygons.value[idx].fill = 'red';
        }
      }
    }
    function generateLattices(ev: any) {
      polygons.value = roi.value.generatePolygons();
    }
    function onResize(ev: any) {
      console.log('OnResize');
      // stageWidth.value = window.innerWidth * 0.7;
      // konvaConfig.value.width = stageWidth.value;
    }
    watch(scaleFactor, (v) => {
      image.value.scale = { x: v, y: v };
      konvaConfig.value.width = v * image.value.image.width;
      konvaConfig.value.height = v * image.value.image.height;
      stageWidth.value = konvaConfig.value.width;
      stageHeight.value = konvaConfig.value.height;
      roi.value.scalefactor = v;
    });
    watch(polygons, (v) => {
      console.log('polygon changed');
    });
    watch(roi, (v) => {
      console.log('roi changed');
    });
    watch(image, (v) => {
      const scalefactor = stageWidth.value / v.image.width;
      konvaConfig.value.height = v.image.height * scalefactor;
      roi.value.scalefactor = scalefactor;
    });
    onMounted(async () => {
      await clientReady;
    });
    return {
      konvaConfig,
      circleConfig,
      handleDragStart,
      handleDragEnd,
      handleDragMove,
      handleMouseDown,
      handleMouseOver,
      handleMouseUp,
      roi,
      objectToArray,
      generateLattices,
      polygons,
      onResize,
      stageWidth,
      initialize,
    };
  },
});

</script>

<style>
.mainStage {
  overflow : auto;
}
</style>
