<template>
<!--     <v-card ref="mainCard"> -->
  <v-app class="main">
    <v-row>
      <v-col cols="12" sm="2" class="pl-6 pt-3">
        <template v-if="run_id && optionFlag">
          <v-card>
            <v-slider
              v-model="scaleFactor"
              class="pl-2"
              dense
              height="20"
              label="Scale"
              type="number"
              min="0.1"
              max=".7"
              step="0.005"
              :disabled="!current_image"
              @change="onChangeScale"></v-slider>
            <v-list dense class="mt-n3 pt-0 pl-2">
              <v-subheader style="font-size:14px;font-weight:bold;text-decoration:underline;">Orientation</v-subheader>
              <v-btn
              x-small
              dense
              color="primary"
              :disabled="isCropMode || grid"
              @click="horizontalFlip();loadImage()">
              H.Flip
              </v-btn>
              <v-btn
              x-small
              color="primary"
              dense
              :disabled="isCropMode || grid"
              @click="verticalFlip();loadImage()">
              V.Flip
              </v-btn>
              <v-text-field
                v-model="orientation.rotation"
                dense
                style="width:100px"
                class="mt-5 pt-0"
                label="Rotation"
                type="number"
                min="0"
                max="360"
                step="90"
                :disabled="!current_image || isCropMode || grid"
                @input="loadImage()"/>
            </v-list>
            <v-list dense class="mt-n4 pt-0 pl-2">
              <v-subheader style="font-size:14px;font-weight:bold;text-decoration:underline;">Cropping</v-subheader>
              <v-btn
                dense
                color="primary"
                x-small
                @click="isCropMode=true"
                :disabled="isCropMode || grid">
                Activate
              </v-btn>
              <v-btn
                :disabled="!current_image || !isCropMode || cropFlag"
                x-small
                dense
                class="mt-0 pt-0"
                color="primary"
                @click="onCropButton">
                Crop
              </v-btn>
            </v-list>
            <v-list dense class="mt-n1 pt-0 pl-2">
              <v-subheader style="font-size:14px;font-weight:bold;text-decoration:underline;">ROI</v-subheader>
              <v-btn
                dense
                color="primary"
                x-small
                @click="grid=true"
                :disabled="!current_image || grid || !cropFlag">
                Activate
              </v-btn>
              <v-btn
                :disabled="!current_image || !grid || spatial || optionUpdate"
                x-small
                dense
                color="primary"
                @click="onLatticeButton">
                Grid
              </v-btn>
            </v-list>
              <v-list dense class="mt-n1 pt-0 pl-2">
                <v-subheader style="font-size:14px;font-weight:bold;text-decoration:underline;">Thresholding</v-subheader>
                <v-checkbox dense v-model="atfilter" :disabled="!current_image || !grid || spatial" label="Threshold"/>
                <v-text-field
                  v-model="threshold"
                  class="mt-0 pt-0"
                  style="width:100px"
                  dense
                  label="Thr"
                  type="number"
                  min="0"
                  max="255"
                  step="5"
                  :disabled="!current_image || !grid || spatial || optionUpdate"
                />
              </v-list>
            <v-list dense class="pt-0 pl-2">
              <v-subheader style="font-size:14px;font-weight:bold;text-decoration:underline;">On/Off</v-subheader>
              <v-btn
              :disabled="!(atpixels && roi.polygons.length > 0) || !current_image.image.alternative_src || spatial || optionUpdate"
              x-small
              dense
              color="primary"
              @click="autoFill">
              Autofill
              </v-btn>
              <v-checkbox dense v-model="isBrushMode" :value="isBrushMode" :disabled="roi.polygons.length < 1 || !onOff || spatial" label="Fill"/>
              <v-checkbox dense v-model="isEraseMode" :value="isEraseMode" :disabled="roi.polygons.length < 1 || !onOff || spatial" label="Erase"/>
              <v-text-field
                v-model="brushSize"
                style="width:100px"
                dense
                label="Br.Size"
                type="number"
                min="5.0"
                max="100.0"
                step="3.0"
                :disabled="!current_image || !grid || spatial"
              />
              <template v-if="spatial && !loadingMessage && grid">
                <v-btn
                x-small
                dense
                color="primary"
                @click="generateh5ad()">
                Generate h5ad file
                </v-btn>
              </template>
            </v-list>
          </v-card>
        </template>
        <v-card height="38vh">
          <v-card-title>
            <v-text-field
              v-model="search"
              dense
              prepend-inner-icon="mdi-magnify"
              :value="searchInput"
              @input="searchInput = $event; searchRuns(searchInput)"
            />
          </v-card-title>
          <v-data-table
            v-model="selected"
            height="30vh"
            width="30%"
            dense
            single-select
            :loading="loading"
            :items="itemsHolder"
            :headers="headers"
            hide-default-footer
            sort-by="id"
            @click:row="selectAction"
          />
        </v-card>
        <v-card v-if="run_id && !loading && !optionFlag && csvHolder">
          <v-card-text>{{ run_id }} has already been processed. Would you like to reprocess or update the On/Off label </v-card-text>
          <v-card-actions>
            <v-btn
              dense
              color="primary"
              @click="optionFlag=true;optionCreate=true;"
              class="ml-7"
              x-small>
              Reprocess
            </v-btn>
            <v-btn
              dense
              color="primary"
              @click="optionFlag=true;optionUpdate=true;loadImage();uploadingTixels()"
              x-small>
              Update
            </v-btn>
          </v-card-actions>
        </v-card>
        <v-card v-if="!csvHolder || optionFlag">
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
              v-model="metadata.numChannels"
              :items="metaItemLists.numChannels"
              dense
              outlined
              label="Barcode"
              @change="updateChannels">
            </v-select>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="9">
          <v-container fluid>
            <template v-if="loading && !loadingMessage">
              <div class="center-progress">
                <v-progress-circular
                  :size="100"
                  :width="10"
                  color="primary"
                  indeterminate>
                </v-progress-circular>
              </div>
            </template>
            <template v-if="loadingMessage">
              <v-dialog
                value=true
                hide-overlay
                persistent
                width="600"
                height=600>
                <v-card
                  color="primary"
                  dark>
                  <v-card-text>
                    Confirm cropping and orientation of images
                    <v-progress-linear
                      v-model="one"
                      buffer-value="0"
                      height="10"
                      stream
                      color="white"
                      class="mb-0">
                    </v-progress-linear>
                  </v-card-text>
                  <v-card-text>
                    Accessing and Retriving data from the Database
                    <v-progress-linear
                      v-model="two"
                      buffer-value="0"
                      height="10"
                      stream
                      color="white"
                      class="mb-0">
                    </v-progress-linear>
                  </v-card-text>
                  <v-card-text>
                    Updating Database and uploading spatial folder
                    <v-progress-linear
                    v-model="three"
                      buffer-value="0"
                      height="10"
                      stream
                      color="white"
                      class="mb-0">
                    </v-progress-linear>
                  </v-card-text>
                </v-card>
              </v-dialog>
            </template>
             <template v-if="generating">
              <v-dialog
                value=true
                hide-overlay
                persistent
                width="600"
                height=200>
                <v-card
                  color="primary"
                  dark>
                  <v-card-text>
                    Generating h5ad file
                    <v-progress-linear
                      v-model="four"
                      buffer-value="0"
                      height="10"
                      stream
                      color="white"
                      class="mb-0">
                    </v-progress-linear>
                  </v-card-text>
                </v-card>
              </v-dialog>
            </template>
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
                    v-if="grid"
                    ref="roiLayer"
                    id="roiLayer"
                    @mouseup="handleMouseUp">
                    <template v-if="current_image && !loading">
                      <template v-if="!optionUpdate">
                        <v-line
                          :config="roi.generateBoundary()"/>
                      </template>
                      <v-shape v-for="p in roi.polygons"
                        :config="p"
                        v-bind:key="p.id"
                        @transformend="roi.setScaleFactor()"
                        @mousedown="handleMouseDown"
                        @mouseover="handleMouseOver"/>
                        <v-transformer ref="transformer" />
                        <template v-if="!isBrushMode && !isEraseMode && !optionUpdate">
                          <v-circle
                            v-for="c in roi.getAnchors()"
                            v-bind:key="c.id"
                            @dragstart="handleDragStart"
                            @dragend="handleDragEnd"
                            @dragmove="handleDragMove"
                            :config="c"/>
                        </template>
                        <v-circle v-if="!isBrushMode && !isEraseMode && !optionUpdate"
                          v-bind:key="roi.getCenterAnchor().id"
                          @dragstart="handleDragCenterStart"
                          @dragend="handleDragCenterEnd"
                          @dragmove="handleDragCenterMove"
                          :config="roi.getCenterAnchor()"/>
                        />
                    </template>
                  </v-layer>
                    <v-layer
                      v-if="isCropMode && !grid && !cropFlag"
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
                        v-if="isBrushMode || isEraseMode"
                        :config="brushConfig"
                        @mousedown="handleMouseDownBrush"
                        @mouseup="handleMouseUpBrush"
                      />
                    </v-layer>
                  </v-stage>
                </v-card>
                <v-spacer>
                </v-spacer>
            </v-row>
          </v-container>
      </v-col>
    </v-row>
  </v-app>
<!--     </v-card> -->
</template>

<script lang='ts'>

import { ref, watch, defineComponent, computed, onMounted, watchEffect } from '@vue/composition-api';
import lodash, { pad, trim } from 'lodash';
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
import template from '../../_empty/template.vue';

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
  numChannels: ['50', '50 v2'],
};
interface Metadata {
  points: number[] | any;
  run: string | null;
  blockSize: number | null;
  threshold: number | null;
  type: string | null;
  species: string | null;
  assay: string | null;
  numChannels: string | null;
  orientation: any | null;
  crop_area: any | null;
  barcodes: number | null;
}

export default defineComponent({
  components: { template },
  name: 'AtlasBrowser',
  props: ['query'],
  setup(props, ctx) {
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const allFiles = ref<any[]>([]);
    const currentRoute = computed(() => ctx.root.$route);
    const items = ref<any[]>([]);
    const itemsHolder = ref<any[]>([]);
    const searchInput = ref<any[]>([]);
    const search = ref<string | null>();
    const selected = ref<any | null>();
    const run_id = ref<string | null>(null);
    const width = window.innerWidth;
    const height = window.innerHeight;
    const konvaConfig = ref<any>({ width, height });
    const circleConfig = ref<any>({ x: 120, y: 120, radius: 5, fill: 'green', draggable: true });
    const brushConfig = ref<any>({ x: null, y: null, radius: 20, fill: null, stroke: 'red' });
    const isBrushMode = ref(false);
    const isCropMode = ref(false);
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
    const one = ref(0);
    const two = ref(0);
    const three = ref(0);
    const four = ref(0);
    const atfilter = ref(false);
    const atpixels = ref<any[] | null>([]);
    const threshold = ref(210);
    const loading = ref<boolean>(false);
    const loadingMessage = ref<boolean>(false);
    const taskStatus = ref<any>();
    const taskStatush5 = ref<any>();
    const progressMessage = ref<string | null>(null);
    const taskTimeout = ref<number | null>(null);
    const orientation = ref<any>({ horizontal_flip: false, vertical_flip: false, rotation: 0 });
    const channels = ref(50);
    const barcodes = ref(1);
    const onOff = ref<boolean>(false);
    const grid = ref<boolean>(false);
    const cropFlag = ref<boolean>(false);
    const thresh = ref<boolean>(false);
    const spatial = ref<boolean>(false);
    const csvHolder = ref<any>();
    const optionCreate = ref<boolean>(false);
    const optionUpdate = ref<boolean>(false);
    const optionFlag = ref<boolean>(false);
    const generating = ref<boolean>(false);
    const scaleFactor_json = ref<any>({
      fiducial_diameter_fullres: null,
      spot_diameter_fullres: null,
      tissue_hires_scalef: null,
      tissue_lowres_scalef: null,
    });
    // Metadata
    const metadata = ref<Metadata>({
      points: [],
      run: null,
      blockSize: null,
      threshold: null,
      type: 'FFPE',
      species: 'Mouse',
      assay: 'mRNA',
      numChannels: '50',
      orientation: null,
      crop_area: null,
      barcodes: 1,
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
      isCropMode.value = false;
      grid.value = false;
      cropFlag.value = false;
      thresh.value = false;
      spatial.value = false;
      onOff.value = false;
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
      loadingMessage.value = false;
      const root = 'data';
      const filename = `${root}/${run_id.value}/images/spatial/metadata.json`;
      const scale_filename = `${root}/${run_id.value}/images/spatial/scalefactors_json.json`;
      const pos_filename = `${root}/${run_id.value}/images/spatial/tissue_positions_list.csv`;
      const payload = { params: { filename } };
      const resp = await client.value.getJsonFile(payload);
      const pos_payload = { params: { filename: pos_filename } };
      const resp_pos = await client.value.getCsvFile(pos_payload);
      const scale_payload = { params: { filename: scale_filename } };
      const scale_pos = await client.value.getJsonFile(scale_payload);
      scaleFactor_json.value = scale_pos;
      csvHolder.value = resp_pos;
      metadata.value = resp;
      if (resp) {
        optionFlag.value = false;
        snackbar.dispatch({ text: 'Metadata loaded from existing spatial directory', options: { color: 'success', right: true } });
      } else {
        optionFlag.value = true;
        snackbar.dispatch({ text: 'Failed to load metadata', options: { color: 'warning', right: true } });
      }
    }
    async function loadImage() {
      if (!client.value) return;
      loading.value = true;
      loadingMessage.value = false;
      const root = 'data';
      let filename: any;
      if (optionUpdate.value) {
        // filename = `${root}/${run_id.value}/images/spatial/tissue_hires_image.png`;
        filename = `${root}/${run_id.value}/images/spatial/figure/postB_BSA.tif`;
      } else {
        filename = `${root}/${run_id.value}/images/postB_BSA.tif`;
      }
      const filenameList = { params: { path: 'data', filter: `${run_id.value}/images` } };
      try {
        const img = await client.value.getImageAsJPG({ params: { filename, hflip: orientation.value.horizontal_flip, vflip: orientation.value.vertical_flip, rotation: orientation.value.rotation } });
        allFiles.value = await client.value.getFileList(filenameList);
        const imgObj = new window.Image();
        imgObj.src = URL.createObjectURL(img);
        const scalefactor = 0.1;
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
          };
        }
        loading.value = false;
      } catch (error) {
        loading.value = false;
        snackbar.dispatch({ text: 'Failed to load the image file', options: { color: 'error', right: true } });
      }
    }
    async function loadAll() {
      await loadMetadata();
      await loadImage();
      loading.value = false;
    }

    function searchRuns(ev: any) {
      const stringforRegex = ev;
      const updated = [];
      const regex = new RegExp(`${stringforRegex}[a-zA-z]*[0-9]*`);
      for (let i = 0; i < items.value.length; i += 1) {
        if (regex.test(items.value[i].id)) {
          updated.push(items.value[i]);
        }
      }
      itemsHolder.value = updated;
    }
    function horizontalFlip(ev: any) {
      orientation.value.horizontal_flip = !orientation.value.horizontal_flip;
    }
    function verticalFlip(ev: any) {
      orientation.value.vertical_flip = !orientation.value.vertical_flip;
    }
    function uploadingTixels(ev: any) {
      grid.value = true;
      cropFlag.value = true;
      onOff.value = true;
      const partitioned = splitarray(metadata.value.points, 2);
      const roi_coords: Point[] = partitioned.map((v: number[]) => ({ x: v[0], y: v[1] }));
      roi.value.setCoordinates(roi_coords);
      orientation.value = metadata.value.orientation;
      roi.value.loadTixels(csvHolder.value);
    }
    function updateChannels(ev: any) {
      if (/50/.test(ev)) {
        channels.value = 50;
        barcodes.value = 1;
        if (/v2/.test(ev)) {
          barcodes.value = 2;
        }
      } else {
        barcodes.value = 1;
        channels.value = 100;
      }
    }
    function handleResize(ev: any) {
      const v = scaleFactor.value;
      if (current_image.value) {
        current_image.value.scale = { x: v, y: v };
        konvaConfig.value.width = v * current_image.value.image.width;
        konvaConfig.value.height = v * current_image.value.image.height;
        stageWidth.value = konvaConfig.value.width;
        stageHeight.value = konvaConfig.value.height;
      } else {
        konvaConfig.value.width = v * stageWidth.value;
        konvaConfig.value.height = v * stageHeight.value;
        stageWidth.value = konvaConfig.value.width;
        stageHeight.value = konvaConfig.value.height;
      }
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
      if (isBrushMode.value || isEraseMode.value) {
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
      }
      if (isBrushMode.value) {
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
    }
    function onResize(ev: any) {
      // console.log('OnResize');
    }
    function onLatticeButton(ev: any) {
      generateLattices(ev);
    }
    function onCropButton(ev: any) {
      cropFlag.value = true;
      isCropMode.value = true;
    }
    const checkTaskStatus = async (task_id: string) => {
      if (!client.value) return;
      taskStatus.value = await client.value.getTaskStatus(task_id);
      taskStatush5.value = await client.value.getTaskStatus(task_id);
    };
    async function generateReport(ev: any) {
      //
    }
    const updateProgress = async (value: number) => {
      if (!client.value) return;
      let valueone: any;
      let valuetwo: any;
      let valuethree: any;
      if (value > 0 && value <= 40 && one.value <= 100) {
        valueone = setTimeout(() => {
          if (one.value === 100) {
            clearTimeout(valueone);
          }
          one.value += 20;
        }, 1000);
      }

      if (value > 40 && value < 80 && two.value <= 100) {
        valuetwo = setTimeout(() => {
          if (two.value === 100) {
            clearTimeout(valuetwo);
          }
          two.value += 20;
        }, 1000);
      }

      if (value >= 80 && three.value <= 100) {
        valuethree = setTimeout(() => {
          if (three.value === 100) {
            clearTimeout(valuethree);
          }
          three.value += 50;
        }, 1000);
      }
    };
    const updateH5ad = async (value: number) => {
      if (!client.value) return;
      if (value === 20) {
        four.value = 20;
      }
      if (value === 40) {
        four.value = 40;
      }
      if (value === 60) {
        four.value = 60;
      }
      if (value === 80) {
        four.value = 80;
      }
      if (value === 100) {
        four.value = 100;
      }
    };
    async function generateh5ad() {
      if (!client.value) return;
      if (!spatial.value) return;
      try {
        const task = 'atlasbrowser.generate_h5ad';
        const queue = 'atxcloud_atlasbrowser';
        const params = {
          run_id: run_id.value,
          root_dir: 'data',
        };
        const args: any[] = [params];
        const kwargs: any = {};
        const taskObject = await client.value.postTask(task, args, kwargs, queue);
        generating.value = true;
        await checkTaskStatus(taskObject._id);
        /* eslint-disable no-await-in-loop */
        while (taskStatush5.value.status !== 'SUCCESS' && taskStatush5.value.status !== 'FAILURE') {
          if (taskStatush5.value.status === 'PROGRESS') {
            await updateH5ad(taskStatus.value.progress);
            progressMessage.value = `${taskStatush5.value.progress}% - ${taskStatush5.value.position}`;
          }
          await new Promise((r) => {
            taskTimeout.value = window.setTimeout(r, 1000);
          });
          taskTimeout.value = null;
          await checkTaskStatus(taskObject._id);
        }
        /* eslint-disable no-await-in-loop */
        if (taskStatush5.value.status !== 'SUCCESS') {
          generating.value = false;
          four.value = 0;
          snackbar.dispatch({ text: 'Worker failed', options: { right: true, color: 'error' } });
          loading.value = false;
          return;
        }
        await updateH5ad(taskStatus.value.progress);
        four.value = 0;
        generating.value = false;
      } catch (error) {
        console.log(error);
        generating.value = false;
        four.value = 0;
        snackbar.dispatch({ text: 'Error generating h5ad file', options: { right: true, color: 'error' } });
      }
    }
    async function generateSpatial() {
      if (!client.value) return;
      if (!roi.value) return;
      try {
        one.value = 0;
        two.value = 0;
        three.value = 0;
        loadingMessage.value = true;
        progressMessage.value = null;
        loading.value = true;
        spatial.value = true;
        const task = 'atlasbrowser.generate_spatial';
        const queue = 'atxcloud_atlasbrowser';
        const coords = roi.value.getCoordinatesOnImage();
        const cropCoords = crop.value.getCoordinatesOnImage();
        const points: number[] = [];
        coords.forEach((v, i) => {
          points.push(Math.abs(v.x - cropCoords[0]));
          points.push(Math.abs(v.y - cropCoords[1]));
        });
        metadata.value = Object.assign(metadata.value, {
          points,
          run: run_id.value,
          blockSize: null,
          threshold: threshold.value,
          numChannels: channels.value,
          orientation: orientation.value,
          crop_area: crop.value.getCoordinatesOnImage(),
          barcodes: barcodes.value,
        });
        const params = {
          run_id: run_id.value,
          root_dir: 'data',
          files: allFiles.value,
          crop_area: crop.value.getCoordinatesOnImage(),
          mask: roi.value.getMask(cropCoords),
          metadata: metadata.value,
          scalefactors: roi.value.getQCScaleFactors(current_image.value, cropCoords),
          orientation: orientation.value,
          barcodes: barcodes.value,
        };
        const args: any[] = [params];
        const kwargs: any = {};
        const taskObject = await client.value.postTask(task, args, kwargs, queue);
        await checkTaskStatus(taskObject._id);
        /* eslint-disable no-await-in-loop */
        while (taskStatus.value.status !== 'SUCCESS' && taskStatus.value.status !== 'FAILURE') {
          if (taskStatus.value.status === 'PROGRESS') {
            await updateProgress(taskStatus.value.progress);
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
          loadingMessage.value = false;
          return;
        }
        await updateProgress(taskStatus.value.progress);
        progressMessage.value = taskStatus.value.status;
        const resp = taskStatus.value.result;
        loading.value = false;
        loadingMessage.value = false;
        one.value = 0;
        two.value = 0;
        three.value = 0;
      } catch (error) {
        console.log(error);
        loading.value = false;
        loadingMessage.value = false;
        one.value = 0;
        two.value = 0;
        three.value = 0;
        spatial.value = false;
        snackbar.dispatch({ text: 'Error generating spatial folder', options: { right: true, color: 'error' } });
      }
    }
    function autoFill(ev: any) {
      roi.value.autoMask(atpixels.value, threshold.value);
      onOff.value = true;
    }
    function onChangeScale(ev: any) {
      const v = scaleFactor.value;
      current_image.value.scale = { x: v, y: v };
      konvaConfig.value.width = v * current_image.value.image.width;
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
      itemsHolder.value = [];
      search.value = '';
      loading.value = true;
      const fl_payload = { params: { path: 'data', filter: 'images/postB_BSA.tif' } };
      const filelist = await client.value.getFileList(fl_payload);
      const qc_data = filelist.map((v: string) => ({ id: v.split('/')[1] }));
      items.value = qc_data;
      itemsHolder.value = qc_data;
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
    watch(brushSize, (v) => {
      brushConfig.value.radius = v;
    });
    watch(isEraseMode, (v) => {
      if (v) {
        isBrushMode.value = false;
      }
    });
    watch(isBrushMode, (v) => {
      if (v) {
        isEraseMode.value = false;
      }
    });
    watch(run_id, async (v, ov) => {
      initialize();
      await loadAll();
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
      itemsHolder,
      searchInput,
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
      horizontalFlip,
      verticalFlip,
      crop,
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
      generateh5ad,
      generateReport,
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
      loadingMessage,
      orientation,
      onLatticeButton,
      onCropButton,
      one,
      two,
      three,
      four,
      channels,
      updateChannels,
      barcodes,
      onOff,
      spatial,
      scaleFactor_json,
      grid,
      thresh,
      cropFlag,
      csvHolder,
      uploadingTixels,
      optionCreate,
      optionUpdate,
      optionFlag,
      generating,
    };
  },
});

</script>

<style>
.center-progress {
  position: absolute;
  z-index: 999;
  top: 35%;
  left: 45%;
}
.toolRow {
  height: 5vh;
}
.mainStage {
  height: 90vh;
  overflow : auto;
}
.main {
  padding-top: 15px;
}
</style>
