<template>
    <v-main>
    <appbar :submenu="submenu" class="appbar"/>
    <v-container fluid>
      <v-row>
        <!-- search funtionality on press of magnifying glass -->
        <v-dialog
          v-if="run_id_search_active"
          :value="run_id_search_active"
          @click:outside="run_id_search_active = !run_id_search_active"
          hide-overlay>
          <v-card style="width:220px;position: absolute;z-index: 999;top:40px;left:85px;"
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
              @click:row="run_folder_selected"
            />
          </v-card>
        </v-dialog>
        <!-- metdata panel -->
        <!-- to display must select icon and have either be tissue_position_list_obj be empty and a runID selected or image_processing_begun be true. -->
        <!-- Make this v-dialog persistent only on the condition that the variable metadata_confirmed_bool is true -->
        <v-dialog
          width="600"
          height="800"
          v-if="image_processing_begun"
          :value="show_metadata"
          :persistent="!metadata_confirmed_bool"
          >
          <metadata-dropdown
          :metadata ="metadata"
          :drop_down_manager="drop_down_manager"
          :run_id="run_id"
          :updating_existing="updating_existing"
          :barcode_filename_list="barcode_filename_options"
          :metadata_confirmed_bool="metadata_confirmed_bool"
          @confirmed="metadata_confirmed"
          @refresh="pageRefresh"
          > </metadata-dropdown>
        </v-dialog>
        <v-col cols="12" sm="2" class="pl-6 pt-3" v-if="!checkSpatial">
          <!-- workflow menu -->
          <template v-if="run_id && image_processing_begun">
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
                max="0.8"
                step="0.005"
                :disabled="!current_image"
                @change="onChangeScale"></v-slider>
                <!-- rotation box -->
              <v-list dense class="mt-n3 pt-0 pl-2">
                <v-subheader style="font-size:14px;font-weight:bold;text-decoration:underline;">Rotation</v-subheader>
                <v-btn
                color="blue"
                :disabled="!current_image || isCropMode || grid || updating_existing || loading"
                @click="check_image_size(0)"
                small
                >
                <img src="/static/img/rotate_left.png"
                width="24"
                height="24"/>
                </v-btn>
                <v-btn
                color="blue"
                class="spaced_btn"
                :disabled="!current_image || isCropMode || grid || degreeRotation == '45' || updating_existing || loading"
                @click="check_image_size(1)"
                small
                >
                <img src="/static/img/rotate_right.png"
                width="24"
                height="24"/>
                </v-btn>
                <div style="display:grid;margin-top: 10px;">
                    <label><input type="radio" v-model="degreeRotation" value='90' :disabled="!current_image || isCropMode || grid || updating_existing || loading">90</label>
                    <label><input type="radio" v-model="degreeRotation" value='45' :disabled="!current_image || isCropMode || grid || updating_existing || loading">45</label>
                </div>
              </v-list>
              <!-- cropping start and stop -->
              <v-list dense class="mt-n4 pt-0 pl-2">
                <v-subheader style="font-size:14px;font-weight:bold;text-decoration:underline;">Cropping</v-subheader>
                <v-btn
                  outlined
                  color="primary"
                  dense
                  x-small
                  @click="activateCrop"
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
                @click="show_grid"
                :disabled="grid_visible || !grid">
                  Display Grid
                </v-btn>
                <v-btn
                outlined
                dense
                color = "primary"
                x-small
                @click="hide_grid()"
                :disabled="!grid_visible">
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
            <div
            v-if="false && !position_counts_present && updating_existing"
            style="position: relative; padding-top: 15px; padding-bottom: 15px;"
            >
            <v-btn
            outlined
            @click="get_count_file_options(run_id); prompt_to_select_counts_positions = true;"
            >
              Load Counts File
            </v-btn>
            </div>
            <v-list
              v-if="position_counts_present"
              >
              <v-subheader style="font-size:14px;font-weight:bold;text-decoration:underline;"> Counts Visualization </v-subheader>
              <v-checkbox v-model="show_counts_tixels" @click="toggle_tixel_counts_disp" :label="show_counts_tixels ? 'Hide Counts' : 'Show Counts'" />
              <div v-if="show_counts_tixels" :style="{ 'background-image': `${linear_gradient_description_string}`, 'display': 'flex', 'height': '50px', 'max-width': '250px', 'margin-left': '10px', 'margin-right': '10px' }" >
                <div style="position: relative; padding-top: 50px; left: 5%"> {{ lower_bound_count }} </div>
                <div style="position: relative; padding-top: 50px; left: 65%"> {{ upper_bound_count }} </div>
              </div>
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
            </v-card>
          </template>
          <v-dialog
          persistent
          :value="prompt_to_use_existing_spatial"
          max-width="800px"
          >
          <v-card>
            <v-system-bar class="pt-4" color="white">
              <v-spacer></v-spacer>
              <v-btn @click="pageRefresh()" icon><v-icon color="primary">mdi-close</v-icon></v-btn>
            </v-system-bar>
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
                @click="reprocess_image(run_id); "
                medium>
                Reprocess
              </v-btn>
              <v-btn
                outlined
                dense
                color="primary"
                @click="update_run_function"
                medium>
                Update
              </v-btn>
            </v-card-actions>
          </v-card>
          </v-dialog>
          <v-dialog
          :value="prompt_to_select_counts_positions"
          max-width="800px"
          >
            <v-card>
              <v-card-title
              class="justify-center"
              >
              Select tissue positions file with counts if available.
              </v-card-title>
              <v-card-actions>
                <v-select
                :items="count_file_options"
                v-model="tissue_positions_counts_filename"
                > </v-select>
                <v-btn @click="prompt_to_select_counts_positions = false; load_counts_positions()"> Confirm </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
          <v-dialog
          persistent
          :value="!image_processing_begun && file_options.length > 1 && !prompt_to_use_existing_spatial"
          max-width="800px"
          max-height="400px"
          >
          <v-card>
            <v-system-bar class="pt-4" color="white">
              <v-spacer></v-spacer>
              <v-btn @click="pageRefresh()" icon><v-icon color="primary">mdi-close</v-icon></v-btn>
            </v-system-bar>
            <v-card-title
            class="justify-center"
            > Multiple Images Found.  </v-card-title>
            <v-card-title
            class="justify-center"
            > Please select the BSA <span style="color:red">_AND OR_</span>postB image to be used for processing. </v-card-title>
            <v-spacer></v-spacer>
            <v-row align="center" justify="center">
              <v-col cols="12" sm="8">
                <v-select
                  v-model="full_bsa_filename"
                  :items="file_options"
                  label="Select BSA Image"
                  outlined
                  dense
                  color="primary"
                  small>
                </v-select>
              </v-col>
            </v-row>
            <v-row align="center" justify="center">
              <v-col cols="12" sm="8">
                <v-select
                  v-model="full_postb_filename"
                  :disabled="full_bsa_filename === ''"
                  :items="file_options"
                  label="Select postB Image"
                  outlined
                  dense
                  color="primary"
                  small>
                </v-select>
              </v-col>
            </v-row>
              <v-btn
              :disabled="full_bsa_filename === ''"
              style="position: relative; left: 50%; transform: translateX(-50%);"
              outlined
              @click="show_metadata = true; load_and_begin_image_processing();"
              >
              Submit
              </v-btn>
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
                <svg v-show="who_shows == 'svg' || updating_existing" :width="konvaConfig.width" :height="konvaConfig.height" @mousemove="handleMouseMoveStage" @mousedown="handleMouseDownBrush" @mouseup="handleMouseUpBrush">
                    <image v-if="current_image" :href="current_image.image.src" :width="konvaConfig.width" :height="konvaConfig.height"/>
                    <svg id="grid"></svg>
                    <circle v-if="isBrushMode || isEraseMode" :r="brushConfig.radius" :cx="brushConfig.x" :cy="brushConfig.y" stroke-width="1" stroke="red" fill="none"/>
                </svg>
                <v-stage
                  v-show="!checkSpatial && !welcome_screen && who_shows == 'stage'"
                  ref="konvaStage"
                  class="mainStage"
                  :config="konvaConfig"
                  @mousemove="handleMouseMoveStage">
                  <v-layer
                    v-if="current_image"
                    ref="imageLayer"
                    id="imageLayer"
                    >
                    <v-image
                      ref="image"
                      :config="current_image"
                    />
                </v-layer>
                  <!-- ROI red box layer -->
                    <v-layer
                    v-if="drag_roi && !tixels_filled"
                    ref="roiLayer"
                    id="roiLayer"
                    @mouseup="handleMouseUp">
                    <template v-if="current_image && !loading">
                      <template v-if="!updating_existing && !isBrushMode && !isEraseMode">
                        <v-line
                          :config="roi.generateBoundary()"/>
                      </template>
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
                  <v-layer>
                  <v-group v-for="index in 100" :key="index">
                    <v-shape v-for="p in roi.get_polygon_subset(index - 1, 100)"
                    :config="p"
                    v-bind:key="p.id"
                    @transformend="roi.setScaleFactor()"
                    @mousedown="handleMouseDown"
                    >
                    </v-shape>
                  </v-group>
                  </v-layer>
                  <v-layer
                    >
                      <v-circle
                        v-if="isBrushMode || isEraseMode"
                        :config="brushConfig"
                        @mousedown="handleMouseDownBrush"
                        @mouseup="handleMouseUpBrush"
                      />
                  </v-layer>
                  <v-layer>
                  <v-group v-for="index in 100" :key="index">
                    <v-shape v-for="p in roi.get_polygon_subset(index - 1, 100)"
                    :config="p"
                    v-bind:key="p.id"
                    @transformend="roi.setScaleFactor()"
                    @mousedown="handleMouseDown"
                    >
                    </v-shape>
                  </v-group>
                  </v-layer>
                  <v-layer
                    >
                      <v-circle
                        v-if="isBrushMode || isEraseMode"
                        :config="brushConfig"
                        @mousedown="handleMouseDownBrush"
                        @mouseup="handleMouseUpBrush"
                      />
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
                </v-stage>

              </v-card>
            </v-row>
          </v-container>
        </v-col>
        <v-col cols="12" sm="12">
        <SpatialFolderViewer
        v-if="checkSpatial"
        :root="root_spatial"
        :bucket_name="bucket_name_spatial"
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
        src="/static/img/atlasbg.png"
        width="width"
        height="height"
        >
        </v-img>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
<!--     </v-card> -->
</template>

<script lang='ts'>

import { ref, watch, defineComponent, computed, onMounted, watchEffect, onUnmounted } from '@vue/composition-api';
import lodash, { pad, toInteger, trim } from 'lodash';
import { PROD_SERVER_URL } from '@/environment';
import { isClient, Client, login } from '@/api';
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
import { resolveAuthGroup, logout, readCookie, saveCookie } from '@/utils/auth';
import Appbar from '@/components/Appbar/Appbar.vue';
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
  /**
   * Object to convert slims formatted names into better form.
   */
  cut_n_tag: 'CUT&Tag',
  'wt_dbit-seq': 'Transcriptome',
  'ATAC-seq': 'ATAC-seq',
  'atac-seq': 'ATAC-seq',
};

export default defineComponent({
  name: 'AtlasBrowser',
  props: ['query'],
  components: { SpatialFolderViewer, Selector, MetadataDropdown, Appbar },
  setup(props, ctx) {
    // Parameters for changing which bucket images are being pulled to and written to
    // s3 bucket to connect to
    const bucket_name = computed(() => config.atlasxbrowser.bucket_name);
    const bucket_name_spatial = computed(() => config.atlasxbrowser.bucket_name_spatial);
    const root = computed(() => config.atlasxbrowser.root_dir);
    const root_spatial = computed(() => config.atlasxbrowser.root_dir_spatial);
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
    const full_postb_filename = ref<string>('');
    const file_options = ref<any[]>([]);
    const konvaConfig = ref<any>({ width_window: window.innerWidth, height_window: window.innerHeight });
    const brushConfig = ref<any>({ x: null, y: null, radius: 20, fill: null, stroke: 'red' });
    const tixels_filled = ref<boolean>(false);
    const isBrushMode = ref(false);
    const isCropMode = ref(false);
    const isEraseMode = ref(false);
    const brushSize = ref(20);
    const brushDown = ref(false);
    const crop = ref<Crop>(new Crop([0, 0], 0.15));
    const roi = ref<ROI>(new ROI([0, 0], 0.15, null));
    const grid_visible = computed(() => {
      if (roi.value.polygons.length === 0) return false;
      return roi.value.polygons[0].visible;
    });
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
    const channels = ref<number | null>(null);
    const grid = ref<boolean>(false);
    const cropFlag = ref<boolean>(false);
    const cropLoading = ref<boolean>(false);
    const threshLoading = ref<boolean>(false);
    const spatial = ref<boolean>(false);
    // Tissue positions variables
    const tissue_position_list_obj = ref<any>();
    const linear_gradient_description_string = ref<string>('');
    const tissue_positions_counts_filename = ref<string>('');
    const count_file_options = ref<string[]>([]);
    const tixel_color_mapping = ref<Record<number, string>>({});
    const prompt_to_use_existing_spatial = ref<boolean>(false);
    const prompt_to_select_counts_positions = ref<boolean>(false);
    const selecting_counts_pos_file = ref<boolean>(false);
    const position_counts_present = ref<boolean>(false);
    const show_counts_tixels = ref<boolean>(false);
    const lower_bound_count = ref<number>(0);
    const upper_bound_count = ref<number>(0);
    // Flow of process booleans
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
    const color_gradient_scale_numbers = ref<number[]>([]);
    const barcode_filename_options = ref<string[]>([]);
    const barcodes_in_list = ref<string[]>([]);
    const barcode_mapping = computed(() => config.atlasxbrowser.barcode_mapping);
    const original_barcode_filename = ref<string|null>('');
    const metadata_confirmed_bool = ref<boolean>(false);
    const postB_flag = ref<boolean>(false);
    let rotate_fail_flag = false;
    let last_rotate_blob: any;
    let new_rotate = 0;
    const drag_roi = ref<boolean>(false);
    const svg_spatial_wh = ref<number[]>([0, 0]);
    const who_shows = ref<string>('stage');
    const previous_scale = ref(0);
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
      numChannels: null,
      organ: null,
      orientation: null,
      crop_area: null,
      barcode_filename: null,
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
    function pageRefresh() {
      window.location.reload();
    }
    const submenu = ref<any[]>([
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
      {
        text: 'Restart',
        icon: false,
        tooltip: 'Restart Whole Process',
        enabled: true,
        disabled: loading.value || welcome_screen.value,
        click: () => { pageRefresh(); },
      },
    ]);
    function reset_metadata() {
      /**
       * Method used to reset metadata when run is switched.
       */
      metadata.value = {
        points: [],
        run: null,
        blockSize: null,
        cValue: null,
        threshold: null,
        tissue_type: null,
        species: null,
        assay: null,
        numChannels: null,
        organ: null,
        orientation: null,
        crop_area: null,
        barcode_filename: 'bc96v2-24.txt',
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
      };
    }
    function initialize() {
      /**
       * Method used to reset relevent variables when run is switched.
       */
      roi.value = new ROI([0, 0], scaleFactor.value, null);
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
      full_postb_filename.value = '';
      image_processing_begun.value = false;
      position_counts_present.value = false;
      show_counts_tixels.value = false;
      count_file_options.value = [];
      tissue_positions_counts_filename.value = '';
      metadata_confirmed_bool.value = false;
      original_barcode_filename.value = '';
      new_rotate = 0;
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
    async function fitStageToParent() {
      const parent = document.querySelector('#stageParentDualAtac');
      if (!parent) return;
      const parentWidth = (parent as any).offsetWidth;
      const parentHeight = (parent as any).offsetHeight;
      konvaConfig.value.width = parentWidth;
      konvaConfig.value.height = parentHeight;
    }
    async function onResize() {
      await fitStageToParent();
    }
    function previousScale(ev: any) {
      previous_scale.value = ev;
    }
    function onChangeScale(ev: any) {
      /**
       * Method used to update scale factor when slider is changed.
       */
      const v = scaleFactor.value;
      current_image.value.scale = { x: v, y: v };
      const new_w = v * current_image.value.image.width;
      const new_h = v * current_image.value.image.height;
      konvaConfig.value = { width: new_w, height: new_h };
      stageWidth.value = konvaConfig.value.width;
      stageHeight.value = konvaConfig.value.height;
      roi.value.setScaleFactor(v);
      if (roi.value.polygons.length === 0) crop.value.setScaleFactor(v);
    }
    function map_barcode_filename_config(from_variable: string) {
      /**
       * Method used to load barcode file using mapping from config.
       */
      const barcode_filename: string = barcode_mapping.value[from_variable as keyof typeof barcode_mapping.value];
      if (barcode_filename) {
        metadata.value.barcode_filename = barcode_filename;
      }
    }
    async function getMeta() {
      /**
       * Method in which the client method `getMetadataFromRunId` is called.
       * This async method obtains the result of slims api call.
       * On Success, this response is assigned to local metadata variable.
       * On Failure, the user is notified of a failure to populate metadata.
       */
    }
    // io
    async function loadMetadata(): Promise<boolean> {
      /**
       * Method used to load metadata into browser.
       * First queries aws S3 to check if the run has the files needed in a spatial folder.
       * If those files are present, the metadata from the metadata.json file is assigned to the local metadata variable, and the
       * user is presented with the option to either load this spatial folder and update tixel designations or reprocess the image.
       * If those files are not present, if slims is available, it is queried for metadata and the user is prompted for metadata run processing.
       * Return: boolean: whether or not there is a spatial directory already present.
       */
      if (!client.value) return false;
      run_id_search_active.value = false;
      loading.value = true;
      loadingMessage.value = false;
      // specify path to images within s3
      const filename = `${root_spatial.value}/${run_id.value}/spatial/metadata.json`;
      const scale_filename = `${root_spatial.value}/${run_id.value}/spatial/scalefactors_json.json`;
      const pos_filename = `${root_spatial.value}/${run_id.value}/spatial/tissue_positions_list.csv`;
      const payload = { params: { filename, bucket_name: bucket_name_spatial.value, no_aws_yes_server: false } };
      const resp = await client.value.getJsonFile(payload);
      const pos_payload = { params: { filename: pos_filename, bucket_name: bucket_name_spatial.value, no_aws_yes_server: false } };
      const resp_pos = await client.value.getCsvFile(pos_payload);
      const scale_payload = { params: { filename: scale_filename, bucket_name: bucket_name_spatial.value, no_aws_yes_server: false } };
      const scale_pos = await client.value.getJsonFile(scale_payload);
      // if the json file is retrieved from server use that as metadata
      if (resp && resp_pos && scale_pos) {
        scaleFactor_json.value = scale_pos;
        tissue_position_list_obj.value = resp_pos;
        loading.value = false;
        metadata.value = resp;
        if (resp.barcodes) {
          map_barcode_filename_config(resp.barcodes);
        }
        original_barcode_filename.value = metadata.value.barcode_filename;
        // Converting old format of {1,2,3,4} to new format of using barcode filename
        snackbar.dispatch({ text: 'Metadata loaded from existing spatial directory', options: { color: 'success', right: true } });
        return true;
      }
      return false;
    }
    async function load_barcode_file_short_name(short_filename: string) {
      /**
       * Method for loading a barcode file from the atlasxbrowser.barcode_files_path directory.
       * Return: string[]: list of barcodes in the barcode file.
       */
      const path = config.atlasxbrowser.barcode_files_path.concat('/'.concat(short_filename));
      const pl = { params: { filename: path, bucket_name: bucket_name.value } };
      const bc_file = await client.value?.getCsvFile(pl);
      const barcode_list: string[] = [];
      bc_file.forEach((row: string[]) => {
        barcode_list.push(row[0]);
      });
      return barcode_list;
    }
    function get_num_channels_loaded_barcode_file(barcode_file: string[]) {
      /**
       * Method for determining the number of channels in the barcode file.
       * Return: number: number of channels in the barcode file. -1 if the number of rows is not a square.
       */
      const num_chan_int = Math.floor(Math.sqrt(barcode_file.length));
      if (num_chan_int * num_chan_int !== barcode_file.length) return -1;
      return num_chan_int;
    }
    async function get_number_channels_barcode_filename(barcode_filename: string | null) {
      /**
       * Method for determining the number of channels in the barcode file.
       * Return: number: number of channels in the barcode file. -1 if the number of rows is not a square.
       */
      if (!barcode_filename) return -1;
      const bc_file = await load_barcode_file_short_name(barcode_filename);
      const num_chan_int = get_num_channels_loaded_barcode_file(bc_file);
      return num_chan_int;
    }
    async function retrieve_barcode_file() {
      /**
       * Method for loading barcode file into the browser, once has been selected by user.
       * Return boolean: Whether or not the barcode file loaded in is valid. Validity based on the number of rows being a square.
       */
      if (!metadata.value.barcode_filename) return false;
      const bc_file = await load_barcode_file_short_name(metadata.value.barcode_filename);
      if (!bc_file) return false;
      const num_chan_int = get_num_channels_loaded_barcode_file(bc_file);
      if (num_chan_int === -1) return false;
      channels.value = num_chan_int;
      roi.value.channels = channels.value;
      barcodes_in_list.value = bc_file;
      return true;
    }
    function show_grid() {
      /**
       * Method to show the grid.
       */
      grid.value = true;
      drag_roi.value = false;
      who_shows.value = 'svg';
      const check = document.getElementById('1_tixel');
      if (tixels_filled.value) return;
      if (roi.value.polygons.length === 0) {
        roi.value.loadTixels();
      }
      if (check) {
        roi.value.setScaleFactor(scaleFactor.value);
      } else {
        const svg = document.getElementById('grid');
        const svgNS = 'http://www.w3.org/2000/svg';
        roi.value.polygons.forEach((array: any) => {
          const poly = document.createElementNS(svgNS, 'polygon');
          poly.setAttribute('points', `${array[0][0]},${array[0][1]},${array[1][0]},${array[1][1]},${array[2][0]},${array[2][1]},${array[3][0]},${array[3][1]}`);
          poly.setAttribute('fill', `${array[8]}`);
          poly.setAttribute('stroke', 'black');
          poly.setAttribute('stroke-width', '0.5');
          poly.setAttribute('id', `${array[4]}_tixel`);
          poly.setAttribute('scale', `${array[5]}`);
          svg!.appendChild(poly);
        });
      }
    }
    function uploadingTixels(use_existing_pos_file = true) {
      /**
       * Method for converting data in metadata.json into tixel grid of the app.
       * Args: use_existing_pos_file: whether or not to use the existing tissue_positions_list.csv when making a tixel grid.
       */
      grid.value = true;
      cropFlag.value = true;
      const partitioned = splitarray(metadata.value.points, 2);
      const roi_coords: Point[] = partitioned.map((v: number[]) => ({ x: v[0], y: v[1] }));
      roi.value.setCoordinates(roi_coords);
      orientation.value = metadata.value.orientation;
      if (use_existing_pos_file) {
        roi.value.loadTixels(tissue_position_list_obj.value);
      }
      show_grid();
    }
    async function metadata_confirmed() {
      /**
       * Method called when user confirms current metadata.
       */
      show_metadata.value = false;
      let prior_loading = true;
      if (!loading.value) {
        loading.value = true;
        prior_loading = false;
      }
      if (!metadata_confirmed_bool.value) {
        const proper_barcode_file = await retrieve_barcode_file();
        if (!proper_barcode_file) {
          show_metadata.value = true;
          metadata_confirmed_bool.value = false;
          snackbar.dispatch({ text: 'Invalid barcode file.', options: { color: 'error' } });
        } else {
          let tixels_filled_local = true;
          let use_existing_pos_file = true;
          if (updating_existing.value) {
            if (metadata.value.barcode_filename !== original_barcode_filename.value) {
              const num_channel_old = await get_number_channels_barcode_filename(original_barcode_filename.value);
              if (num_channel_old !== channels.value) {
                tixels_filled_local = false;
                use_existing_pos_file = false;
              }
            }
            uploadingTixels(use_existing_pos_file);
            tixels_filled.value = tixels_filled_local;
            if (!tixels_filled_local) {
              show_grid();
            }
          }
          metadata_confirmed_bool.value = true;
        }
      }
      if (!prior_loading) {
        loading.value = false;
      }
    }
    function load_image_promise_jpg(pl: any): Promise<any> | null {
      /**
       * Wrapper method that calls getImageAsJPG from client.
       */
      if (!client.value) return null;
      const promise = client.value.getImageAsJPG(pl);
      return promise;
    }
    function loadGrayCropped(filename: string): Promise<any> | null {
      /**
       * Method returns nonfluorescent postB image cropped to the specifications the user made on the BSA image.
       * Must be run either following cropping, or when updating a spatial folder.
       * Utilizes client call to API. Image processing is done on backend.
       * Returns null if client is not initialized or there was an exception.
       */
      if (!client.value) return null;
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
      /**
       * Method sets the currently displayed image.
       * Args: blob type: Blob. The image to be set, in blob form.
       * Returns type: Image. An Image object with the arg set as its source.
       */
      try {
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
      } catch (error) {
        return null;
      }
    }
    async function load_and_begin_image_processing() {
      /**
       * Method called when type of processing (updating or reprocessing) and desired image are selected.
       * If reprocessing path specified by user or inferred is loaded in.
       * If updating the postB_BSA image is pulled from the spatial folder of the run and loaded on screen and the postB image is loaded in background.
       * The files in the directory are loaded as well in `allFiles`
       */
      if (!client.value) return;
      welcome_screen.value = false;
      image_processing_begun.value = true;
      loading.value = true;
      loadingMessage.value = false;
      let filename: any;
      let postB_figure_filename: any;
      let use_cache = false;
      let local_bucket_name = bucket_name.value;
      if (full_postb_filename.value.length > 0) postB_flag.value = true;
      // path to images
      if (updating_existing.value) {
        filename = `${root_spatial.value}/${run_id.value}/spatial/figure/postB_BSA.tif`;
        bsa_image_displayed.value = true;
        postB_image_displayed.value = false;
        bw_image_displayed.value = false;
        use_cache = true;
        local_bucket_name = bucket_name_spatial.value;
        postB_figure_filename = `${root_spatial.value}/${run_id.value}/spatial/figure/postB.tif`;
        const pl_postB = { params: { rotation: 0, filename: postB_figure_filename, use_cache: true, bucket_name: bucket_name_spatial.value } };
        const pro = load_image_promise_jpg(pl_postB);
        if (pro) postB_image_promise.value = pro;
      } else {
        filename = full_bsa_filename.value;
      }
      const filenameList_pl = { path: `${root.value}/${run_id.value}/`, filter: [''], bucket: bucket_name.value, only_files: true };
      try {
        const pl = { params: { bucket_name: local_bucket_name, filename, rotation: orientation.value.rotation, use_cache } };
        const img = await client.value.getImageAsJPG(pl);
        bsa_blob.value = img;
        const img_obj = set_current_image(img);
        allFiles.value = await client.value.getFileList(filenameList_pl);
        bsa_image.value = img_obj!.src;
        if (postB_flag.value) {
          const pl_postB = { params: { rotation: 0, filename: full_postb_filename.value, use_cache: true, bucket_name: bucket_name_spatial.value } };
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
    }
    function toggle_tixel_counts_disp() {
      /**
       * This method toggles the displaying of count based colors on the tixels.
       * If show_counts_tixels is true, this means the button was just checked and the tixels should be filled.
       * If not, box was unchecked and colors should be removed.
       */
      if (show_counts_tixels.value) {
        roi.value.fill_color_counts(tixel_color_mapping.value);
      } else {
        roi.value.remove_color_counts();
      }
    }
    function calcProjectedRectSizeOfRotatedRect(size: any, rad: any) {
      const { width, height } = size;
      const rectProjectedWidth = Math.abs(width * Math.cos(rad)) + Math.abs(height * Math.sin(rad));
      const rectProjectedHeight = Math.abs(width * Math.sin(rad)) + Math.abs(height * Math.cos(rad));
      return { width: rectProjectedWidth, height: rectProjectedHeight };
    }
    function whichCaseRotation(width: any, height: any, rad: any, boundRad: any, sin_Height: any, sin_Width: any, cos_Height: any, cos_Width: any) {
      let xOrigin;
      let yOrigin;
      if (rad < boundRad) {
        xOrigin = Math.min(sin_Height, cos_Width);
        yOrigin = 0;
      } else if (rad < Math.PI / 2) {
        xOrigin = Math.max(sin_Height, cos_Width);
        yOrigin = 0;
      } else if (rad < Math.PI / 2 + boundRad) {
        xOrigin = width;
        yOrigin = Math.min(cos_Height, sin_Width);
      } else if (rad < Math.PI) {
        xOrigin = width;
        yOrigin = Math.max(cos_Height, sin_Width);
      } else if (rad < Math.PI + boundRad) {
        xOrigin = Math.max(sin_Height, cos_Width);
        yOrigin = height;
      } else if (rad < (Math.PI / 2) * 3) {
        xOrigin = Math.min(sin_Height, cos_Width);
        yOrigin = height;
      } else if (rad < ((Math.PI / 2) * 3) + boundRad) {
        xOrigin = 0;
        yOrigin = Math.max(cos_Height, sin_Width);
      } else if (rad < Math.PI * 2) {
        xOrigin = 0;
        yOrigin = Math.min(cos_Height, sin_Width);
      }
      return [xOrigin, yOrigin];
    }
    async function rotate_bsa_image_api(choice: number) {
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
      last_rotate_blob = img;
      loading.value = false;
    }
    async function rotate_bsa_image(choice: number) {
      /**
       * Method to rotate BSA image. Image rotation processing done on backend.
       * Call to API is sped up by an indication to use the cache on server.
       * Args: choice number: Indication of how manyu
       */
      loading.value = true;
      if (choice === 1) {
        const rotationAmount = 90;
        orientation.value.rotation += 270;
        new_rotate += rotationAmount;
      } else {
        const rotationAmount = (degreeRotation.value === '90') ? parseInt(degreeRotation.value, 10) * 3 : 315;
        new_rotate += rotationAmount;
        orientation.value.rotation += (degreeRotation.value === '90') ? parseInt(degreeRotation.value, 10) : 45;
      }
      const imgObj = new window.Image();
      imgObj.src = URL.createObjectURL(bsa_blob.value);
      const canvas = document.createElement('canvas');
      const ctxe = canvas.getContext('2d');
      imgObj.onload = (v: any) => {
        URL.revokeObjectURL(imgObj.src);
        const boundaryRad = Math.atan(imgObj.width / imgObj.height);
        const rad = ((new_rotate % 360) * Math.PI) / 180;
        const { width, height } = calcProjectedRectSizeOfRotatedRect({ width: imgObj.width, height: imgObj.height }, rad);
        canvas.width = width;
        canvas.height = height;
        const sin_Height = imgObj.height * Math.abs(Math.sin(rad));
        const cos_Height = imgObj.height * Math.abs(Math.cos(rad));
        const cos_Width = imgObj.width * Math.abs(Math.cos(rad));
        const sin_Width = imgObj.width * Math.abs(Math.sin(rad));
        const final_values = whichCaseRotation(width, height, rad, boundaryRad, sin_Height, sin_Width, cos_Height, cos_Width);
        ctxe!.translate(final_values[0], final_values[1]);
        ctxe!.rotate(rad);
        ctxe!.drawImage(imgObj, 0, 0);
        canvas.toBlob((blob: any) => {
          const img_obj = set_current_image(blob);
          if (img_obj) last_rotate_blob = blob;
          else {
            console.error('Image size too big, using backup method');
            rotate_fail_flag = true;
            if (choice === 1) {
              orientation.value.rotation -= 270;
            } else {
              orientation.value.rotation -= (degreeRotation.value === '90') ? parseInt(degreeRotation.value, 10) : 45;
            }
            rotate_bsa_image_api(choice);
          }
        });
      };
      loading.value = false;
    }
    function check_image_size(choice: number) {
      if (!rotate_fail_flag) {
        rotate_bsa_image(choice);
      } else {
        rotate_bsa_image_api(choice);
      }
    }
    function searchRuns(ev: any) {
      /**
       * Method to search run ids in the `run_id_folder_names` list based on the input string.
       */
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
    async function load_barcode_file_options() {
      /**
       * Method to load the barcode files in the `barcode_files_path` folder of the atlasxbrowser config.
       * The files are loaded in the `barcode_filename_options` variable.
       * Note: Ensure barcode_files_path is properly set in the config.
       */
      if (!client.value) return;
      const barcode_path = config.atlasxbrowser.barcode_files_path.concat('/');
      const pl = { path: barcode_path, bucket: bucket_name.value, filter: '.txt', only_files: true, delimiter: '/' };
      const res = await client.value.getFileList(pl);
      res.forEach((filename: string) => {
        const inx = filename.lastIndexOf('/');
        if (inx < filename.length - 1) {
          const short_filename = filename.substring(inx + 1, filename.length);
          barcode_filename_options.value.push(short_filename);
        }
      });
    }
    function color_tixel_counts_percentile(data: any[], color_gradient: string[]) {
      /**
       * Populates variable `tixel_color_mapping` to have each tixel's color derived
       *  from its percentile in the dataset.
       * Params: data: tissue_positions list color_gradient: list of hex color codes length: 100
       */
      data.sort((ele1: any, ele2: any) => {
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
      // Code chunk used to creating a mapping between tixel number and the respective color within a color gradient
      const number_channels = Math.sqrt(data.length);
      for (let i = 0; i < data.length; i += 1) {
        const pct = Math.floor((i / data.length) * 100);
        const row = Number.parseInt(data[i][2], 10);
        const col = Number.parseInt(data[i][3], 10);
        const tixel_num = (row * number_channels) + col;
        tixel_color_mapping.value[tixel_num] = color_gradient[pct];
      }
      const { 7: temp_count_lower } = data[Math.round(data.length * 0.05)];
      const { 7: temp_count_upper } = data[Math.round(data.length * 0.95)];
      lower_bound_count.value = Math.round(temp_count_lower * 100) / 100;
      upper_bound_count.value = Math.round(temp_count_upper * 100) / 100;
    }
    function color_tixel_counts_user_defined(data: any[], color_gradient: string[], min: number, max: number) {
      /**
       * Populates `tixel_color_mapping` with colors based on provided min and max.
       * Values below min are given the minimum color value and values above max are given max value
       * Values that fall within the provided min and max are given the color in color gradient based on
       * its linear placement between min and max.
       * Params:
       *    data: tissue_positions list containing tixel information for the relevant run
       *    color_gradient: list containing hex colors defining the color spectrum being used
       *    min: Lower bound to be included in color dist
       *    max: Upper bound to be included in color dist
       */
      if (!data) return;
      if (data[0].length !== 8) return;
      lower_bound_count.value = min;
      upper_bound_count.value = max;
      for (let i = 0; i < data.length; i += 1) {
        const current_count = data[i][7];
        let pct_inx = Math.round(((current_count - min) / (max - min)) * 100);
        pct_inx = Math.max(0, pct_inx);
        pct_inx = Math.min(pct_inx, 99);
        const color = color_gradient[pct_inx];
        tixel_color_mapping.value[i] = color;
      }
    }
    async function load_counts_positions(filename = tissue_positions_counts_filename.value, bucket_name_local = bucket_name_spatial.value) {
      /**
       * Method to load in a tissue_positions_list file with information on fragment counts.
       */
      const pl = { params: { bucket_name: bucket_name_local, filename } };
      const data = await client.value?.getCsvFile(pl);
      if (data === 'Not-Found' || data[0].length !== 8) {
        snackbar.dispatch({ text: 'Error! Incompatible File!', options: { color: 'red' } });
        tissue_positions_counts_filename.value = '';
        return;
      }
      // Sort data based on row and col, as proper ordering is not assumed for count files
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
      // Create copy for assigning color information
      const data_copy = JSON.parse(JSON.stringify(data));
      const color_gradient = colormap({ colormap: 'jet', nshades: 100, format: 'hex' });
      // Default use of percentiles for coloring grid
      color_tixel_counts_percentile(data_copy, color_gradient);
      // color_tixel_counts_user_defined(data_copy, color_gradient, 4, 5);
      // Populate gradient div
      const min_color = color_gradient[0];
      const min_number = (Math.round(data_copy[0][7] * 100)) / 100;
      const pct_50_color = color_gradient[49];
      const pct_50_number = Math.round(data_copy[Math.round(0.5 * data.length)][7] * 100) / 100;
      const max_color = color_gradient[99];
      const max_num = Math.round(data_copy[data_copy.length - 1][7] * 100) / 100;
      linear_gradient_description_string.value = `linear-gradient(to right, ${min_color}, ${pct_50_color}, ${max_color})`;
      color_gradient_scale_numbers.value = [min_number, pct_50_number, max_num];
      snackbar.dispatch({ text: 'Successfully Loaded Tissue Position Counts', options: { color: 'green', position: 'center' } });
      position_counts_present.value = true;
    }
    function handleResize(ev: any) {
      /**
       * Method to handle resizing of the window.
       */
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
      /**
       * Starting of move for roi corner resets the polygon list.
       */
      const { id } = ev.target.attrs;
      roi.value.polygons = [];
    }
    function handleDragMove(ev: any) {
      /**
       * Method to handle movement of roi corner.
       */
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
      /**
       * Starting of movement of center of roi resets the polygons.
       */
      roi.value.polygons = [];
    }
    function handleDragCenterMove(ev: any) {
      roi.value.moveToNewCenter(ev.target._lastPos);
    }
    function brush_on_points() {
      /**
       * Method called when the brush is being used over a set of tixels.
       * If erasing the value of on_tissue will be set to false and if the count colors are displayed the strokeWidth will be set to 1
       * Otherwise if the brush is not erasing, the attribute on_tissue will be set to true and if count colors are displayed the stroke width will be set to 1.
       */
      let flag = true;
      if (isEraseMode.value) flag = false;
      roi.value.setPolygonsInCircle(brushConfig.value.x, brushConfig.value.y, brushConfig.value.radius, flag);
    }
    function handleMouseDown(ev: any) {
      /**
       * Method to handle mouse click.
       * If the brush is being used, the brush_on_points method is called.
       */
      if (roi.value.polygons.length === 0) return;
      if (isBrushMode.value) {
        isMouseDown.value = true;
        brush_on_points();
      }
    }
    function handleMouseUp(ev: any) {
      isMouseDown.value = false;
    }

    function handleMouseMoveStage(ev: any) {
      /**
       * Method to handle mouse movement over the stage.
       * If the brush is being used and mouse is being held down the brush_on_points method is called.
       */
      if (isBrushMode.value || isEraseMode.value) {
        brushConfig.value = { x: ev.offsetX, y: ev.offsetY, radius: brushConfig.value.radius };
        if (brushDown.value) {
          brush_on_points();
        }
      }
    }
    function handleMouseDownBrush(ev: any) {
      brushDown.value = true;
      brush_on_points();
    }
    function handleMouseUpBrush(ev: any) {
      brushDown.value = false;
    }
    function setBrushMode(tf: boolean) {
      isBrushMode.value = tf;
    }
    function hide_grid() {
      // grid.value = false;
      drag_roi.value = true;
      who_shows.value = 'stage';
    }
    async function change_image(img: string) {
      /**
       * Method to change the image being displayed.
       * If the image is postB and the postB image has not been loaded yet, the function waits for it to load.
       * The specified image is set to current_image and the corresponding image_displayed value is set to true.
       * @img: string, the image to be displayed. Can be 'postB', 'BSA', or 'BW'
       */
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
    function activateCrop() {
      isCropMode.value = true;
      if (last_rotate_blob) bsa_blob.value = last_rotate_blob;
    }
    function onCropButton() {
      /**
       * Method to handle the crop button being clicked.
       * Based on the locations of corners of the crop box, the image is cropped on the canvas and the new image is set to current_image.
       */
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
            bsa_image.value = img_obj!.src;
            cropLoading.value = false;
          });
        };
        roi.value = new ROI([(coords[2] - coords[0]) * scaleFactor.value, (coords[3] - coords[1]) * scaleFactor.value], scaleFactor.value, channels.value);
      }
    }
    function finding_roi() {
      /**
       * Method called when `activate` roi finding is selected.
       */
      grid.value = true;
      active_roi_available.value = false;
      roi_active.value = true;
      drag_roi.value = true;
    }
    function threshold_image(img_src: any) {
      /**
       * Method to threshold the image using the parameters specified for c and neighborhood size.
       * Thresholding is done on canvas.
       */
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
      /**
       * Method directly called when the threshold button is clicked.
       * Utilizes the postB image to threshold and calls threshold_image.
       */
      if (!current_image.value) return;
      if (!postB_image_promise.value) return;
      loading.value = true;
      postB_image_promise.value.then((gray: any) => {
        const src = URL.createObjectURL(gray);
        postB_image.value = src;
        threshold_image(postB_image.value);
      });
    }
    const updateProgress = async (value: number) => {
      if (!client.value) return;
      let valueone: any;
      let valuetwo: any;
      let valuethree: any;
      one.value = value;
    };
    async function showSpatialFolder() {
      /**
       * Method called when `Show Spatial Folder` button is clicked.
       * Sets the `show_spatial_folder` value to true.
       */
      checkSpatial.value = true;
    }
    async function generateSpatial() {
      /**
       * Generates the spatial folder.
       * Calls the `atlasbrowser.generate_spatial` task to generate the spatial folder.
       * Passes metadata, crop area, roi coordinates, and relevant filenames.
       */
      if (!client.value) return;
      if (!metadata.value.barcode_filename) {
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
        const queue = 'atxcloud_atlasbrowser';
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
          barcode_filename: metadata.value.barcode_filename,
          barcode_list: barcodes_in_list.value,
          bucket_name_bsa: bucket_name.value,
          bucket_name_spatial: bucket_name_spatial.value,
          root_dir_spatial: root_spatial.value,
          root_dir_bsa: root.value,
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
        rotate_fail_flag = false;
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
      /**
       * Method called when `Generate Spatial Folder` button is clicked.
       * Checks if client is initialized and image processing is complete.
       * If so, calls `generateSpatial` method.
       */
      if (!client.value) {
        snackbar.dispatch({ text: 'Client is not initialized', options: { right: true, color: 'error' } });
      } else if (!tixels_filled.value) {
        snackbar.dispatch({ text: 'Must complete image processing before genereating spatial folder', options: { right: true, color: 'error' } });
      } else {
        generateSpatial();
      }
    }
    async function update_run_function() {
      /**
       * Method called when `Update Run` button is clicked.
       * Sets proper boolean values before following the same process as `load_and_begin_image_processing`.
       */
      prompt_to_use_existing_spatial.value = false;
      updating_existing.value = true;
      await load_and_begin_image_processing();
      who_shows.value = 'svg';
    }
    function autoFill(ev: any) {
      /**
       * Method called when `Auto Fill` button is clicked.
       * If the tixels are not already placed they are loaded onto the image.
       * The `autoMask` method is called to fill the tixels.
       * This method then sets the `tixels_filled` boolean to true, which is used to determine if the image processing is complete.
       */
      who_shows.value = 'svg';
      roi.value.autoMask(atpixels.value, threshold.value);
      tixels_filled.value = true;
    }
    async function fetchFileList() {
      /**
       * Method that gets all of the files in the specific directory where the BSA files are stored.
       * The results of this are passed to the worker when generating spatial folder to move non bsa images to figure folder.
       */
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
    async function get_count_file_options(current_run_id: string) {
      /**
       * Method that gets all of the csv files in the root directory where the bsa files are stored.
       */
      const pl = { bucket: bucket_name_spatial.value, path: `${root_spatial.value}/${current_run_id}/`, filter: ['.csv'] };
      const options = await client.value?.getFileList(pl);
      count_file_options.value = options;
    }
    async function get_image_options(folder_name: string) {
      /**
       * Method that gets all of the images in the directory selected by the user.
       * If there is only one image in the directory, it is automatically selected.
       * If there are no images in the directory, an error message is displayed.
       * If there are multiple images in the directory, the user is prompted to select one.
       */
      const pl = { bucket: bucket_name.value, path: `${root.value}/${folder_name}/`, delimiter: '/', filter: ['.tif', '.tiff', '.png', '.jpg', 'jpeg'] };
      file_options.value = await client.value?.getFileList(pl);
      if (file_options.value.length === 1) {
        [full_bsa_filename.value] = file_options.value;
        show_metadata.value = true;
        load_and_begin_image_processing();
      } else if (file_options.value.length === 0) {
        snackbar.dispatch({ text: 'No images found in folder', options: { right: true, color: 'error' } });
      }
    }
    async function reprocess_image(run_id_param: string) {
      /**
       * Method called when the user decides to `Reprocess` the run when there is already a spatial folder.
       */
      reset_metadata();
      await getMeta();
      get_image_options(run_id_param);
      prompt_to_use_existing_spatial.value = false;
    }
    async function run_folder_selected(folder_name: any) {
      /**
       * Method called when the user selects a run id from the dropdown selector.
       * This leads to various options of whether to reprocess/update or the selection of specific images.
       * If client is not initialized, the method returns early.
       */
      if (!clientReady) {
        return;
      }
      run_id.value = folder_name.id;
      initialize();
      prompt_to_use_existing_spatial.value = await loadMetadata();
      if (!prompt_to_use_existing_spatial.value) {
        get_image_options(folder_name.id);
      } else {
        show_metadata.value = true;
      }
    }
    watch(brushSize, (v) => {
      brushConfig.value = { x: brushConfig.value.x, y: brushConfig.value.y, radius: v };
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
    onMounted(async () => {
      const serverUrl = PROD_SERVER_URL;
      const resp = await login(serverUrl, 'public', 'Latch456!');
      if (isClient(resp)) {
        const existingCookie = readCookie();
        if (existingCookie) {
          logout();
        }
        saveCookie({ token: resp.authorizationToken, url: resp.serverURL });
        store.commit.setClient(await Client.Create(serverUrl, resp.authorizationToken));
      }
      store.commit.setComponent({ component: 'AtlasXBrowser' });
      await clientReady;
      console.log(client);
      window.addEventListener('resize', handleResize);
      await fetchFileList();
      load_barcode_file_options();
      // load_counts_positions();
    });
    onUnmounted(async () => {
      store.commit.setSubmenu(null);
      window.removeEventListener('resize', handleResize);
    });
    return {
      allFiles,
      run_id,
      full_bsa_filename,
      full_postb_filename,
      metadata,
      run_id_folder_names,
      run_id_folder_namesHolder,
      searchInput,
      headers,
      selectAction,
      search,
      konvaConfig,
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
      handleMouseMoveStage,
      handleMouseDownBrush,
      handleMouseUpBrush,
      handleMouseUp,
      crop,
      roi,
      objectToArray,
      show_grid,
      current_image,
      load_and_begin_image_processing,
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
      linear_gradient_description_string,
      thresh_same,
      tixels_filled,
      bsa_image_displayed,
      change_image,
      handle_spatial_call,
      rotate_bsa_image,
      saved_grid_state,
      hide_grid,
      degreeRotation,
      checkSpatial,
      showSpatialFolder,
      availableFiles,
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
      prompt_to_select_counts_positions,
      get_count_file_options,
      count_file_options,
      tissue_positions_counts_filename,
      load_counts_positions,
      position_counts_present,
      show_counts_tixels,
      toggle_tixel_counts_disp,
      grid_visible,
      lower_bound_count,
      upper_bound_count,
      metadata_confirmed,
      bucket_name_spatial,
      root_spatial,
      barcode_filename_options,
      update_run_function,
      retrieve_barcode_file,
      barcodes_in_list,
      reprocess_image,
      metadata_confirmed_bool,
      original_barcode_filename,
      pageRefresh,
      activateCrop,
      submenu,
      check_image_size,
      svg_spatial_wh,
      drag_roi,
      who_shows,
      previousScale,
      previous_scale,
      onResize,
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
