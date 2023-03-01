<template>
<!--     <v-card ref="mainCard"> -->
  <v-app class="main">
    <v-container v-if="resolveAuthGroup(['admin','user'])" fluid>
      <v-row>
        <!-- search funtionality on press of magnifying glass -->
        <v-dialog
          v-if="run_id_search_active"
          :value="run_id_search_active"
          @click:outside="run_id_search_active = !run_id_search_active"
          hide-overlay>
          <v-card style="width:200px;position: absolute;z-index: 999;top:40px;left:85px;"
          :disabled="loading"
          >
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
              height="20vh"
              width="20%"
              dense
              single-select
              :loading="loading"
              :items="run_id_folder_namesHolder"
              :headers="headers"
              hide-default-footer
              @click:row="run_folder_selected"
            />
          </v-card>
        </v-dialog>
        <!-- metdata panel -->
        <!-- to display must select icon and have either be tissue_position_list_obj be empty and a runID selected or image_processing_begun be true. -->
        <v-dialog
          width="600"
          height="800"
          v-if="image_processing_begun"
          :value="show_metadata"
          @click:outside="show_metadata = !show_metadata">
          <metadata-dropdown
          :metadata ="metadata"
          :drop_down_manager="drop_down_manager"
          :run_id="run_id"
          :lims_available="lims_available"
          > </metadata-dropdown>
        </v-dialog>
        <v-col cols="12" sm="2" class="pl-6 pt-3" v-if="!checkSpatial">
          <!-- workflow menu -->
          <template v-if="run_id && image_processing_begun">
            <!-- <v-card> -->
              <!-- zoom slider -->
              <v-slider
                v-model="scaleFactor"
                class="pl-2"
                dense
                height="20"
                label="Scale"
                type="number"
                min="0.1"
                max="0.8"
                step="0.005"
                :disabled="!current_image"
                @change="onChangeScale"></v-slider>
                <!-- rotation box -->
              <v-list dense class="mt-n3 pt-0 pl-2">
                <v-subheader style="font-size:14px;font-weight:bold;text-decoration:underline;">Rotation</v-subheader>
                <v-btn
                color="blue"
                class="leftRotate"
                :disabled="!current_image || isCropMode || grid || updating_existing || loading"
                @click="rotate_image(0)"
                small
                >
                <img src="@/assets/images/rotate_left.png"
                width="24"
                height="24"/>
                </v-btn>
                <v-btn
                color="blue"
                class="spaced_btn"
                :disabled="!current_image || isCropMode || grid || degreeRotation == '45' || updating_existing || loading"
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
                <label class="radio1"><input type="radio" v-model="degreeRotation" value='90' :disabled="!current_image || isCropMode || grid || updating_existing || loading">90</label>
                <label class="radio2"><input type="radio" v-model="degreeRotation" value='45' :disabled="!current_image || isCropMode || grid || updating_existing || loading">45</label>
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
                  :disabled="!current_image || isCropMode || grid || updating_existing || loading">
                  Activate
                </v-btn>
                <v-btn
                  outlined
                  :loading="cropLoading"
                  :disabled="!current_image || !isCropMode || cropFlag"
                  x-small
                  dense
                  class="mt-0 pt-0"
                  color="primary"
                  @click="onCropButton()">
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
                :disabled="(!roi_active && !updating_existing)|| roi.polygons.length > 0">
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
                  :disabled="!current_image || (!roi_active && !updating_existing) || spatial"
                  >
                  </v-slider>
                   Neighborhood: {{ neighbor_size }}
                  <v-slider
                  :disabled="!current_image || (!roi_active && !updating_existing) || spatial"
                  v-model="neighbor_size"
                  class="slider"
                  step="1"
                  min="0"
                  max="25"
                  >
                  </v-slider>
                  <v-btn
                  :loading="threshLoading"
                  outlined
                  dense
                  color="primary"
                  @click="thresh_clicked"
                  small
                  :disabled="!current_image || (!roi_active && !updating_existing) || spatial || thresh_same"
                  >
                  Threshold
                  </v-btn>
                </v-list>
            <v-list dense class="mt-n1 pt-0 pl-2">
                <v-subheader style="font-size:14px;font-weight:bold;text-decoration:underline;">Background Image</v-subheader>
                <v-btn
                id="postB_button"
                outlined
                x-small
                color="primary"
                @click="change_image('postB')"
                :disabled="(!thresh_image_created && !updating_existing) || postB_image_displayed || spatial"
                >
                PostB
                </v-btn>
                <v-btn
                id="bsa_button"
                outlined
                x-small
                color="primary"
                @click="change_image('BSA')"
                :disabled="(!thresh_image_created && !updating_existing) || bsa_image_displayed || spatial"
                > BSA </v-btn>
                <v-btn
                id="bw_button"
                outlined
                x-small
                color="primary"
                @click="change_image('BW')"
                :disabled="!thresh_image_created || bw_image_displayed || spatial"
                > BW </v-btn>
              </v-list>
              <div :style="{ 'background-image': 'linear-gradient(to right, #000083, #016dbf, #05ffff, #cdff33)', 'display': 'flex' }" >
                <div v-for="anchor in color_gradient_scale_numbers" v-bind:key="`${anchor}`" :style="{'color': 'white', 'font-size': '18', 'font-weight': 'bold', 'width': '20%', 'texi-align': 'center' }">
                  {{anchor}}
                </div>
              </div>
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
                  :disabled="(!tixels_filled && !updating_existing)"
                  outlined
                  x-small
                  dense
                  color="primary"
                  @click="handle_spatial_call()">
                  Generate Spatial Folder
                  </v-btn>
                  <v-btn
                  class="vert-spaced-btn"
                  outlined
                  x-small
                  dense
                  color="red"
                  @click="showSpatialFolder">
                  Check Spatial Folder
                  </v-btn>
                </template>
              </v-list>
            <!-- </v-card> -->
          </template>
          <v-dialog
          persistent
          :value="prompt_to_use_existing_spatial"
          max-width="800px"
          >
          <v-card>
            <v-card-title
            class="justify-center"
            >
            {{ run_id }} Spatial Folder Found. </v-card-title>
            <v-card-title
            class="justify-center"
            >
            Would you like to update the existing spatial folder or reprocess the image?
            </v-card-title>
            <v-card-actions
            class="justify-center"
            >
              <v-btn
                outlined
                dense
                color="primary"
                @click="get_image_options(run_id);prompt_to_use_existing_spatial = false;"
                medium>
                Reprocess
              </v-btn>
              <v-btn
                outlined
                dense
                color="primary"
                @click="prompt_to_use_existing_spatial = false; updating_existing=true;tixels_filled=true; loadImage(); uploadingTixels()"
                medium>
                Update
              </v-btn>
            </v-card-actions>
          </v-card>
          </v-dialog>
          <v-dialog
          persistent
          :value="selecting_counts_pos_file"
          max-width="800px"
          >
            <v-card>
              <v-card-title
              class="justify-center"
              >
              Select tissue positions file with counts if available.
              </v-card-title>
              <v-card-actions>
              </v-card-actions>
            </v-card>
          </v-dialog>
          <v-dialog
          persistent
          :value="!image_processing_begun && file_options.length > 1 && !prompt_to_use_existing_spatial"
          max-width="800px"
          >
          <v-card>
            <v-card-title
            class="justify-center"
            > Multiple Images Found.  </v-card-title>
            <v-card-title
            class="justify-center"
            > Please select the BSA image to be used for processing. </v-card-title>
            <v-card-actions
            class="justify-center"
            >
            <v-col>
              <v-select
                v-model="full_bsa_filename"
                :items="file_options"
                label="Select Image"
                outlined
                dense
                color="primary"
                small>
              </v-select>
              <v-btn
              :disabled="full_bsa_filename === ''"
              style="position: relative; left: 50%; transform: translateX(-50%);"
              outlined
              @click="show_metadata = true; loadImage();"
              >
              Submit
              </v-btn>
            </v-col>
            </v-card-actions>
          </v-card>
          </v-dialog>
        </v-col>
        <!-- right section of the screen where images and loading screens are displayed -->
        <v-col cols="12" sm="9" v-if="!checkSpatial">
          <v-container>
            <template v-if="loadingMessage">
              <div :style="{ 'position': 'absolute', 'z-index': 999, 'top': '43%', 'left': '47%'}">
                <v-card-text>
                </v-card-text>
                <!-- <v-progress-circular
                  :size="100"
                  :width="10"
                  color="primary"
                  indeterminate>
                </v-progress-circular> -->
              <v-dialog
                value=true
                hide-overlay
                persistent
                width="600"
                >
                <v-card
                  color="primary"
                  dark>
                  <v-card-title> Creating and Saving Spatial Folder</v-card-title>
                  <v-card-text>
                    <v-progress-linear
                      v-model="one"
                      buffer-value="0"
                      height="10"
                      stream
                      color="white"
                      class="mb-0">
                    </v-progress-linear>
                  </v-card-text>
                </v-card>
                </v-dialog>
              </div>
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
                  v-if="!checkSpatial && !welcome_screen"
                  ref="konvaStage"
                  class="mainStage"
                  :config="konvaConfig"
                  @mousemove="handleMouseMoveStage">
                  <v-layer
                    v-if="current_image"
                    ref="imageLayer"
                    id="imageLayer"
                    @click="imageClick"
                    >
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
                      <template v-if="!updating_existing && !isBrushMode && !isEraseMode">
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
                        <template v-if="!isBrushMode && !isEraseMode && !updating_existing && !tixels_filled">
                          <v-circle
                            v-for="c in roi.getAnchors()"
                            v-bind:key="c.id"
                            @dragstart="handleDragStart"
                            @dragmove="handleDragMove"
                            :config="c"/>
                        </template>
                        <v-circle v-if="!isBrushMode && !isEraseMode && !updating_existing && !tixels_filled"
                          v-bind:key="roi.getCenterAnchor().id"
                          @dragstart="handleDragCenterStart"
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
                        <!-- config of the rectangle, being the cropping square -->
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
          </v-container>
        </v-col>
        <v-col cols="12" sm="12">
        <SpatialFolderViewer
        v-if="checkSpatial"
        :root="root"
        :bucket_name="bucket_name"
        :selectedRunID="run_id"
        :getFiles="checkSpatial"
        >
        </SpatialFolderViewer>
        </v-col>
        <v-col cols="12" sm="12"
        justify="center"
        v-if="welcome_screen"
        >
        <v-img
        class="center"
        src="@/assets/images/atlasbg.png"
        width="width"
        height="height"
        >
        </v-img>
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
import config from '@/config';
import colormap from 'colormap';
import { snackbar } from '@/components/GlobalSnackbar';
import { get_uuid, generateRouteByQuery, objectToArray, splitarray } from '@/utils';
import { resolveAuthGroup } from '@/utils/auth';
import Selector from '@/views/Home/components/settings/admin/modules/submodules/Selector.vue';
import { DropDownFieldManager } from '@/views/Home/components/settings/admin/modules/submodules/DropDownFieldManager';
import { FileRequest } from '@/types';
import { ROI } from './AtlasBrowserComponents/roi';
import { Crop } from './AtlasBrowserComponents/crop';
import { Circle, Point, Metadata, tissue_position_list_ele_counts } from './types';
import SpatialFolderViewer from './AtlasBrowserComponents/SpatialFolderViewer.vue';
import MetadataDropdown from './AtlasBrowserComponents/MetadataDropdown.vue';
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
const assay_dict: Record<string, any> = {
  cut_n_tag: 'CUT&Tag',
  'wt_dbit-seq': 'Transcriptome',
  'ATAC-seq': 'ATAC-seq',
  'atac-seq': 'ATAC-seq',
};

export default defineComponent({
  name: 'AtlasBrowser',
  props: ['query'],
  components: { SpatialFolderViewer, Selector, MetadataDropdown },
  setup(props, ctx) {
    // Parameters for changing which bucket images are being pulled to and written to
    // s3 bucket to connect to
    const bucket_name = computed(() => config.atlasxbrowser.bucket_name);
    const root = computed(() => config.atlasxbrowser.root_dir);
    const lims_available = computed(() => config.atlasxbrowser.lims_available);
    // root directory of that s3 bucket
    const welcome_screen = ref<boolean>(true);
    const drop_down_manager = new DropDownFieldManager();
    const router = ctx.root.$router;
    const client = computed(() => store.state.client);
    const allFiles = ref<any[]>([]);
    const currentRoute = computed(() => ctx.root.$route);
    const run_id_folder_names = ref<any[]>([]);
    const run_id_folder_namesHolder = ref<any[]>([]);
    const searchInput = ref<any[]>([]);
    const search = ref<string | null>();
    const run_id = ref<string>('');
    const full_bsa_filename = ref<string>('');
    const file_options = ref<any[]>([]);
    const konvaConfig = ref<any>({ width_window: window.innerWidth, height_window: window.innerHeight });
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
    const isMouseDown = ref(false);
    const stageWidth = ref(window.innerWidth);
    const stageHeight = ref(window.innerHeight);
    const current_image = ref<any | null>(null);
    const postB_image_promise = ref<Promise<any>| null>(null);
    const postB_image = ref<any | null>(null);
    const scaleFactor = ref(0.15);
    const one = ref(0);
    const two = ref(0);
    const three = ref(0);
    const four = ref(0);
    const atpixels = ref<any[] | null>([]);
    const threshold = ref(210);
    const thresh_image_created = ref<boolean>(false);
    const thresh_same = ref<boolean>(false);
    const saved_grid_state = ref<Map<string, boolean>>(new Map<string, boolean>());
    const loading = ref<boolean>(false);
    const loadingMessage = ref<boolean>(false);
    const taskStatus = ref<any>();
    const progressMessage = ref<string | null>(null);
    const taskTimeout = ref<number | null>(null);
    const orientation = ref<any>({ horizontal_flip: false, vertical_flip: false, rotation: 0 });
    const channels = ref(50);
    const grid = ref<boolean>(false);
    const cropFlag = ref<boolean>(false);
    const cropLoading = ref<boolean>(false);
    const threshLoading = ref<boolean>(false);
    const spatial = ref<boolean>(false);
    const tissue_position_list_obj = ref<any>();
    const tixel_color_mapping = ref<Record<number, string>>({});
    const prompt_to_use_existing_spatial = ref<boolean>(false);
    const selecting_counts_pos_file = ref<boolean>(false);
    const updating_existing = ref<boolean>(false);
    const image_processing_begun = ref<boolean>(false);
    const run_id_search_active = ref<boolean>(false);
    const runIDSelected = ref<boolean>(false);
    const show_metadata = ref<boolean>(false);
    // value used to store the loaded image to be used for cropping
    const bsa_blob = ref<any>();
    const c_val = ref<number>(7);
    const neighbor_size = ref<number>(7);
    const bsa_image_displayed = ref<boolean>(true);
    const bw_image_displayed = ref<boolean>(false);
    const postB_image_displayed = ref<boolean>(false);
    const degreeRotation = ref<string>('90');
    const scaleFactor_json = ref<any>({
      fiducial_diameter_fullres: null,
      spot_diameter_fullres: null,
      tissue_hires_scalef: null,
      tissue_lowres_scalef: null,
    });
    const checkSpatial = ref<boolean>(false);
    const bw_image = ref<any>();
    const company_image = ref<any | null>(null);
    const availableFiles = ref<any[]>([]);
    const bsa_image = ref<any>();
    const black_white = ref<string>();
    const color_gradient_scale_numbers = ref<number[]>([0, 1, 2, 3, 4]);
    // Metadata
    const metadata = ref<Metadata>({
      points: [],
      run: null,
      blockSize: null,
      cValue: null,
      threshold: null,
      tissue_type: null,
      species: null,
      assay: null,
      numChannels: '50',
      organ: null,
      orientation: null,
      crop_area: null,
      barcodes: null,
      chip_resolution: null,
      tissueBlockExperiment: '',
      tissue_source: '',
      comments_flowB: '',
      crosses_flowB: [],
      blocks_flowB: [],
      leak_flowB: '',
      comments_flowA: '',
      crosses_flowA: [],
      blocks_flowA: [],
      leak_flowA: '',
      sampleID: '',
      onTissueTixels: null,
      antibody: '',
    });
    function initialize() {
      roi.value = new ROI([0, 0], scaleFactor.value);
      crop.value = new Crop([0, 0], scaleFactor.value);
      roi.value.setScaleFactor(scaleFactor.value);
      crop.value.setScaleFactor(scaleFactor.value);
      active_roi_available.value = false;
      checkSpatial.value = false;
      roi_active.value = false;
      isBrushMode.value = false;
      isEraseMode.value = false;
      thresh_image_created.value = false;
      thresh_same.value = false;
      tixels_filled.value = false;
      isCropMode.value = false;
      grid.value = false;
      cropFlag.value = false;
      spatial.value = false;
      run_id_search_active.value = false;
      loading.value = false;
      bsa_blob.value = null;
      updating_existing.value = false;
      orientation.value = { horizontal_flip: false, vertical_flip: false, rotation: 0 };
      full_bsa_filename.value = '';
      image_processing_begun.value = false;
    }
    function imageClick(ev: any) {
      // console.log(scaleFactor.value);
      // console.log('y: '.concat((ev.evt.layerY / scaleFactor.value).toString()));
      // console.log(ev.evt.layerX / scaleFactor.value);
      // console.log(ev);
    }
    function pushByQuery(query: any) {
      const newRoute = generateRouteByQuery(currentRoute, query);
      const shouldPush: boolean = router.resolve(newRoute).href !== currentRoute.value.fullPath;
      if (shouldPush) router.push(newRoute);
    }
    const checkTaskStatus = async (task_id: string) => {
      if (!client.value) return;
      taskStatus.value = await client.value.getTaskStatus(task_id);
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
      try {
        metadata.value.organ = slimsData.cntn_cf_fk_organ;
        metadata.value.species = slimsData.cntn_cf_fk_species;
        metadata.value.chip_resolution = slimsData.Resolution;
        metadata.value.tissue_source = slimsData.cntn_cf_source;
        metadata.value.tissueBlockExperiment = slimsData.cntn_cf_experimentalCondition;
        metadata.value.sampleID = slimsData.cntn_cf_sampleId;
        metadata.value.antibody = slimsData.cntn_cf_fk_epitope;
        if (slimsData.cntn_cf_fk_workflow) {
          metadata.value.assay = assay_dict[String(slimsData.cntn_cf_fk_workflow)];
        }
        if (slimsData.cntn_cf_fk_barcodeOrientation === '1 (normal)') {
          metadata.value.barcodes = 1;
        } else if (slimsData.cntn_cf_fk_barcodeOrientation === '2 (reverseB)') {
          metadata.value.barcodes = 2;
        } else if (slimsData.cntn_cf_fk_barcodeOrientation === '3 (reverseAB)') {
          metadata.value.barcodes = 4;
        } else if (slimsData.cntn_cf_fk_barcodeOrientation === '4 (reverseA)') {
          metadata.value.barcodes = 3;
        }
        metadata.value.comments_flowB = slimsData.comments_flowB;
        metadata.value.crosses_flowB = slimsData.crosses_flowB;
        metadata.value.blocks_flowB = slimsData.blocks_flowB;
        metadata.value.leak_flowB = slimsData.leak_flowB;
        metadata.value.comments_flowA = slimsData.comments_flowA;
        metadata.value.crosses_flowA = slimsData.crosses_flowA;
        metadata.value.blocks_flowA = slimsData.blocks_flowA;
        metadata.value.leak_flowA = slimsData.leak_flowA;
        metadata.value.tissue_type = slimsData.cntn_cf_fk_tissueType;
      } catch (error) {
        console.log(error);
      }
    }
    async function getMeta() {
      try {
        loading.value = true;
        const slimsData = await client.value!.getMetadataFromRunId(`${run_id.value}`);
        // function to assign the local metadata values to the slimsData object fields
        loading.value = false;
        assignMetadata(slimsData);
      } catch (error) {
        loading.value = false;
        snackbar.dispatch({ text: 'Failed to create metadata', options: { color: 'error', right: true } });
      }
    }
    // io
    async function loadMetadata(): Promise<boolean> {
      if (!client.value) return false;
      run_id_search_active.value = false;
      loading.value = true;
      loadingMessage.value = false;
      // specify path to images within s3
      const filename = `${root.value}/${run_id.value}/spatial/metadata.json`;
      const scale_filename = `${root.value}/${run_id.value}/spatial/scalefactors_json.json`;
      // const pos_filename = `${root.value}/${run_id.value}/spatial/tissue_positions_list.csv`;
      // const pos_filename = `${root.value}/D1118/D01118_tissue_positions_list_counts.csv`;
      const payload = { params: { filename, bucket_name: bucket_name.value } };
      const resp = await client.value.getJsonFile(payload);
      // const pos_payload = { params: { filename: pos_filename, bucket_name: bucket_name.value } };
      // const resp_pos = await client.value.getCsvFile(pos_payload);
      const scale_payload = { params: { filename: scale_filename, bucket_name: bucket_name.value } };
      const scale_pos = await client.value.getJsonFile(scale_payload);
      // if the json file is retrieved from server use that as metadata
      // const meta_present = ((('status_code' in resp) && resp.status_code === 200) || !('status_code' in resp));
      // const pos_present = ((('status_code' in resp_pos) && resp_pos.status_code === 200) || !('status_code' in resp_pos));
      // const scale_present = ((('status_code' in scale_pos) && scale_pos.status_code === 200) || !('status_code' in scale_pos));
      const meta_present = resp !== 'Not-Found';
      // const pos_present = resp_pos !== 'Not-Found';
      const scale_present = scale_pos !== 'Not-Found';
      // if (false) {
      // if (meta_present && pos_present && scale_present) {
      if (meta_present && scale_present) {
        scaleFactor_json.value = scale_pos;
        // tissue_position_list_obj.value = resp_pos;
        loading.value = false;
        metadata.value = resp;
        snackbar.dispatch({ text: 'Metadata loaded from existing spatial directory', options: { color: 'success', right: true } });
        return true;
        // otherwise call getMeta to query the API
      }
      if (lims_available.value) {
        await getMeta();
        loading.value = false;
        snackbar.dispatch({ text: 'Metadata not found locally. Pulling from Slims.', options: { color: 'blue', right: true } });
      }
      return false;
    }
    function load_image_promise_jpg(pl: any): Promise<any> | null {
      if (!client.value) return null;
      const promise = client.value.getImageAsJPG(pl);
      return promise;
    }
    function loadGrayCropped(filename: string): Promise<any> | null {
      if (!client.value) return null;
      // path to image
      try {
        let c = crop.value.getCoordinatesOnImage();
        if (updating_existing.value) {
          c = metadata.value.crop_area;
        }
        const x1 = c[0];
        const y1 = c[1];
        const x2 = c[2];
        const y2 = c[3];
        const pl = { params: { bucket_name: bucket_name.value, filename, rotation: orientation.value.rotation, x1, x2, y1, y2 } };
        const promise = client.value.getGrayImageAsCroppedJPG(pl);
        return promise;
      } catch (error) {
        loading.value = false;
        return null;
      }
    }
    function set_current_image(blob: any) {
      const imgObj = new window.Image();
      imgObj.src = URL.createObjectURL(blob);
      const scalefactor = 0.1;
      if (imgObj) {
        imgObj.onload = (ev: any) => {
          current_image.value = {
            x: 0,
            y: 0,
            draggable: false,
            scale: { x: scalefactor, y: scalefactor },
            image: imgObj,
            src: null,
            original_src: null,
          };
          onChangeScale('');
        };
      }
      return imgObj;
    }
    async function loadImage() {
      if (!client.value) return;
      welcome_screen.value = false;
      image_processing_begun.value = true;
      loading.value = true;
      loadingMessage.value = false;
      let filename: any;
      let use_cache = false;
      // path to images
      if (updating_existing.value) {
        filename = `${root.value}/${run_id.value}/spatial/figure/postB_BSA.tif`;
        bsa_image_displayed.value = true;
        postB_image_displayed.value = false;
        bw_image_displayed.value = false;
        use_cache = true;
      } else {
        filename = full_bsa_filename.value;
      }
      const filenameList_pl = { path: `${root.value}/${run_id.value}/`, filter: [''], bucket: bucket_name.value, only_files: true };
      try {
        const pl = { params: { bucket_name: bucket_name.value, filename, rotation: orientation.value.rotation, use_cache } };
        const img = await client.value.getImageAsJPG(pl);
        bsa_blob.value = img;
        allFiles.value = await client.value.getFileList(filenameList_pl);
        const img_obj = set_current_image(img);
        bsa_image.value = img_obj.src;
        if (updating_existing.value) {
          const postB_figure_filename = `${root.value}/${run_id.value}/spatial/figure/postB.tif`;
          const pl_postB = { params: { rotation: 0, filename: postB_figure_filename, use_cache: 'true', bucket_name: bucket_name.value } };
          const pro = load_image_promise_jpg(pl_postB);
          if (pro) postB_image_promise.value = pro;
        }
        loading.value = false;
        run_id_search_active.value = false;
      } catch (error) {
        console.log(error);
        loading.value = false;
        snackbar.dispatch({ text: 'Failed to load the image file', options: { color: 'error', right: true } });
      }
      // console.log(current_image.value.original_src);
    }

    async function rotate_image(choice: number) {
      loading.value = true;
      if (choice === 0) {
        const rotationAmount = parseInt(degreeRotation.value, 10);
        orientation.value.rotation += rotationAmount;
      } else {
        orientation.value.rotation += 270;
      }
      const pl = { params: { filename: full_bsa_filename.value, bucket_name: bucket_name.value, use_cache: 'true', rotation: orientation.value.rotation } };
      const img = await client.value?.getImageAsJPG(pl);
      bsa_blob.value = img;
      set_current_image(img);
      loading.value = false;
    }
    function searchRuns(ev: any) {
      const stringforRegex = ev;
      const updated = [];
      const regex = new RegExp(`${stringforRegex}[a-zA-z]*[0-9]*`);
      for (let i = 0; i < run_id_folder_names.value.length; i += 1) {
        if (regex.test(run_id_folder_names.value[i].id)) {
          updated.push(run_id_folder_names.value[i]);
        }
      }
      run_id_folder_namesHolder.value = updated;
    }
    async function load_counts_positions() {
      const pl = { params: { bucket_name: 'atx-illumina', filename: 'Images/D1118/D01118_tissue_positions_list_counts.csv' } };
      const data = await client.value?.getCsvFile(pl);
      console.log(data);
      data.sort((x: any, y: any) => {
        const row_x = Number.parseInt(x[2], 10);
        const col_x = Number.parseInt(x[3], 10);
        const row_y = Number.parseInt(y[2], 10);
        const col_y = Number.parseInt(y[3], 10);
        // decided based on row:
        // x is less than y
        if (row_x > row_y) {
          return 1;
        }
        // x is greater than y
        if (row_x < row_y) {
          return -1;
        }
        // decided based on col:
        // x is less than y
        if (col_x > col_y) {
          return 1;
        }
        // x is greater than y
        return -1;
      });
      tissue_position_list_obj.value = data;
      const data_copy = JSON.parse(JSON.stringify(data));
      data_copy.sort((ele1: any, ele2: any) => {
        const counts_ele1 = ele1[7];
        const counts_ele2 = ele2[7];
        if (counts_ele1 > counts_ele2) {
          return 1;
        }
        if (counts_ele1 < counts_ele2) {
          return -1;
        }
        return 0;
      });
      const color_gradient = colormap({ colormap: 'jet', nshades: 100, format: 'hex' });
      const number_channels = Math.sqrt(data_copy.length);
      console.log(number_channels);
      for (let i = 0; i < data_copy.length; i += 1) {
        const pct = Math.floor((i / data_copy.length) * 100);
        const row = Number.parseInt(data_copy[i][2], 10);
        const col = Number.parseInt(data_copy[i][3], 10);
        console.log(row);
        console.log(col);
        const tixel_num = (row * number_channels) + col;
        tixel_color_mapping.value[tixel_num] = color_gradient[pct];
      }
      console.log(tixel_color_mapping);
    }
    function uploadingTixels(ev: any) {
      grid.value = true;
      cropFlag.value = true;
      const partitioned = splitarray(metadata.value.points, 2);
      // conversion of the x and y coordinates designated in the tissue_positions_list file
      // to being in memory of the app
      const roi_coords: Point[] = partitioned.map((v: number[]) => ({ x: v[0], y: v[1] }));
      roi.value.setCoordinates(roi_coords);
      orientation.value = metadata.value.orientation;
      roi.value.loadTixels(tissue_position_list_obj.value);
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
    function handleDragCenterMove_Crop(ev: any) {
      crop.value.moveToNewCenter(ev.target._lastPos, stageWidth.value, stageHeight.value);
    }
    // ROI events
    function handleDragStart(ev: any) {
      // console.log(ev);
      const { id } = ev.target.attrs;
      roi.value.polygons = [];
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
      grid.value = true;
      roi.value.polygons = roi.value.generatePolygons();
      if (tixels_filled.value) {
        load_tixel_state();
      }
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
      grid.value = false;
    }
    async function change_image(img: string) {
      bsa_image_displayed.value = false;
      postB_image_displayed.value = false;
      bw_image_displayed.value = false;
      let new_img = null;
      if (img === 'postB') {
        if (!postB_image.value && updating_existing.value && postB_image_promise.value != null) {
          await postB_image_promise.value.then((gray: any) => {
            postB_image.value = URL.createObjectURL(gray);
          });
        }
        new_img = postB_image.value;
        postB_image_displayed.value = true;
      } else if (img === 'BSA') {
        new_img = bsa_image.value;
        bsa_image_displayed.value = true;
      } else if (img === 'BW') {
        new_img = bw_image.value;
        bw_image_displayed.value = true;
      }
      current_image.value.image.src = new_img;
    }
    function onCropButton(ev: any) {
      const coords = crop.value.getCoordinatesOnImage();
      const { width, height } = current_image.value.image;
      const [x1, y1, x2, y2] = coords;
      if (x1 < 0 || y1 < 0 || x2 > width || y2 > height) {
        snackbar.dispatch({ text: 'Keeping Cropping on Image', options: { color: 'warning', right: true } });
      } else {
        const promise = loadGrayCropped(full_bsa_filename.value);
        if (promise) postB_image_promise.value = promise;
        cropLoading.value = true;
        cropFlag.value = true;
        isCropMode.value = true;
        active_roi_available.value = true;
        const imgObj = new window.Image();
        const newImage = new window.Image();
        imgObj.src = URL.createObjectURL(bsa_blob.value);
        const canvas = document.createElement('canvas');
        const ctxe = canvas.getContext('2d');
        imgObj.onload = (v: any) => {
          URL.revokeObjectURL(imgObj.src);
          canvas.width = coords[2] - coords[0];
          canvas.height = coords[3] - coords[1];
          ctxe!.drawImage(imgObj, coords[0], coords[1], coords[2] - coords[0], coords[3] - coords[1], 0, 0, coords[2] - coords[0], coords[3] - coords[1]);
          canvas.toBlob((blob: any) => {
            const img_obj = set_current_image(blob);
            bsa_image.value = img_obj.src;
            cropLoading.value = false;
          });
        };
        roi.value = new ROI([(coords[2] - coords[0]) * scaleFactor.value, (coords[3] - coords[1]) * scaleFactor.value], scaleFactor.value);
      }
    }
    function finding_roi() {
      grid.value = true;
      active_roi_available.value = false;
      roi_active.value = true;
    }

    function clear_filled_tixels() {
      for (let i = 0; i < roi.value.polygons.length; i += 1) {
        roi.value.polygons[i].fill = null;
        const cleared = saved_grid_state.value?.clear();
      }
    }

    function threshold_image(img_src: any) {
      threshLoading.value = true;
      thresh_image_created.value = true;
      const sv = scaleFactor.value;
      getPixels(img_src, async (err, pixels) => {
        const my_image = new window.Image();
        const compensation = Number(c_val.value);
        const size = Number(neighbor_size.value);
        const thresholded = adaptiveThreshold(pixels, { compensation, size });
        atpixels.value = thresholded;
        const b = blobStream();
        savePixels(thresholded, 'jpeg').pipe(b).on('finish', () => {
          const newsrc = b.toBlobURL('image/jpeg');
          my_image.src = newsrc;
          bw_image.value = newsrc;
          my_image.onload = (e: any) => {
            current_image.value = {
              x: 0,
              y: 0,
              draggable: false,
              scale: { x: scaleFactor.value, y: scaleFactor.value },
              image: my_image,
              src: null,
              original_src: null,
              alternative_src: null,
            };
            onChangeScale(sv);
          };
          thresh_same.value = true;
          loading.value = false;
          threshLoading.value = false;
          change_image('BW');
        });
      });
    }
    function thresh_clicked() {
      roi.value.fill_color_counts(tixel_color_mapping.value);
      // if (!current_image.value) return;
      // if (!postB_image_promise.value) return;
      // loading.value = true;
      // postB_image_promise.value.then((gray: any) => {
      //   const src = URL.createObjectURL(gray);
      //   postB_image.value = src;
      //   threshold_image(postB_image.value);
      // });
    }
    const updateProgress = async (value: number) => {
      if (!client.value) return;
      let valueone: any;
      let valuetwo: any;
      let valuethree: any;
      one.value = value;
    };
    async function showSpatialFolder() {
      checkSpatial.value = true;
    }
    async function generateSpatial() {
      if (!client.value) return;
      if (!metadata.value.barcodes) {
        snackbar.dispatch({ text: 'Must Select Barcode File Before Generating Spatial Folder', options: { color: 'warning', right: true } });
        return;
      }
      try {
        one.value = 0;
        two.value = 0;
        three.value = 0;
        loadingMessage.value = true;
        progressMessage.value = null;
        loading.value = true;
        const task = 'atlasbrowser.generate_spatial';
        // const queue = 'atxcloud_atlasbrowser';
        const queue = 'jonah_browser';
        const coords = roi.value.getCoordinatesOnImage();
        let cropCoords = crop.value.getCoordinatesOnImage();
        if (updating_existing.value) {
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
          blockSize: neighbor_size.value,
          threshold: threshold.value,
          cValue: c_val.value,
          numChannels: channels.value,
          orientation: orientation.value,
          crop_area: cropCoords,
          barcodes: metadata.value.barcodes,
          tissueBlockExperiment: metadata.value.tissueBlockExperiment,
          comments_flowB: metadata.value.comments_flowB,
          crosses_flowB: metadata.value.crosses_flowB,
          blocks_flowB: metadata.value.blocks_flowB,
          leaks_flowB: metadata.value.leak_flowB,
          comments_flowA: metadata.value.comments_flowA,
          crosses_flowA: metadata.value.crosses_flowA,
          blocks_flowA: metadata.value.blocks_flowA,
          leak_flowA: metadata.value.leak_flowA,
          onTissueTixels: roi.value.getOnTissue(),
        });
        const params = {
          run_id: run_id.value,
          files: allFiles.value,
          crop_area: cropCoords,
          mask: roi.value.getMask(cropCoords),
          metadata: metadata.value,
          scalefactors: roi.value.getQCScaleFactors(current_image.value, cropCoords),
          orientation: orientation.value,
          barcodes: metadata.value.barcodes,
          root_dir: root.value,
          bucket: bucket_name.value,
          bsa_filename: full_bsa_filename.value,
          updating_existing: updating_existing.value,
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
        snackbar.dispatch({ text: 'Spatial Folder Successfully Uploaded', options: { right: true, color: 'success' } });
        await updateProgress(taskStatus.value.progress);
        progressMessage.value = taskStatus.value.status;
        loading.value = false;
        loadingMessage.value = false;
        one.value = 0;
        two.value = 0;
        three.value = 0;
        spatial.value = true;
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
    function autoFill(ev: any) {
      grid.value = true;
      if (roi.value.polygons.length === 0) {
        roi.value.generatePolygons();
      }
      roi.value.autoMask(atpixels.value, threshold.value);
      tixels_filled.value = true;
    }
    async function fetchFileList() {
      if (!client.value) {
        return;
      }
      run_id_folder_names.value = [];
      run_id_folder_namesHolder.value = [];
      search.value = '';
      loading.value = true;
      const folder_pl = { bucket_name: bucket_name.value, prefix: `${root.value}/`, delimiter: '/' };
      const sub_folders = await client.value.getSubFolders(folder_pl);
      if (sub_folders) {
        const obj_data = sub_folders.map((sub_folder_name: string) => ({ id: sub_folder_name }));
        run_id_folder_names.value = obj_data;
      }
      run_id_folder_namesHolder.value = run_id_folder_names.value;
      loading.value = false;
    }
    async function selectAction(ev: any) {
      welcome_screen.value = false;
      run_id.value = ev.id;
      pushByQuery({ component: 'AtlasBrowser', run_id: run_id.value });
    }
    async function get_image_options(folder_name: string) {
      const pl = { bucket: bucket_name.value, path: `${root.value}/${folder_name}/`, delimiter: '/', filter: ['.tif', '.tiff', '.png', '.jpg', 'jpeg'] };
      file_options.value = await client.value?.getFileList(pl);
      if (file_options.value.length === 1) {
        [full_bsa_filename.value] = file_options.value;
        show_metadata.value = true;
        loadImage();
      } else if (file_options.value.length === 0) {
        snackbar.dispatch({ text: 'No images found in folder', options: { right: true, color: 'error' } });
      }
    }
    async function run_folder_selected(folder_name: any) {
      if (!clientReady) {
        return;
      }
      run_id.value = folder_name.id;
      initialize();
      prompt_to_use_existing_spatial.value = await loadMetadata();
      if (!prompt_to_use_existing_spatial.value) {
        get_image_options(folder_name.id);
      }
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
    watch(current_image, (v) => {
      if (current_image.value && !isCropMode.value) {
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
    const submenu = [
      {
        text: 'Run ID\'s',
        icon: 'mdi-magnify',
        tooltip: 'Run ID\'s',
        enabled: true,
        disabled: loading.value,
        click: () => {
          run_id_search_active.value = !run_id_search_active.value;
        },
      },
      {
        text: 'Metadata',
        icon: 'mdi-filter-variant',
        tooltip: 'Metadata',
        enabled: true,
        disabled: loading.value,
        click: () => {
          show_metadata.value = !show_metadata.value;
          if (!run_id.value) {
            console.log('error message');
            snackbar.dispatch({ text: 'Must select a Run ID', options: { right: true, color: 'error' } });
          }
        },
      },
    ];
    onMounted(async () => {
      await clientReady;
      store.commit.setSubmenu(submenu);
      window.addEventListener('resize', handleResize);
      await fetchFileList();
      load_counts_positions();
    });
    onUnmounted(async () => {
      store.commit.setSubmenu(null);
      window.removeEventListener('resize', handleResize);
    });
    return {
      allFiles,
      run_id,
      full_bsa_filename,
      metadata,
      run_id_folder_names,
      run_id_folder_namesHolder,
      searchInput,
      headers,
      selectAction,
      search,
      konvaConfig,
      circleConfig,
      brushConfig,
      handleDragStart_Crop,
      handleDragEnd_Crop,
      handleDragMove_Crop,
      handleDragCenterMove_Crop,
      handleDragStart,
      handleDragMove,
      handleDragCenterStart,
      handleDragCenterMove,
      handleMouseDown,
      handleMouseOver,
      handleMouseMoveStage,
      handleMouseDownBrush,
      handleMouseUpBrush,
      handleMouseUp,
      crop,
      roi,
      objectToArray,
      generateLattices,
      current_image,
      loadImage,
      searchRuns,
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
      atpixels,
      autoFill,
      threshold,
      loading,
      loadingMessage,
      cropLoading,
      threshLoading,
      orientation,
      drop_down_manager,
      onLatticeButton,
      onCropButton,
      one,
      two,
      three,
      four,
      channels,
      spatial,
      scaleFactor_json,
      grid,
      cropFlag,
      tissue_position_list_obj,
      prompt_to_use_existing_spatial,
      uploadingTixels,
      updating_existing,
      image_processing_begun,
      run_id_search_active,
      show_metadata,
      bsa_blob,
      getMeta,
      resolveAuthGroup,
      welcome_screen,
      company_image,
      thresh_clicked,
      c_val,
      neighbor_size,
      active_roi_available,
      roi_active,
      finding_roi,
      thresh_image_created,
      bw_image,
      thresh_same,
      tixels_filled,
      bsa_image_displayed,
      change_image,
      handle_spatial_call,
      rotate_image,
      saved_grid_state,
      hide_grid,
      load_tixel_state,
      clear_filled_tixels,
      degreeRotation,
      assignMetadata,
      checkSpatial,
      showSpatialFolder,
      availableFiles,
      imageClick,
      root,
      bucket_name,
      bsa_image,
      black_white,
      loadGrayCropped,
      postB_image_promise,
      postB_image,
      bw_image_displayed,
      postB_image_displayed,
      run_folder_selected,
      get_image_options,
      file_options,
      lims_available,
      selecting_counts_pos_file,
      color_gradient_scale_numbers,
      tixel_color_mapping,
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
.center {
  display: block;
  margin-left: auto;
  margin-right: auto;
  width: 80%;
}
.vert-spaced-btn {
  top: 8px;
}
</style>
