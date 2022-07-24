<template>
<!--     <v-card ref="mainCard"> -->
  <v-app class="main">
    <v-container v-if="resolveAuthGroup(['admin','user'])" fluid>
      <v-row>
        <!-- search funtionality on press of magnifying glass -->
        <v-dialog
          v-if="runIdFlag"
          :value="runIdFlag"
          @click:outside="runIdFlag = !runIdFlag"
          hide-overlay>
          <v-card style="width:200px;position: absolute;z-index: 999;top:40px;left:85px;"
              :disabled="loading">
              <!-- Searching in text field -->
            <v-card-title>
              <v-text-field
                v-model="search"
                dense
                prepend-inner-icon="mdi-magnify"
                :value="searchInput"
                @input="searchInput = $event; searchRuns(searchInput)"
              />
            </v-card-title>
            <!-- display of available runs for selection -->
            <v-data-table
              v-model="selected"
              height="20vh"
              width="20%"
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
        </v-dialog>
        <!-- metdata panel -->
        <!-- to display must select icon and have either be csvHolder be empty and a runID selected or optionFlag be true. -->
        <v-dialog
          v-if="metaFlag && ((!csvHolder && run_id) || optionFlag)"
          :value="metaFlag"
          @click:outside="metaFlag = !metaFlag">
          <v-card  :disabled="loading"
          >
            <v-card-title
            class="justify-center">
              Run ID: {{run_id}}
            </v-card-title>
            <v-card-text>
              <v-text-field
                v-model="metadata.species"
                outlined
                dense
                label="Species"
                readonly
                >
              </v-text-field>
              <v-text-field
                v-model="metadata.organ"
                outlined
                dense
                label="Organ"
                readonly>
              </v-text-field>
              <v-text-field
              v-model="metadata.collaborator"
              label="Collaborator"
              readonly
              dense
              outlined
              >
              </v-text-field>
              <!-- <v-text-field
                v-model="metadata.type"
                outlined
                dense
                label="Type"
                readonly
                >
              </v-text-field> -->
              <v-text-field
                v-model="metadata.assay"
                outlined
                dense
                label="Assay"
                readonly>
              </v-text-field>
              <v-text-field
              v-model="metadata.diseaseState"
              outlined
              dense
              label="Disease State"
              @change="changeDiseaseState"
              readonly
              >
              </v-text-field>
              <v-text-field
              outlined
              dense
              label="Disease Name"
              v-model="metadata.diseaseName"
              v-if="metadata.diseaseState === 'Disease'"
              readonly
              >
              </v-text-field>
              <v-text-field
                v-model="metadata.barcodes"
                outlined
                dense
                label="Barcode"
                @change="updateChannels"
                readonly>
              </v-text-field>
              <v-text-field
              v-model="metadata.chip_resolution"
              outlined
              dense
              label="Chip Resolution"
              readonly>
              </v-text-field>
            </v-card-text>
          </v-card>
        </v-dialog>
        <v-col cols="12" sm="2" class="pl-6 pt-3">
          <!-- workflow menu -->
          <template v-if="run_id && optionFlag">
            <v-card>
              <!-- zoom slider -->
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
                <!-- rotation box -->
              <v-list dense class="mt-n3 pt-0 pl-2">
                <v-subheader style="font-size:14px;font-weight:bold;text-decoration:underline;">Rotation</v-subheader>
                <v-btn
                color="grey"
                class="leftRotate"
                :disabled="!current_image || isCropMode || grid"
                @click="rotate_image(0)"
                small
                >
                <img src="@/assets/images/rotate_left.png"
                width="24"
                height="24"/>
                </v-btn>
                <v-btn
                color="grey"
                class="spaced_btn"
                :disabled="!current_image || isCropMode || grid || degreeRotation == '45'"
                @click="rotate_image(1)"
                small
                >
                <img src="@/assets/images/rotate_right.png"
                width="24"
                height="24"/>
                </v-btn>
                <!-- <v-switch class="toggle_switch"
                label="45°"
                v-model = "degreeBoolean45"
                :disabled="!current_image || isCropMode || grid"
                >
                </v-switch> -->
                <label class="radio1"><input type="radio" v-model="degreeRotation" value='90'>90</label>
                <label class="radio2"><input type="radio" v-model="degreeRotation" value='45'>45</label>
              </v-list>
              <!-- cropping start and stop -->
              <v-list dense class="mt-n4 pt-0 pl-2">
                <v-subheader style="font-size:14px;font-weight:bold;text-decoration:underline;">Cropping</v-subheader>
                <v-btn
                  outlined
                  color="primary"
                  dense
                  x-small
                  @click="isCropMode=true"
                  :disabled="!current_image || isCropMode || grid">
                  Activate
                </v-btn>
                <v-btn
                  outlined
                  :disabled="!current_image || !isCropMode || cropFlag"
                  x-small
                  dense
                  class="mt-0 pt-0"
                  color="primary"
                  @click="onCropButton">
                  Confirm
                </v-btn>
              </v-list>
              <!-- ROI Location functionality -->
              <!-- <v-list dense class="mt-n1 pt-0 pl-2"> -->
                <v-list dense class="mt-n1 pt-0 pl-2">
                <v-subheader style="font-size:14px;font-weight:bold;text-decoration:underline;">ROI</v-subheader>
                <v-btn
                  outlined
                  class="mr-8"
                  dense
                  color="primary"
                  x-small
                  @click="finding_roi"
                  :disabled="!active_roi_available">
                  Activate
                </v-btn>
                <v-btn
                dense
                outlined
                color = "primary"
                x-small
                @click="generateLattices"
                :disabled="(!roi_active && !optionUpdate)|| roi.polygons.length > 0">
                  Display Grid
                </v-btn>
                <v-btn
                outlined
                dense
                color = "primary"
                x-small
                @click="hide_grid()"
                :disabled="roi.polygons.length === 0 || !grid">
                  Hide Grid
                </v-btn>
              </v-list>
                <v-list dense>
                  <v-subheader style="font-size:14px;font-weight:bold;text-decoration:underline;">Thresholding</v-subheader>
                  C value: {{ c_val }}
                   <v-slider
                  v-model="c_val"
                  class="slider"
                  step="1"
                  min="0"
                  max="25"
                  :disabled="!current_image || (!roi_active && !optionUpdate) || spatial"
                  >
                  </v-slider>
                   Neighborhood: {{ neighbor_size }}
                  <v-slider
                  :disabled="!current_image || (!roi_active && !optionUpdate) || spatial"
                  v-model="neighbor_size"
                  class="slider"
                  step="1"
                  min="0"
                  max="25"
                  >
                  </v-slider>
                  <v-btn
                  outlined
                  dense
                  color="primary"
                  @click="thresh_clicked"
                  small
                  :disabled="!current_image || (!roi_active && !optionUpdate) || spatial || thresh_same"
                  >
                  Threshold
                  </v-btn>
                </v-list>
              <v-list dense class="mt-n1 pt-0 pl-2">
                <v-subheader style="font-size:14px;font-weight:bold;text-decoration:underline;">Background Image</v-subheader>
                <v-btn
                outlined
                x-small
                color="primary"
                @click="display_bsa"
                :disabled="!thresh_image_created || bsa_image_disp || spatial"
                > BSA </v-btn>
                <v-btn
                outlined
                x-small
                color="primary"
                @click="display_bw"
                :disabled="!thresh_image_created || !bsa_image_disp || spatial"
                > BW </v-btn>
              </v-list>
              <v-list dense class="pt-0 pl-2">
                <v-subheader style="font-size:14px;font-weight:bold;text-decoration:underline;">On/Off</v-subheader>
                <v-btn
                outlined
                :disabled="!thresh_image_created || spatial"
                x-small
                dense
                color="primary"
                @click="autoFill">
                Autofill
                </v-btn>
                <v-checkbox dense v-model="isBrushMode" :value="isBrushMode" :disabled="!tixels_filled" label="Fill"/>
                <v-checkbox dense v-model="isEraseMode" :value="isEraseMode" :disabled="!tixels_filled" label="Erase"/>
                <v-text-field
                  v-model="brushSize"
                  style="width:100px"
                  dense
                  label="Br.Size"
                  type="number"
                  min="5.0"
                  max="100.0"
                  step="3.0"
                  :disabled="!tixels_filled"
                />
                <template>
                  <v-btn
                  :disabled="!tixels_filled"
                  outlined
                  x-small
                  dense
                  color="primary"
                  @click="handle_spatial_call()">
                  Generate Spatial Folder
                  </v-btn>
                  <v-btn
                  :disabled="!tixels_filled"
                  outlined
                  x-small
                  dense
                  color="primary"
                  @click="showSpatialFolder">
                  Show Spatial Folder
                  </v-btn>
                </template>
              </v-list>
            </v-card>
          </template>
          <v-card v-if="run_id && !loading && !optionFlag && csvHolder">
            <v-card-text>{{ run_id }} has already been processed. Would you like to reprocess or update the On/Off label </v-card-text>
            <v-card-actions>
              <v-btn
                outlined
                dense
                color="primary"
                @click="optionFlag=true;optionCreate=true;"
                x-small>
                Reprocess
              </v-btn>
              <v-btn
                outlined
                dense
                color="primary"
                @click="optionFlag=true;optionUpdate=true;tixels_filled=true; loadImage(); uploadingTixels()"
                x-small>
                Update
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        <!-- right section of the screen where images and loading screens are displayed -->
        <v-col cols="12" sm="9">
          <v-container>
            <!-- Loading message when saving spatial folder -->
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
                  <v-card-title>Progress</v-card-title>
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
            <v-row>
              <v-card>
                <!-- loading circle displayed on screen -->
                <template v-if="loading && !loadingMessage">
                <div :style="{ 'position': 'absolute', 'z-index': 999, 'top': '43%', 'left': '47%'}">
                  <v-progress-circular
                    :size="100"
                    :width="10"
                    color="primary"
                    indeterminate>
                  </v-progress-circular>
                </div>
                </template>
                <v-stage
                  v-if="!checkSpatial"
                  ref="konvaStage"
                  class="mainStage"
                  :config="konvaConfig"
                  v-resize="onResize"
                  @mousemove="handleMouseMoveStage">
                  <v-layer
                  id="WelcomeLayer"
                  v-if="welcome_screen">
                  <v-text
                  ref="text1"
                  :config="{
                    text: 'Welcome to AtlasXbrowser',
                    fontSize: 30,
                    align: 'center',
                    width: 1100,
                    padding: 25
                  }">
                  </v-text>
                  </v-layer>
                  <v-layer
                    v-if="current_image"
                    ref="imageLayer"
                    id="imageLayer">
                    <v-image
                      ref="image"
                      :config="current_image"
                    />
                  </v-layer>
                  <!-- ROI red box layer -->
                  <v-layer
                    v-if="grid"
                    ref="roiLayer"
                    id="roiLayer"
                    @mouseup="handleMouseUp">
                    <template v-if="current_image && !loading">
                      <template v-if="!optionUpdate && !isBrushMode && !isEraseMode">
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
                        <template v-if="!isBrushMode && !isEraseMode && !optionUpdate && !tixels_filled">
                          <v-circle
                            v-for="c in roi.getAnchors()"
                            v-bind:key="c.id"
                            @dragstart="handleDragStart"
                            @dragend="handleDragEnd"
                            @dragmove="handleDragMove"
                            :config="c"/>
                        </template>
                        <v-circle v-if="!isBrushMode && !isEraseMode && !optionUpdate && !tixels_filled"
                          v-bind:key="roi.getCenterAnchor().id"
                          @dragstart="handleDragCenterStart"
                          @dragend="handleDragCenterEnd"
                          @dragmove="handleDragCenterMove"
                          :config="roi.getCenterAnchor()"/>
                    </template>
                  </v-layer>
                    <v-layer
                      v-if="isCropMode && !grid && !cropFlag"
                      ref="cropLayer"
                      id="cropLayer"
                      @mouseup="handleMouseUp">
                      <template v-if="current_image && !loading">
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
            </v-row>
            <SpatialFolderViewer
            v-if="checkSpatial"
            :selectedRunID="run_id"
            :getFiles="checkSpatial"
            >
            </SpatialFolderViewer>
          </v-container>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
<!--     </v-card> -->
</template>

<script lang='ts'>

import { ref, watch, defineComponent, computed, onMounted, watchEffect, onUnmounted } from '@vue/composition-api';
import lodash, { pad, toInteger, trim } from 'lodash';
import Konva from 'konva';
import getPixels from 'get-pixels';
import savePixels from 'save-pixels';
import blobStream from 'blob-stream';
import adaptiveThreshold from 'adaptive-threshold';
import store from '@/store';
import { snackbar } from '@/components/GlobalSnackbar';
import { get_uuid, generateRouteByQuery, objectToArray, splitarray } from '@/utils';
import { resolveAuthGroup } from '@/utils/auth';
import { ROI } from './roi';
import { Crop } from './crop';
import { Circle, Point } from './types';
import SpatialFolderViewer from './SpatialFolderViewer.vue';
// import { resolve } from 'dns';

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
  types: [],
  species: [],
  organ: [],
  assays: ['mRNA', 'Protein', 'ATAC', 'H3K27me3', 'H3K4me3', 'H3K27ac'],
  barcode_file: ['1 (Normal)', '2 (Flipped B)', '3 (Flipped A)', '4 (Flipped A and B)'],
  resolution: ['10', '25', '50'],
  diseaseState: ['Normal', 'Disease'],
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
  barcodes: string | null;
  organ: string | null;
  diseaseState: string | null;
  diseaseName: string | null;
  collaborator: string | null;
  chip_resolution: number | null;
}

export default defineComponent({
  name: 'AtlasBrowser',
  props: ['query'],
  components: { SpatialFolderViewer },
  setup(props, ctx) {
    const welcome_screen = ref<boolean>(true);
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const allFiles = ref<any[]>([]);
    const currentRoute = computed(() => ctx.root.$route);
    const items = ref<any[]>([]);
    const itemsHolder = ref<any[]>([]);
    const searchInput = ref<any[]>([]);
    const search = ref<string | null>();
    const selected = ref<any | null>();
    const run_id = ref<string>('');
    const width = window.innerWidth;
    const height = window.innerHeight;
    const konvaConfig = ref<any>({ width, height });
    const circleConfig = ref<any>({ x: 120, y: 120, radius: 5, fill: 'green', draggable: true });
    const brushConfig = ref<any>({ x: null, y: null, radius: 20, fill: null, stroke: 'red' });
    const tixels_filled = ref<boolean>(false);
    const isBrushMode = ref(false);
    const isCropMode = ref(false);
    const isEraseMode = ref(false);
    const brushSize = ref(20);
    const brushDown = ref(false);
    const crop = ref<Crop>(new Crop([0, 0], 0.15));
    const roi = ref<ROI>(new ROI([0, 0], 0.15));
    const roi_active = ref<boolean>(false);
    const active_roi_available = ref<boolean>(false);
    const lines = ref<Konva.Line[]>();
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
    const no_thresh = ref(true);
    const thresh_image_created = ref<boolean>(false);
    const thresh_same = ref<boolean>(false);
    const saved_grid_state = ref<Map<string, boolean>>(new Map<string, boolean>());
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
    const runIdFlag = ref<boolean>(false);
    const runIDSelected = ref<boolean>(false);
    const metaFlag = ref<boolean>(false);
    const imageh = ref<any>();
    const c_val = ref<number>(7);
    const neighbor_size = ref<number>(7);
    const bsa_image_disp = ref<boolean>(true);
    const degreeRotation = ref<string>('90');
    const scaleFactor_json = ref<any>({
      fiducial_diameter_fullres: null,
      spot_diameter_fullres: null,
      tissue_hires_scalef: null,
      tissue_lowres_scalef: null,
    });
    const checkSpatial = ref<boolean>(false);
    const imageChannels = ref<Record<string, any>>();
    const missingGreen = ref<Uint8ClampedArray>(new Uint8ClampedArray(1));
    const imageDataObj = ref<ImageData>({ data: new Uint8ClampedArray([1]), width: 1, height: 1 });
    const bw_image = ref<any>();
    const company_image = ref<any | null>(null);
    const availableFiles = ref<any[]>([]);
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
      organ: null,
      orientation: null,
      crop_area: null,
      barcodes: 'Normal',
      chip_resolution: null,
      diseaseState: null,
      diseaseName: null,
      collaborator: null,
    });
    function initialize() {
      roi.value = new ROI([0, 0], scaleFactor.value);
      crop.value = new Crop([0, 0], scaleFactor.value);
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
      runIdFlag.value = false;
      loading.value = false;
      imageh.value = null;
      orientation.value = { horizontal_flip: false, vertical_flip: false, rotation: 0 };
      // metaFlag.value = false;
    }
    function changeDiseaseState() {
      if (metadata.value.diseaseState === 'Normal') {
        metadata.value.diseaseName = '';
      }
    }
    function pushByQuery(query: any) {
      const newRoute = generateRouteByQuery(currentRoute, query);
      const shouldPush: boolean = router.resolve(newRoute).href !== currentRoute.value.fullPath;
      if (shouldPush) router.push(newRoute);
    }
    const checkTaskStatus = async (task_id: string) => {
      if (!client.value) return;
      taskStatus.value = await client.value.getTaskStatus(task_id);
      taskStatush5.value = await client.value.getTaskStatus(task_id);
    };
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
    function assignMetadata(slimsData: any) {
      console.log(slimsData);
      metadata.value.organ = slimsData.cntn_cf_fk_organ;
      metadata.value.species = slimsData.cntn_cf_fk_species;
      metadata.value.chip_resolution = slimsData.Resolution;
      metadata.value.collaborator = slimsData.cntn_cf_source;
      metadata.value.assay = slimsData.cntn_cf_fk_workflow;
      metadata.value.diseaseName = slimsData.cntn_cf_disease;
      if (metadata.value.diseaseName == null) {
        metadata.value.diseaseState = 'Healthy';
      }
      metadata.value.barcodes = slimsData.cntn_cf_fk_barcodeOrientation;
      if (metadata.value.barcodes === '1 (normal)') {
        barcodes.value = 1;
      } else if (metadata.value.barcodes === '2 (reverseB)') {
        barcodes.value = 2;
      } else if (metadata.value.barcodes === '3 (reverseAB)') {
        barcodes.value = 4;
      } else {
        barcodes.value = 3;
      }
    }

    async function getMeta() {
      try {
        const root = 'data';
        const task = 'creation.create_files';
        const queue = 'creation_worker';
        const params = {
          data: null,
          path: `${root}/${run_id.value}`,
          file_type: 'json',
          file_name: 'metadata.json',
        };
        const args: any[] = [params];
        const kwargs: any = {};
        const name = `${root}/${run_id.value}/metadata.json`;
        const jsonFileName = { params: { filename: name } };
        const jsonBoolean = await client.value?.getJsonFile(jsonFileName);
        let slimsData: any;
        // if the json folder cannot be obtained from local server query slims
        if (!jsonBoolean) {
          loading.value = true;
          slimsData = await client.value!.getMetadataFromRunId(`${run_id.value}`);
          params.data = slimsData;
          const taskObject = await client.value!.postTask(task, args, kwargs, queue);
          await checkTaskStatus(taskObject._id);
          /* eslint-disable no-await-in-loop */
          while (taskStatus.value.status !== 'SUCCESS' && taskStatus.value.status !== 'FAILURE') {
            // console.log(args);
            progressMessage.value = `${taskStatus.value.progress}% - ${taskStatus.value.position}`;
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
          // if the metadata is able to be retrieved locally, assign it to slimsData
        } else {
          slimsData = jsonBoolean;
        }
        // function to assign the local metadata values to the slimsData object fields
        loading.value = false;
        assignMetadata(slimsData);
      } catch (error) {
        console.log(error);
        loading.value = false;
        snackbar.dispatch({ text: 'Failed to create metadata', options: { color: 'error', right: true } });
      }
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
      // if the json file is retrieved from server use that as metadata
      if (resp) {
        metadata.value = resp;
        // console.log(resp);
        optionFlag.value = false;
        snackbar.dispatch({ text: 'Metadata loaded from existing spatial directory', options: { color: 'success', right: true } });
        // otherwise call getMeta to query the API
      } else {
        await getMeta();
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
      // console.log(orientation.value.rotation);
      if (optionUpdate.value) {
        filename = `${root}/${run_id.value}/images/spatial/figure/postB.tif`;
      } else {
        filename = `${root}/${run_id.value}/images/postB_BSA.tif`;
      }
      const filenameList = { params: { path: 'data', filter: `${run_id.value}/images` } };
      try {
        const img = await client.value.getImageAsJPG({ params: { filename, rotation: orientation.value.rotation } });
        imageh.value = img;
        allFiles.value = await client.value.getFileList(filenameList);
        const imgObj = new window.Image();
        imgObj.src = URL.createObjectURL(img);
        const scalefactor = 0.1;
        if (imgObj) {
          imgObj.onload = (ev: any) => {
            current_image.value = {
              x: 0,
              y: 0,
              draggable: false,
              scale: { x: scalefactor, y: scalefactor },
              image: imgObj,
              src: imgObj.src,
              original_src: imgObj.src,
              alternative_src: null,
            };
          };
        }
        loading.value = false;
        runIdFlag.value = false;
      } catch (error) {
        console.log(error);
        loading.value = false;
        snackbar.dispatch({ text: 'Failed to load the image file', options: { color: 'error', right: true } });
      }
      // console.log(current_image.value.original_src);
    }
    async function loadAll() {
      await loadMetadata();
      await loadImage();
      loading.value = false;
    }

    function rotate_image(choice: number) {
      if (choice === 0) {
        console.log(degreeRotation);
        const rotationAmount = parseInt(degreeRotation.value, 10);
        orientation.value.rotation += rotationAmount;
      } else {
        orientation.value.rotation += 270;
      }
      loadImage();
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
      // console.log(orientation.value.rotation);
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
      if (current_image.value !== null) {
        current_image.value.scale = { x: v, y: v };
        konvaConfig.value.width = v * current_image.value.image.width;
        konvaConfig.value.height = v * current_image.value.image.height;
        stageWidth.value = konvaConfig.value.width;
        stageHeight.value = konvaConfig.value.height;
      } else {
        konvaConfig.value.width = stageWidth.value;
        konvaConfig.value.height = stageHeight.value;
      }
    }
    // Cropping events
    function handleDragStart_Crop(ev: any) {
      const { id } = ev.target.attrs;
    }
    function handleDragEnd_Crop(ev: any) {
      const { id } = ev.target.attrs;
      const pos = ev.target._lastPos;
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
      roi.value.polygons = [];
    }
    function handleDragEnd(ev: any) {
      const { id } = ev.target.attrs;
      const pos = ev.target._lastPos;
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
    function load_tixel_state() {
      for (let i = 0; i < roi.value.polygons.length; i += 1) {
        const ID = roi.value.polygons[i].id;
        roi.value.polygons[i].fill = saved_grid_state.value?.get(ID) ? 'red' : null;
      }
    }

    function generateLattices(ev: any) {
      roi.value.polygons = roi.value.generatePolygons();
      if (tixels_filled.value) {
        load_tixel_state();
      }
    }
    function onResize(ev: any) {
      // console.log('OnResize');
    }
    function onLatticeButton(ev: any) {
      generateLattices(ev);
    }
    function hide_grid() {
      if (tixels_filled.value) {
        for (let i = 0; i < roi.value.polygons.length; i += 1) {
          const polygon = roi.value.polygons[i];
          const ID = polygon.id;
          if (polygon.fill === 'red') {
            const assigned = saved_grid_state.value?.set(ID, true);
          } else {
            const assigned = saved_grid_state.value?.set(ID, false);
          }
        }
        roi.value.polygons = [];
      } else {
        roi.value.polygons = [];
      }
    }
    function extractChannels() {
      for (let i = 1; i < imageDataObj.value.data.length; i += 4) {
        if (i < imageDataObj.value.data.length) {
          // console.log(imageDataObj.value.data[i]);
          imageDataObj.value.data.set([0], i);
          // imageDataObj.value.data.set([0], i+1)
        }
      }
      // imageDataObj.value.data = missingGreen.value;
    }
    function onCropButton(ev: any) {
      cropFlag.value = true;
      isCropMode.value = true;
      active_roi_available.value = true;
      const coords = crop.value.getCoordinatesOnImage();
      const imgObj = new window.Image();
      const newImage = new window.Image();
      imgObj.src = URL.createObjectURL(imageh.value);
      const canvas = document.createElement('canvas');
      const ctxe = canvas.getContext('2d');
      imgObj.onload = (v: any) => {
        URL.revokeObjectURL(imgObj.src);
        canvas.width = coords[2] - coords[0];
        canvas.height = coords[3] - coords[1];
        ctxe!.drawImage(imgObj, coords[0], coords[1], coords[2] - coords[0], coords[3] - coords[1], 0, 0, coords[2] - coords[0], coords[3] - coords[1]);
        imageDataObj.value = ctxe!.getImageData(0, 0, canvas.width, canvas.height);
        // missingGreen.value = imageDataObj.value.data;
        console.log(missingGreen);
        extractChannels();
        canvas.toBlob((blob: any) => {
          newImage.src = URL.createObjectURL(blob);
          newImage.onload = (e: any) => {
            current_image.value = {
              x: 0,
              y: 0,
              draggable: false,
              scale: { x: scaleFactor.value, y: scaleFactor.value },
              image: newImage,
              src: newImage.src,
              original_src: newImage.src,
              alternative_src: null,
            };
          };
        });
      };
      // onChangeScale('');
      roi.value = new ROI([(coords[2] - coords[0]) * scaleFactor.value, (coords[3] - coords[1]) * scaleFactor.value], scaleFactor.value);
      onChangeScale('');
    }
    function finding_roi() {
      if (!no_thresh.value) {
        current_image.value.image.src = current_image.value.original_src;
      }
      grid.value = true;
      active_roi_available.value = false;
      roi_active.value = true;
      // no_thresh.value = false;
    }

    function clear_filled_tixels() {
      for (let i = 0; i < roi.value.polygons.length; i += 1) {
        roi.value.polygons[i].fill = null;
        const cleared = saved_grid_state.value?.clear();
      }
    }

    function imageDataToBlob() {
      console.log('here');
      const w = imageDataObj.value.width;
      const h = imageDataObj.value.height;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const context = canvas.getContext('2d');
      context!.putImageData(imageDataObj.value, 0, 0);
      return canvas.toDataURL();
      // return new Promise((resolve) => {
      //   canvas.toBlob(resolve);
      // })
    }
    function thresh_clicked() {
      if (!current_image.value) return;
      thresh_image_created.value = true;
      const sv = scaleFactor.value;
      // loading.value = true;
      let img_src = current_image.value.image.original_src;
      if (bsa_image_disp.value) {
        img_src = current_image.value.image.src;
      }
      const url = imageDataToBlob();
      // console.log(blob);
      getPixels(url, async (err, pixels) => {
        const compensation = Number(c_val.value);
        const size = Number(neighbor_size.value);
        const thresholded = adaptiveThreshold(pixels, { compensation, size });
        atpixels.value = thresholded;
        const b = blobStream();
        savePixels(thresholded, 'jpeg').pipe(b).on('finish', () => {
          const newsrc = b.toBlobURL('image/jpeg');
          if (bsa_image_disp.value) {
            current_image.value.image.original_src = current_image.value.image.src;
          }
          current_image.value.image.src = newsrc;
          current_image.value.image.alternative_src = newsrc;
          current_image.value.scale = { x: sv, y: sv };
          onChangeScale(sv);
          thresh_same.value = true;
          loading.value = false;
          bsa_image_disp.value = false;
        });
      });
      // setting the filled grid back to default state
      if (tixels_filled.value) {
        clear_filled_tixels();
        tixels_filled.value = false;
      }
      tixels_filled.value = false;
    }
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
          one.value += 50;
        }, 1000);
      }

      if (value > 40 && value < 80 && two.value <= 100) {
        valuetwo = setTimeout(() => {
          if (two.value === 100) {
            clearTimeout(valuetwo);
          }
          two.value += 50;
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
        const queue = 'jonah_browser';
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
    async function showSpatialFolder() {
      checkSpatial.value = true;
      console.log(this.run_id);
      // if (!client.value) {
      //   return;
      // }
      // if (run_id.value === null) {
      //   run_id.value = '';
      // }
      // const folder_path = 'data/'.concat(run_id.value);
      // const file_payload = { params: { path: folder_path } };

      // const run_files = await client.value.getFileList(file_payload);
      // availableFiles.value = run_files;
      // if (availableFiles.value.length === 0) {
      //   availableFiles.value.push('Run '.concat(run_id.value).concat(' has no associated files.'));
      // }
    }
    async function generateSpatial() {
      if (!client.value) return;
      try {
        one.value = 0;
        two.value = 0;
        three.value = 0;
        loadingMessage.value = true;
        progressMessage.value = null;
        loading.value = true;
        spatial.value = true;
        const task = 'atlasbrowser.generate_spatial';
        const queue = 'jonah_browser';
        const coords = roi.value.getCoordinatesOnImage();
        let cropCoords = crop.value.getCoordinatesOnImage();
        if (optionUpdate.value) {
          cropCoords = metadata.value.crop_area;
        }
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
          numChannels: channels.value,
          orientation: orientation.value,
          crop_area: cropCoords,
          barcodes: barcodes.value,
        });
        const params = {
          run_id: run_id.value,
          root_dir: 'data',
          files: allFiles.value,
          crop_area: cropCoords,
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
          console.log('failed');
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
    function handle_spatial_call() {
      if (!client.value) {
        snackbar.dispatch({ text: 'Client is not initialized', options: { right: true, color: 'error' } });
      } else if (!tixels_filled.value) {
        snackbar.dispatch({ text: 'Must complete image processing before genereating spatial folder', options: { right: true, color: 'error' } });
      } else {
        generateSpatial();
      }
    }
    function display_bsa() {
      current_image.value.image.src = current_image.value.image.original_src;
      bsa_image_disp.value = true;
    }
    function display_bw() {
      current_image.value.image.src = current_image.value.image.alternative_src;
      bsa_image_disp.value = false;
    }
    function autoFill(ev: any) {
      if (roi.value.polygons.length === 0) {
        roi.value.generatePolygons();
      }
      roi.value.autoMask(atpixels.value, threshold.value);
      onOff.value = true;
      tixels_filled.value = true;
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
      welcome_screen.value = false;
      run_id.value = ev.id;
      pushByQuery({ component: 'AtlasBrowser', run_id: run_id.value });
    }

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
      runIDSelected.value = true;
      initialize();
      await loadAll();
    });
    watch(current_image, (v) => {
      if (current_image.value && !isCropMode.value) {
        console.log('Cropping going on');
        crop.value = new Crop([scaleFactor.value * current_image.value.image.width, scaleFactor.value * current_image.value.image.height], scaleFactor.value);
        onChangeScale(scaleFactor.value);
      }
    });
    watch(c_val, (v, ov) => {
      if (v !== ov) {
        thresh_same.value = false;
      }
    });
    watch(neighbor_size, (v, ov) => {
      if (v !== ov) {
        thresh_same.value = false;
      }
    });
    watch(konvaConfig, (v, ov) => {
      console.log('konva stage changed');
    });
    const submenu = [
      {
        text: 'Run ID\'s',
        icon: 'mdi-magnify',
        tooltip: 'Run ID\'s',
        disabled: loading.value,
        click: () => {
          runIdFlag.value = !runIdFlag.value;
        },
      },
      {
        text: 'Metadata',
        icon: 'mdi-filter-variant',
        tooltip: 'Metadata',
        disabled: loading.value,
        click: () => {
          metaFlag.value = !metaFlag.value;
          if (runIDSelected.value === false) {
            console.log('error message');
            snackbar.dispatch({ text: 'Must select a Run ID', options: { right: true, color: 'error' } });
          }
        },
      },
      {
        text: 'Save spatial data',
        icon: 'mdi-content-save',
        color: 'primary',
        tooltip: 'Save spatial data',
        click: () => {
          handle_spatial_call();
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
    onUnmounted(async () => {
      window.removeEventListener('resize', handleResize);
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
      imageChannels,
      missingGreen,
      imageDataObj,
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
      runIdFlag,
      metaFlag,
      imageh,
      getMeta,
      resolveAuthGroup,
      welcome_screen,
      company_image,
      thresh_clicked,
      no_thresh,
      c_val,
      neighbor_size,
      active_roi_available,
      roi_active,
      finding_roi,
      thresh_image_created,
      display_bsa,
      bw_image,
      display_bw,
      thresh_same,
      tixels_filled,
      bsa_image_disp,
      handle_spatial_call,
      rotate_image,
      saved_grid_state,
      hide_grid,
      load_tixel_state,
      clear_filled_tixels,
      changeDiseaseState,
      degreeRotation,
      assignMetadata,
      imageDataToBlob,
      checkSpatial,
      showSpatialFolder,
      availableFiles,
    };
  },
});

</script>
<style scoped>
.leftRotate {
  margin-bottom: 50px;
}
.spaced_btn {
  margin-left: 10px;
  margin-bottom: 50px;
}
.radio1 {
  position: relative;
  top: 12px;
  right: 95px;
}
.radio2 {
  position: relative;
  top: 35px;
  right: 125px;

}
.toggle_switch {
  padding: 0;
  margin: 1;
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
