<template>
<!--     <v-card ref="mainCard"> -->
    <v-container fluid>
      <v-row>
        <v-col cols="12" sm="2">
          <v-slider
            v-model="scaleFactor"
            dense
            step="0.05"
            max="1.0"
            min="0.1"
            label="Scale"
            @change="onChangeScale"
            >
            <template v-slot:append>
              <v-text-field
                v-model="scaleFactor"
                class="mt-0 pt-0"
                hide-details
                single-line
                dense
                type="number"
                min="0.1"
                max="1.0"
                step="0.05"
                :disabled="false"
                @click="onChangeScale(scaleFactor)"
                style="width: 60px"
              ></v-text-field>
            </template>
          </v-slider>
        </v-col>
        <v-col cols="12" sm="2">
          <v-slider
            v-model="brushSize"
            :disabled="!isBrushMode"
            dense
            label="Br.Size"
            step="1"
            max="100.0"
            min="5.0"
            >
            <template v-slot:append>
              <v-text-field
                v-model="brushSize"
                class="mt-0 pt-0"
                hide-details
                single-line
                dense
                type="number"
                min="5.0"
                max="100.0"
                step="1.0"
                :disabled="false"
                style="width: 60px"
              ></v-text-field>
            </template>
          </v-slider>
        </v-col>
        <v-col cols="12" sm="2">
          <v-slider
            v-model="threshold"
            :disabled="!image"
            dense
            label="Thr"
            step="5"
            max="255"
            min="0"
            >
            <template v-slot:append>
              <v-text-field
                v-model="threshold"
                class="mt-0 pt-0"
                hide-details
                single-line
                dense
                type="number"
                min="0"
                max="255"
                step="5"
                :disabled="false"
                style="width: 60px"
              ></v-text-field>
            </template>
          </v-slider>
        </v-col>
        <v-col>
          <v-checkbox dense v-model="isBrushMode" :disabled="roi.polygons.length < 1" label="Brush"/>
        </v-col>
        <v-col>
          <v-checkbox dense :disabled="!isBrushMode" v-model="isEraseMode" label="Erase"/>
        </v-col>
        <v-col>
          <v-checkbox dense v-model="atfilter" :disabled="!image" label="AT"/>
        </v-col>
        <v-col>
          <v-btn
            :disabled="!(atpixels && roi.polygons.length > 0)"
            icon
            small
            color="primary"
            @click="autoFill">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
        </v-col>
      </v-row>
      <v-row>
        <v-card>
        <v-stage
          ref="konvaStage"
          class="mainStage"
          :config="konvaConfig"
          v-resize="onResize"
          @mousemove="handleMouseMoveStage">
          <v-layer
            ref="imageLayer"
            id="imageLayer">
            <v-image
              ref="image"
              :config="image"
            />
          </v-layer>
          <v-layer
            ref="roiLayer"
            id="roiLayer"
            @mouseup="handleMouseUp">
            <template v-if="image">
              <v-line
                :config="roi.generateBoundary()"/>
              <v-circle v-for="p in roi.polygons"
                :config="p"
                v-bind:key="p.id"
                @mousedown="handleMouseDown"
                @mouseover="handleMouseOver"/>
              <template v-if="!isBrushMode">
                <v-circle
                  v-for="c in roi.getAnchors()"
                  v-bind:key="c.id"
                  @dragstart="handleDragStart"
                  @dragend="handleDragEnd"
                  @dragmove="handleDragMove"
                  :config="c"/>
              </template>
              <v-circle v-if="!isBrushMode"
                  v-bind:key="roi.getCenterAnchor().id"
                  @dragstart="handleDragCenterStart"
                  @dragend="handleDragCenterEnd"
                  @dragmove="handleDragCenterMove"
                  :config="roi.getCenterAnchor()"/>
              />
            </template>
          </v-layer>
          <v-layer>
            <v-circle
              v-if="isBrushMode"
              :config="brushConfig"
              @mousedown="handleMouseDownBrush"
              @mouseup="handleMouseUpBrush"
            />
          </v-layer>
        </v-stage>
        </v-card>
      </v-row>
    </v-container>
<!--     </v-card> -->
</template>

<script lang='ts'>

import { ref, watch, defineComponent, computed, onMounted, watchEffect } from '@vue/composition-api';
import lodash from 'lodash';
import Konva from 'konva';
import getPixels from 'get-pixels';
import savePixels from 'save-pixels';
import blobStream from 'blob-stream';
import adaptiveThreshold from 'adaptive-threshold';
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
  id?: string;
  x: number;
  y: number;
}

class ROI {
  coordinates: any | null;

  scalefactor: number;

  polygons: any[];

  constructor(coord: Circle[] | null) {
    this.scalefactor = 1.0;
    this.polygons = [];
    if (coord) this.coordinates = coord;
    else {
      const width = window.innerWidth * 0.7;
      const height = window.innerHeight;
      this.coordinates = {}; // LeftTop, LeftBottom, RightTop, RightBottom
      this.initializeROI(width, height);
    }
  }

  initializeROI(width: number, height: number) {
    const rng = [[0.1, 0.1], [0.85, 0.1], [0.85, 0.85], [0.1, 0.85]];
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
      const p = { x: v.x, y: v.y, id: k };
      out.push(p);
    });
    return out;
  }

  getAnchors(): any[] {
    const points = this.getCoordinates();
    const anchors = points.map((v) => {
      const circle = {
        draggable: true,
        id: v.id,
        x: v.x,
        y: v.y,
        stroke: 'green',
        radius: 10,
      };
      return circle;
    });
    return anchors;
  }

  moveToNewCenter(center: Point): any {
    const currentCenter = this.getCenterAnchor();
    const diffX = center.x - currentCenter.x;
    const diffY = center.y - currentCenter.y;
    lodash.forIn(this.coordinates, (v, k) => {
      this.coordinates[k].x += diffX;
      this.coordinates[k].y += diffY;
    });
  }

  getCenterAnchor(): any {
    const anchors = this.getAnchors();
    const circle = {
      draggable: true,
      id: 'center-anchor',
      x: (anchors.map((val) => val.x).reduce((a, b) => a + b, 0)) / 4,
      y: (anchors.map((val) => val.y).reduce((a, b) => a + b, 0)) / 4,
      stroke: 'green',
      radius: 10,
    };
    return circle;
  }

  getCoordinatesOnImage(): Point[] {
    const out: Point[] = [];
    lodash.forIn(this.coordinates, (v, k) => {
      const p = { x: v.x / this.scalefactor, y: v.y / this.scalefactor };
      out.push(p);
    });
    return out;
  }

  getMask(): any[] {
    return this.polygons.map((v: any) => {
      const position = v.posit;
      const value = v.fill != null;
      return { position, value };
    });
  }

  autoMask(pixels: any, threshold: number): any[] {
    const [height, width] = pixels.shape;
    console.log(width, height);
    lodash.each(this.polygons, (v, i) => {
      const x = Math.round(v.y / this.scalefactor);
      const y = Math.round(v.x / this.scalefactor);
      const r = Math.round(v.radius / this.scalefactor);
      let pixval = 0.0;
      for (let row = y - r; row < y + r; row += 1) {
        for (let col = x - r; col < x + r; col += 1) {
          pixval += pixels.data[row * width + col];
        }
      }
      pixval /= (2 * r) ** 2;
      this.polygons[i].fill = pixval < threshold ? 'red' : null;
    });
    return this.polygons;
  }

  generateBoundary() {
    const coords: Point[] = this.getCoordinates();
    const points: number[] = [];
    lodash.each(coords, (v: Point, k) => {
      points.push(v.x);
      points.push(v.y);
    });
    const lineConfig = { points, stroke: 'red', strokeWidth: 1, closed: true };
    return lineConfig;
  }

  setPolygonsInCircle(x: number, y: number, radius: number, key: string, value: any) {
    lodash.each(this.polygons, (v: any, i: number) => {
      const tf = ((v.x - x) ** 2 + (v.y - y) ** 2) < (radius ** 2);
      if (tf) this.polygons[i][key] = value;
    });
  }

  setScaleFactor(scale: number) {
    const prevScalefactor = this.scalefactor;
    this.scalefactor = scale;
    // adjust positions
    const ratio = this.scalefactor / prevScalefactor;
    const newCoords: any = {};
    lodash.forIn(this.coordinates, (v: Point, k: string) => {
      newCoords[k] = { x: v.x * ratio, y: v.y * ratio };
    });
    this.coordinates = newCoords;
    const newPolygons: any[] = [];
    lodash.each(this.polygons, (v: any, idx) => {
      const elm = v;
      elm.x = v.x * ratio;
      elm.y = v.y * ratio;
      elm.radius = v.radius * ratio;
      elm.strokeWidth = this.scalefactor < 0.4 ? 0 : Math.min(ratio, 1.0);
      newPolygons.push(elm);
    });
    this.polygons = newPolygons;
  }

  generateLattices(nx = 50, ny = 50) {
    const [p1, p2, p3, p4] = this.getCoordinates();
    const latticeCoords: Point[] = [];
    for (let i = 0; i < nx + 1; i += 1) { // row
      const currentPoint1 = {
        x: p1.x + ((p4.x - p1.x) / nx) * i,
        y: p1.y + ((p4.y - p1.y) / ny) * i,
      };
      const currentPoint2 = {
        x: p2.x + ((p3.x - p2.x) / nx) * i,
        y: p2.y + ((p3.y - p2.y) / nx) * i,
      };
      for (let j = 0; j < ny + 1; j += 1) { // column
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
    this.polygons = [];
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
          stroke: 'gray',
          strokeWidth: 1,
          posit: [i, j],
        };
        // const poly = new Konva.Line(polyConfig)
        this.polygons.push(polyConfig);
      }
    }
    return this.polygons;
  }
}
export default defineComponent({
  name: 'AtlasBrowserCanvas',
  props: ['image', 'scale_factor'],
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const currentRoute = computed(() => ctx.root.$route);
    const width = window.innerWidth;
    const height = window.innerHeight;
    const konvaConfig = ref<any>({ width, height });
    const circleConfig = ref<any>({ x: 120, y: 120, radius: 5, fill: 'green', draggable: true });
    const brushConfig = ref<any>({ x: null, y: null, radius: 20, fill: null, stroke: 'red' });
    const isBrushMode = ref(false);
    const isEraseMode = ref(false);
    const brushSize = ref(20);
    const brushDown = ref(false);
    const roi = ref<ROI>(new ROI(null));
    const lines = ref<Konva.Line[]>();
    const activePointId = ref<string | null>(null);
    // const polygons = ref<any[] | null>([]);
    const isMouseDown = ref(false);
    const stageWidth = ref(window.innerWidth * 0.7);
    const stageHeight = ref(window.innerHeight);
    const image = computed(() => props.image);
    const scaleFactor = ref(props.scale_factor);
    const atfilter = ref(false);
    const atpixels = ref<any[] | null>([]);
    const threshold = ref(210);
    function initialize() {
      roi.value = new ROI(null);
      roi.value.polygons = [];
      isBrushMode.value = false;
      isEraseMode.value = false;
      atfilter.value = false;
    }
    function handleDragStart(ev: any) {
      // console.log(ev);
      const { id } = ev.target.attrs;
      activePointId.value = id;
      roi.value.polygons = [];
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
    function handleDragCenterStart(ev: any) {
      roi.value.polygons = [];
    }
    function handleDragCenterEnd(ev: any) {
      console.log(ev);
    }
    function handleDragCenterMove(ev: any) {
      roi.value.moveToNewCenter(ev.target._lastPos);
    }
    function handleMouseDown(ev: any) {
      const { id } = ev.target.attrs;
      const idx = lodash.findIndex(roi.value.polygons, { id });
      if (roi.value.polygons) {
        if (roi.value.polygons[idx].fill === 'red') roi.value.polygons[idx].fill = null;
        else roi.value.polygons[idx].fill = 'red';
      }
      isMouseDown.value = true;
    }
    function handleMouseUp(ev: any) {
      isMouseDown.value = false;
    }
    function handleMouseOver(ev: any) {
      if (isMouseDown.value) {
        const { id } = ev.target.attrs;
        const idx = lodash.findIndex(roi.value.polygons, { id });
        if (roi.value.polygons) {
          roi.value.polygons[idx].fill = 'red';
        }
      }
    }
    function handleMouseMoveStage(ev: any) {
      if (isBrushMode.value) {
        const pos = (ctx as any).refs.konvaStage.getNode().getPointerPosition();
        const { x, y } = pos;
        brushConfig.value.x = x;
        brushConfig.value.y = y;
        if (brushDown.value) {
          if (isEraseMode.value) {
            roi.value.setPolygonsInCircle(brushConfig.value.x, brushConfig.value.y, brushConfig.value.radius, 'fill', null);
          } else {
            roi.value.setPolygonsInCircle(brushConfig.value.x, brushConfig.value.y, brushConfig.value.radius, 'fill', 'red');
          }
        }
      }
    }
    function handleMouseDownBrush(ev: any) {
      brushDown.value = true;
      if (isEraseMode.value) {
        roi.value.setPolygonsInCircle(brushConfig.value.x, brushConfig.value.y, brushConfig.value.radius, 'fill', null);
      } else {
        roi.value.setPolygonsInCircle(brushConfig.value.x, brushConfig.value.y, brushConfig.value.radius, 'fill', 'red');
      }
    }
    function handleMouseUpBrush(ev: any) {
      brushDown.value = false;
    }
    function setBrushMode(tf: boolean) {
      isBrushMode.value = tf;
    }
    function generateLattices(ev: any) {
      roi.value.polygons = roi.value.generatePolygons();
      // console.log(roi.value.getCoordinatesOnImage());
    }
    function onResize(ev: any) {
      console.log('OnResize');
    }
    async function saveSpatial(ev: any) {
      if (!roi.value) return;
      console.log('Save Spatial data');
      const mask = roi.value.getMask();
      // console.log(mask);
    }
    function autoFill(ev: any) {
      roi.value.autoMask(atpixels.value, threshold.value);
    }
    function onChangeScale(v: number) {
      image.value.scale = { x: v, y: v };
      konvaConfig.value.width = v * image.value.image.width;
      konvaConfig.value.height = v * image.value.image.height;
      stageWidth.value = konvaConfig.value.width;
      stageHeight.value = konvaConfig.value.height;
      roi.value.setScaleFactor(v);
    }
    watch(atfilter, async (v) => {
      if (v) {
        if (image.value.image.alternative_src) {
          image.value.image.src = image.value.image.alternative_src;
        } else {
          getPixels(image.value.src, async (err, pixels) => {
            const thresholded = adaptiveThreshold(pixels);
            atpixels.value = thresholded;
            const b = blobStream();
            savePixels(thresholded, 'png').pipe(b).on('finish', () => {
              const newsrc = b.toBlobURL('image/png');
              image.value.image.original_src = image.value.image.src;
              image.value.image.src = newsrc;
              image.value.image.alternative_src = newsrc;
            });
          });
        }
      } else {
        image.value.image.src = image.value.image.original_src;
      }
    });
    watch(brushSize, (v) => {
      brushConfig.value.radius = v;
    });
    watch(roi, (v) => {
      console.log('roi changed');
    });
    watch(image, (v) => {
      scaleFactor.value = stageWidth.value / v.image.width;
      onChangeScale(scaleFactor.value);
      // konvaConfig.value.height = v.image.height * scaleFactor.value;
      // stageWidth.value = konvaConfig.value.width;
      // stageHeight.value = konvaConfig.value.height;
      // roi.value.setScaleFactor(scaleFactor.value);
    });
    onMounted(async () => {
      await clientReady;
    });
    return {
      konvaConfig,
      circleConfig,
      brushConfig,
      handleDragStart,
      handleDragEnd,
      handleDragMove,
      handleDragCenterStart,
      handleDragCenterEnd,
      handleDragCenterMove,
      handleMouseDown,
      handleMouseOver,
      handleMouseMoveStage,
      handleMouseDownBrush,
      handleMouseUpBrush,
      handleMouseUp,
      roi,
      objectToArray,
      generateLattices,
      // polygons,
      onResize,
      stageWidth,
      initialize,
      saveSpatial,
      isBrushMode,
      setBrushMode,
      isEraseMode,
      brushSize,
      scaleFactor,
      onChangeScale,
      atfilter,
      atpixels,
      autoFill,
      threshold,
    };
  },
});

</script>

<style>
.toolRow {
  height: 5vh;
}
.mainStage {
  height: 81vh;
  overflow : auto;
}
</style>
