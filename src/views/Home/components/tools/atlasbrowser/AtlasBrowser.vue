<template>
<!--     <v-card ref="mainCard"> -->
  <v-container fluid>
    <v-row>
      <v-col cols="12" sm="2">
        <v-card class="mainCard">
          <v-card-title>
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              :value="matta"
              @input="matta = $event; searchRuns(matta)"
            />
          </v-card-title>
          <v-data-table
            v-model="selected"
            height="30vh"
            width="30%"
            dense
            single-select
            :loading="loading"
            :items="items"
            :headers="headers"
            hide-default-footer
            sort-by="id"
            @click:row="selectAction"
          />
        </v-card>
        <v-card v-if="run_id">
          <v-card-title>
            {{ run_id }}
          </v-card-title>
          <v-card-text>
            <v-select
              v-model="metadata.species"
              :items="metaItemLists.species"
              dense
              outlined
              label="Species">
            </v-select>
            <v-select
              v-model="metadata.type"
              :items="metaItemLists.types"
              dense
              outlined
              label="Type">
            </v-select>
            <v-select
              v-model="metadata.assay"
              :items="metaItemLists.assays"
              dense
              outlined
              label="Assay">
            </v-select>
            <v-select
              v-model="metadata.trimming"
              :items="metaItemLists.trimming"
              dense
              outlined
              label="Trimming">
            </v-select>
            <v-select
              v-model="metadata.numChannels"
              :items="metaItemLists.numChannels"
              dense
              outlined
              label="Num Channels">
            </v-select>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="9">
          <template v-if="loading">
            <div class="center-progress">
              <v-progress-circular
                :size="100"
                :width="10"
                color="primary"
                indeterminate
                >
              </v-progress-circular>
            </div>
          </template>
          <v-container fluid>
            <v-row>
              <v-card :disabled="loading">
                <v-stage
                  ref="konvaStage"
                  class="mainStage"
                  :config="konvaConfig"
                  v-resize="onResize"
                  @mousemove="handleMouseMoveStage">
                  <v-layer
                    v-if="current_image"
                    ref="imageLayer"
                    id="imageLayer">
                    <v-image
                      ref="image"
                      :config="current_image"
                    />
                  </v-layer>
                  <v-layer
                    v-if="!isCropMode"
                    ref="roiLayer"
                    id="roiLayer"
                    @mouseup="handleMouseUp">
                    <template v-if="current_image">
                      <v-line
                        :config="roi.generateBoundary()"/>
                      <v-shape v-for="p in roi.polygons"
                        :config="p"
                        v-bind:key="p.id"
                        @transformend="roi.setScaleFactor()"
                        @mousedown="handleMouseDown"
                        @mouseover="handleMouseOver"/>
                        <v-transformer ref="transformer" />
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
                    <v-layer
                      v-if="isCropMode"
                      ref="cropLayer"
                      id="cropLayer"
                      @mouseup="handleMouseUp">
                      <template v-if="current_image">
                        <v-rect
                          :config="crop.generateRect()"/>
                        <template v-if="!isBrushMode">
                          <v-circle
                            v-for="c in crop.getAnchors()"
                            v-bind:key="c.id"
                            @dragstart="handleDragStart_Crop"
                            @dragend="handleDragEnd_Crop"
                            @dragmove="handleDragMove_Crop"
                            :config="c"/>
                        </template>
                        <v-circle v-if="!isBrushMode"
                            v-bind:key="crop.getCenterAnchor().id"
                            @dragstart="handleDragCenterStart_Crop"
                            @dragend="handleDragCenterEnd_Crop"
                            @dragmove="handleDragCenterMove_Crop"
                            :config="crop.getCenterAnchor()"/>
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
                <v-spacer>
                </v-spacer>
                <v-card flat width="5vw">
                  <v-card-actions>
                    <v-text-field
                      v-model="scaleFactor"
                      dense
                      label="Scale"
                      type="number"
                      :min="0.1"
                      :max="1.0"
                      :step="0.01"
                      :disabled="!current_image"
                      @click="onChangeScale"
                    />
                  </v-card-actions>
                  <v-card-actions>
                    <v-text-field
                      v-model="brushSize"
                      class="mt-0 pt-0"
                      dense
                      label="Br.Size"
                      type="number"
                      min="5.0"
                      max="100.0"
                      step="1.0"
                      :disabled="!current_image || isCropMode"
                    />
                  </v-card-actions>
                  <v-card-actions>
                    <v-text-field
                      v-model="threshold"
                      class="mt-0 pt-0"
                      dense
                      label="Thr"
                      type="number"
                      min="0"
                      max="255"
                      step="5"
                      :disabled="!current_image || isCropMode"
                    />
                  </v-card-actions>
                  <v-card-actions>
                    <template v-if="!isCropMode">
                      <v-btn
                        :disabled="!current_image || isCropMode"
                        small
                        dense
                        color="primary"
                        @click="onLatticeButton">
                        Grid
                      </v-btn>
                    </template>
                  </v-card-actions>
                  <v-card-actions>
                    <template v-if="isCropMode">
                      <v-btn
                      :disabled="!current_image || !isCropMode"
                      small
                      dense
                      color="primary"
                      @click="onCropButton">
                      Crop
                      </v-btn>
                    </template>
                    </v-card-actions>
              </v-card>
              <v-card flat width="5vw">
                <v-card-actions>
                  <v-checkbox
                    class="mt-0 pt-0"
                    dense
                    v-model="orientation.horizontal_flip"
                    :disabled="!current_image"
                    label="H.Flip"
                    @change="loadImage()"/>
                </v-card-actions>
                <v-card-actions>
                  <v-checkbox
                    class="mt-0 pt-0"
                    dense
                    v-model="orientation.vertical_flip"
                    :disabled="!current_image"
                    label="V.Flip"
                    @change="loadImage()"/>
                </v-card-actions>
                <v-card-actions>
                  <v-text-field
                    v-model="orientation.rotation"
                    class="mt-0 pt-0"
                    dense
                    label="Rotation"
                    type="number"
                    min="0"
                    max="360"
                    step="90"
                    :disabled="!current_image"
                    @input="loadImage()"/>
                </v-card-actions>
                <template v-if="!isCropMode">
                  <v-card-actions><v-checkbox dense v-model="isCropMode" :disabled="!current_image" label="Crop"/></v-card-actions>
                  <v-card-actions><v-checkbox dense v-model="isBrushMode" :disabled="roi.polygons.length < 1 || isCropMode" label="Brush"/></v-card-actions>
                  <v-card-actions><v-checkbox dense v-model="isEraseMode" :disabled="!isBrushMode || isCropMode" label="Erase"/></v-card-actions>
                  <v-card-actions><v-checkbox dense v-model="atfilter" :disabled="!current_image || isCropMode" label="Threshold"/></v-card-actions>
                  <v-card-actions>
                    <v-btn
                    :disabled="!(atpixels && roi.polygons.length > 0) || !current_image.image.alternative_src"
                    small
                    dense
                    color="primary"
                    @click="autoFill">
                    Autofill
                    </v-btn>
                  </v-card-actions>
                </template>
              </v-card>
            </v-row>
          </v-container>
      </v-col>
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
import { snackbar } from '@/components/GlobalSnackbar';
import { get_uuid, generateRouteByQuery, objectToArray, splitarray } from '@/utils';
import { ROI } from './roi';
import { Crop } from './crop';
import { Circle, Point } from './types';

const clientReady = new Promise((resolve) => {
  const ready = computed(() => (
    store.state.client !== null
  ));
  watchEffect(() => {
    if (ready.value) { resolve(true); }
  });
});
const headers = [
  { text: 'ID', value: 'id' },
];
const metaHeaders = [
  { text: 'Field', value: 'key' },
  { text: 'Value', value: 'value' },
];
const metaItemLists = {
  types: ['FF', 'FFPE', 'EFPE'],
  species: ['Mouse', 'Human', 'Rat', 'Hamster'],
  assays: ['mRNA', 'Protein', 'ATAC', 'H3K27me3', 'H3K4me3', 'H3K27ac'],
  trimming: ['Yes', 'No'],
  numChannels: [50, 100],
};
interface Metadata {
  points: number[] | null;
  run: string | null;
  blockSize: number | null;
  threshold: number | null;
  type: string | null;
  species: string | null;
  trimming: string | null;
  assay: string | null;
  numChannels: number | null;
  orientation: any | null;
  crop_area: any | null;
}

export default defineComponent({
  name: 'AtlasBrowser',
  props: ['query'],
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const allFiles = ref<any[]>([]);
    const currentRoute = computed(() => ctx.root.$route);
    const items = ref<any[]>([]);
    const matta = ref<any[]>([]);
    const search = ref<string | null>();
    const selected = ref<any | null>();
    const run_id = ref<string | null>(null);
    const width = window.innerWidth;
    const height = window.innerHeight;
    let imageWidth = Math.round(width - ((width / 12) * 2));
    const konvaConfig = ref<any>({ width: Math.round(imageWidth * 0.7333), height });
    const circleConfig = ref<any>({ x: 120, y: 120, radius: 5, fill: 'green', draggable: true });
    const brushConfig = ref<any>({ x: null, y: null, radius: 20, fill: null, stroke: 'red' });
    const isBrushMode = ref(false);
    const isCropMode = ref(true);
    const cropFlag = ref(false);
    const isEraseMode = ref(false);
    const brushSize = ref(20);
    const brushDown = ref(false);
    const crop = ref<Crop>(new Crop(null));
    const roi = ref<ROI>(new ROI(null));
    const lines = ref<Konva.Line[]>();
    const activePointId = ref<string | null>(null);
    // const polygons = ref<any[] | null>([]);
    const isMouseDown = ref(false);
    const stageWidth = ref(window.innerWidth);
    const stageHeight = ref(window.innerHeight);
    const current_image = ref<any | null>(null);
    const scaleFactor = ref(0.15);
    const atfilter = ref(false);
    const atpixels = ref<any[] | null>([]);
    const threshold = ref(210);
    const loading = ref<boolean>(false);
    const taskStatus = ref<any>();
    const progressMessage = ref<string | null>(null);
    const taskTimeout = ref<number | null>(null);
    const orientation = ref<any>({ horizontal_flip: false, vertical_flip: false, rotation: 0 });
    // Metadata
    const metadata = ref<Metadata>({
      points: null,
      run: null,
      blockSize: null,
      threshold: null,
      type: 'FFPE',
      species: 'Mouse',
      trimming: 'Yes',
      assay: 'mRNA',
      numChannels: 50,
      orientation: null,
      crop_area: null,
    });
    function initialize() {
      current_image.value = null;
      roi.value = new ROI(null);
      crop.value = new Crop(null);
      roi.value.setScaleFactor(scaleFactor.value);
      crop.value.setScaleFactor(scaleFactor.value);
      isBrushMode.value = false;
      isEraseMode.value = false;
      atfilter.value = false;
      isCropMode.value = true;
      orientation.value = { horizontal_flip: false, vertical_flip: false, rotation: 0 };
    }
    function pushByQuery(query: any) {
      const newRoute = generateRouteByQuery(currentRoute, query);
      const shouldPush: boolean = router.resolve(newRoute).href !== currentRoute.value.fullPath;
      if (shouldPush) router.push(newRoute);
    }
    // io
    async function loadMetadata() {
      if (!client.value) return;
      loading.value = true;
      const root = 'data';
      const filename = `${root}/${run_id.value}/out/Gene/raw/spatial/metadata.json`;
      const pos_filename = `${root}/${run_id.value}/out/Gene/raw/spatial/tissue_positions_list.csv`;
      const payload = { params: { filename } };
      const resp = await client.value.getJsonFile(payload);
      const pos_payload = { params: { filename: pos_filename } };
      const resp_pos = await client.value.getCsvFile(pos_payload);
      if (resp) {
        snackbar.dispatch({ text: 'Metadata loaded from existing spatial directory', options: { color: 'success', right: true } });
        metadata.value = resp;
        if (metadata.value.points) {
          const partitioned = splitarray(metadata.value.points, 2);
          const roi_coords: Point[] = partitioned.map((v: number[]) => ({ x: v[0], y: v[1] }));
          metadata.value.trimming = 'Yes';
          metadata.value.numChannels = 50;
          roi.value.setCoordinates(roi_coords);
        }
        if (metadata.value.orientation) {
          orientation.value = metadata.value.orientation;
        }
        if (resp_pos) {
          roi.value.loadTixels(resp_pos);
          snackbar.dispatch({ text: 'Tixel data loaded from existing spatial directory', options: { color: 'success', right: true } });
        }
      } else {
        snackbar.dispatch({ text: 'Failed to load metadata', options: { color: 'warning', right: true } });
      }
      loading.value = false;
    }
    async function loadImage() {
      if (!client.value) return;
      loading.value = true;
      const root = 'data';
      const filename = `${root}/${run_id.value}/images/postB_BSA.tif`;
      const filenameList = { params: { path: 'data', bucket: 'atx-cloud-dev', filter: `${run_id.value}/images` } };
      try {
        const img = await client.value.getImageAsJPG({ params: { filename, hflip: orientation.value.horizontal_flip, vflip: orientation.value.vertical_flip, rotation: orientation.value.rotation } });
        allFiles.value = await client.value.getFileList(filenameList);
        const imgObj = new window.Image();
        imgObj.src = URL.createObjectURL(img);
        const scalefactor = 0.15;
        if (imgObj) {
          imgObj.onload = (ev: any) => {
            // const scalefactor = (ctx as any).refs.canvas._data.stageWidth / imgObj.width;
            current_image.value = {
              x: 0,
              y: 0,
              draggable: false,
              scale: { x: scalefactor, y: scalefactor },
              image: imgObj,
              src: URL.createObjectURL(img),
              original_src: URL.createObjectURL(img),
              alternative_src: null,
            };
            // scaleFactor.value = scalefactor;
            loading.value = false;
          };
        }
      } catch (error) {
        loading.value = false;
        snackbar.dispatch({ text: 'Failed to load the image file', options: { color: 'error', right: true } });
      }
    }
    async function loadAll() {
      await loadMetadata();
      await loadImage();
    }

    function searchRuns(ev: any) {
      console.log(ev);
      console.log(items.value);
    }
    function handleResize(ev: any) {
      const v = scaleFactor.value;
      current_image.value.scale = { x: v, y: v };
      imageWidth = Math.round(window.innerWidth - ((window.innerWidth / 12) * 2));
      konvaConfig.value.width = Math.min(Math.round(imageWidth * 0.7333), v * current_image.value.image.width);
      konvaConfig.value.height = v * current_image.value.image.height;
      stageWidth.value = konvaConfig.value.width;
      stageHeight.value = konvaConfig.value.height;
    }
    // Cropping events
    function handleDragStart_Crop(ev: any) {
      const { id } = ev.target.attrs;
      activePointId.value = id;
    }
    function handleDragEnd_Crop(ev: any) {
      const { id } = ev.target.attrs;
      const pos = ev.target._lastPos;
      activePointId.value = null;
      // crop.value.generateRect();
    }
    function handleDragMove_Crop(ev: any) {
      const { id } = ev.target.attrs;
      const pos = ev.target._lastPos;
      if (pos.x > 5 && pos.y > 5 && pos.x < current_image.value.image.width && pos.y < current_image.value.image.height) {
        crop.value.coordinates[id].x = pos.x;
        crop.value.coordinates[id].y = pos.y;
      } else {
        crop.value.coordinates[id].x = Math.min(Math.max(0, pos.x), stageWidth.value);
        crop.value.coordinates[id].y = Math.min(Math.max(0, pos.y), stageHeight.value);
      }
    }
    function handleDragCenterStart_Crop(ev: any) {
      // crop.value.polygons = [];
    }
    function handleDragCenterEnd_Crop(ev: any) {
      // console.log(ev);
    }
    function handleDragCenterMove_Crop(ev: any) {
      crop.value.moveToNewCenter(ev.target._lastPos, stageWidth.value, stageHeight.value);
    }
    // ROI events
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
      // console.log(ev);
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
      // console.log('OnResize');
    }
    function onLatticeButton(ev: any) {
      generateLattices(ev);
      setBrushMode(true);
    }
    function onCropButton(ev: any) {
      isCropMode.value = false;
      cropFlag.value = true;
    }
    const checkTaskStatus = async (task_id: string) => {
      if (!client.value) return;
      taskStatus.value = await client.value.getTaskStatus(task_id);
    };
    async function generateSpatial() {
      if (!client.value) return;
      if (!roi.value) return;
      try {
        progressMessage.value = null;
        loading.value = true;
        const task = 'atlasbrowser.generate_spatial';
        const queue = 'joshua_atlasbrowser';
        const coords = roi.value.getCoordinatesOnImage();
        const points: number[] = [];
        coords.forEach((v, i) => {
          points.push(v.x);
          points.push(v.y);
        });
        metadata.value = Object.assign(metadata.value, {
          points,
          run: run_id.value,
          blockSize: null,
          threshold: threshold.value,
          trimming: null,
          numChannels: null,
          orientation: orientation.value,
          crop_area: crop.value.getCoordinatesOnImage(),
        });
        const params = {
          run_id: run_id.value,
          root_dir: 'data',
          files: allFiles.value,
          crop_area: crop.value.getCoordinatesOnImage(),
          mask: roi.value.getMask(),
          metadata: metadata.value,
          scalefactors: roi.value.getQCScaleFactors(current_image.value),
          orientation: orientation.value,
        };
        // console.log(params);
        const args: any[] = [params];
        const kwargs: any = {};
        const taskObject = await client.value.postTask(task, args, kwargs, queue);
        await checkTaskStatus(taskObject._id);
        /* eslint-disable no-await-in-loop */
        while (taskStatus.value.status !== 'SUCCESS' && taskStatus.value.status !== 'FAILURE') {
          if (taskStatus.value.status === 'PROGRESS') {
            progressMessage.value = `${taskStatus.value.progress}% - ${taskStatus.value.position}`;
          }
          await new Promise((r) => {
            taskTimeout.value = window.setTimeout(r, 1000);
          });
          taskTimeout.value = null;
          await checkTaskStatus(taskObject._id);
        }
        /* eslint-disable no-await-in-loop */
        if (taskStatus.value.status !== 'SUCCESS') {
          snackbar.dispatch({ text: 'Worker failed', options: { right: true, color: 'error' } });
          loading.value = false;
          return;
        }
        progressMessage.value = taskStatus.value.status;
        const resp = taskStatus.value.result;
        loading.value = false;
      } catch (error) {
        console.log(error);
        loading.value = false;
        snackbar.dispatch({ text: error, options: { right: true, color: 'error' } });
      }
    }
    function autoFill(ev: any) {
      roi.value.autoMask(atpixels.value, threshold.value);
    }
    function onChangeScale(ev: any) {
      const v = scaleFactor.value;
      current_image.value.scale = { x: v, y: v };
      konvaConfig.value.width = Math.min(Math.round(imageWidth * 0.7333), v * current_image.value.image.width);
      konvaConfig.value.height = v * current_image.value.image.height;
      stageWidth.value = konvaConfig.value.width;
      stageHeight.value = konvaConfig.value.height;
      roi.value.setScaleFactor(v);
      crop.value.setScaleFactor(v);
    }
    async function fetchFileList() {
      if (!client.value) {
        return;
      }
      items.value = [];
      search.value = '';
      loading.value = true;
      const fl_payload = { params: { path: 'data', bucket: 'atx-cloud-dev', filter: 'images/postB_BSA.tif' } };
      const filelist = await client.value.getFileList(fl_payload);
      const qc_data = filelist.map((v: string) => ({ id: v.split('/')[1] }));
      items.value = qc_data;
      console.log(items);
      loading.value = false;
    }
    async function selectAction(ev: any) {
      run_id.value = ev.id;
      pushByQuery({ component: 'AtlasBrowser', run_id: run_id.value });
    }
    watch(atfilter, async (v, ov) => {
      if (!current_image.value) return;
      const sv = scaleFactor.value;
      if (v) {
        if (current_image.value.image.alternative_src) {
          current_image.value.image.src = current_image.value.image.alternative_src;
          // current_image.value.scale = { x: sv, y: sv };
          onChangeScale(sv);
        } else {
          loading.value = true;
          getPixels(current_image.value.src, async (err, pixels) => {
            const thresholded = adaptiveThreshold(pixels);
            atpixels.value = thresholded;
            const b = blobStream();
            savePixels(thresholded, 'jpeg').pipe(b).on('finish', () => {
              const newsrc = b.toBlobURL('image/jpeg');
              current_image.value.image.original_src = current_image.value.image.src;
              current_image.value.image.src = newsrc;
              current_image.value.image.alternative_src = newsrc;
              // current_image.value.scale = { x: sv, y: sv };
              onChangeScale(sv);
              loading.value = false;
            });
          });
        }
      } else {
        current_image.value.image.src = current_image.value.image.original_src;
        // current_image.value.scale = { x: sv, y: sv };
        onChangeScale(sv);
      }
    });
    watch(isCropMode, (v) => {
      if (!isCropMode.value) {
        isBrushMode.value = false;
        atfilter.value = false;
        crop.value.setCoordinates(crop.value.getCoordinatesOnImage());
      } else {
        // console.log(crop.value.getCoordinates());
        // console.log(roi.value.getCoordinates());
      }
    });
    watch(brushSize, (v) => {
      brushConfig.value.radius = v;
    });
    watch(run_id, async (v, ov) => {
      initialize();
      await loadAll();
      window.addEventListener('resize', handleResize);
    });
    watch(current_image, (v) => {
      if (current_image.value) onChangeScale(scaleFactor.value);
    });
    const submenu = [
      {
        text: 'Save spatial data',
        icon: 'mdi-content-save',
        color: 'primary',
        tooltip: 'Save spatial data',
        click: () => {
          generateSpatial();
        },
      },
    ];
    onMounted(async () => {
      await clientReady;
      store.commit.setSubmenu(submenu);
      window.addEventListener('resize', handleResize);
      await fetchFileList();
      if (props.query) {
        if (props.query.run_id) {
          await selectAction({ id: props.query.run_id });
        }
      }
    });
    return {
      allFiles,
      run_id,
      metadata,
      metaItemLists,
      items,
      matta,
      headers,
      selectAction,
      search,
      selected,
      konvaConfig,
      circleConfig,
      brushConfig,
      handleDragStart_Crop,
      handleDragEnd_Crop,
      handleDragMove_Crop,
      handleDragCenterStart_Crop,
      handleDragCenterEnd_Crop,
      handleDragCenterMove_Crop,
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
      crop,
      cropFlag,
      roi,
      objectToArray,
      generateLattices,
      current_image,
      loadImage,
      searchRuns,
      onResize,
      stageWidth,
      initialize,
      generateSpatial,
      isCropMode,
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
      loading,
      orientation,
      onLatticeButton,
      onCropButton,
    };
  },
});

</script>

<style>
.center-progress {
  position: absolute;
  z-index: 999;
  top: 36%;
  left: 45%;
}
.toolRow {
  height: 5vh;
}
.mainStage {
  height: 81vh;
  overflow : auto;
}
</style>
