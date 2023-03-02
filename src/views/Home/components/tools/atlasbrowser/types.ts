
export interface Circle {
  _id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
}

export interface Point {
  id?: string;
  x: number;
  y: number;
}

export interface Metadata {
  points: number[] | any;
  run: string | null;
  blockSize: number | null;
  cValue: number | null;
  threshold: number | null;
  tissue_type: string | null;
  species: string | null;
  assay: string | null;
  antibody: string | null;
  numChannels: string | null;
  orientation: any | null;
  crop_area: any | null;
  barcodes: number | null;
  organ: string | null;
  tissue_source: string | null;
  chip_resolution: number | null;
  tissueBlockExperiment: string | null;
  comments_flowB: string | null;
  crosses_flowB: Array<number> | null;
  blocks_flowB: Array<number> | null;
  leak_flowB: string | null;
  comments_flowA: string | null;
  crosses_flowA: Array<number> | null;
  blocks_flowA: Array<number> | null;
  leak_flowA: string | null;
  sampleID: string | null;
  onTissueTixels: number | null;
}

export interface Polygon {
  sceneFunc: Function,
  id: string,
  fill: string | null,
  on_tissue: boolean,
  centerx: number,
  centery: number,
  visible: boolean,
  radius: number,
  stroke: string,
  strokeWidth: number,
  posit: Array<number>,
  scaleX: number,
  scaleY: number,
  raw_fragments: number | null,
  log_fragments: number | null,
}

export interface tissue_position_list_ele_counts {
  barcode: string,
  on_tissue: number,
  row_inx: number,
  col_inx: number,
  row_coord: number,
  col_coord: number,
  count_frags: number,
  log_count_frags: number,
}
