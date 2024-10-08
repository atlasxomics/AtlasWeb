import lodash from 'lodash';
import { get_uuid, generateRouteByQuery, objectToArray } from '@/utils';
import { Point, Circle, Polygon } from '../types';

export class ROI {
  coordinates: any | null;

  scalefactor: number;

  polygons: any[];

  channels: number | any;

  radius: number;

  constructor(coord: number[], scale: number, num_channels: number|null) {
    this.scalefactor = scale;
    this.coordinates = {}; // LeftTop, LeftBottom, RightTop, RightBottom
    this.initializeROI(coord[0], coord[1]);
    this.channels = num_channels;
    this.polygons = [];
    this.radius = 0;
  }

  static center(tL: number[], tR: number[], bR: number[], bL: number[]): number[] {
    const top = [(tL[0] + tR[0]) / 2, (tL[1] + tR[1]) / 2];
    const bottom = [(bL[0] + bR[0]) / 2, (bL[1] + bR[1]) / 2];
    const x = (top[0] + bottom[0]) / 2;
    const y = (top[1] + bottom[1]) / 2;
    return [x, y];
  }

  static ratio50l(xc: number, yc: number, xr: number, yr: number, num: number): number[] {
    const txp = xc + (1 / (num)) * (xr - xc);
    const typ = yc + (1 / (num)) * (yr - yc);
    return [txp, typ];
  }

  get_polygon_subset(index: number, total: number) {
    const lb = Math.floor(this.polygons.length * (index / total));
    const ub = Math.floor(this.polygons.length * ((index + 1) / total));
    const slice = this.polygons.slice(lb, ub);
    return slice;
  }

  initializeROI(width: number, height: number) {
    const rng = [[width * 0.15, height * 0.15], [width - (width * 0.15), height * 0.15], [width - (width * 0.15), height - (height * 0.15)], [width * 0.15, height - (height * 0.15)]];
    rng.forEach((x: number[], idx: number) => {
      const [xp, yp] = x;
      const id = get_uuid();
      const circle: any = {
        draggable: true,
        id,
        x: xp,
        y: yp,
        stroke: 'green',
        radius: 10,
      };
      if (this.coordinates) this.coordinates[id] = circle;
    });
  }

  getCoordinates(): Point[] {
    const out: Point[] = [];
    lodash.forIn(this.coordinates, (v, k) => {
      const p = { x: v.x, y: v.y, id: k };
      out.push(p);
    });
    return out;
  }

  setCoordinates(coords: Point[]): any {
    let idx = 0;
    lodash.forIn(this.coordinates, (v, k) => {
      this.coordinates[k] = { x: coords[idx].x * this.scalefactor, y: coords[idx].y * this.scalefactor };
      idx += 1;
    });
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

  getMask(length: any[]): any[] {
    return this.polygons.map((v: any) => {
      const position = v[9];
      const poly = document.getElementById(`${v[4]}_tixel`);
      const points = poly!.getAttribute('points');
      const tixel_value = poly!.getAttribute('fill');
      const split_points = points!.split(',');
      const center = ROI.center([Number(split_points[0]), Number(split_points[1])], [Number(split_points[2]), Number(split_points[3])], [Number(split_points[4]), Number(split_points[5])], [Number(split_points[6]), Number(split_points[7])]);
      const x = center[0] / this.scalefactor;
      const y = center[1] / this.scalefactor;
      const value = tixel_value === 'red' ? 1 : 0;
      return { position, value, coordinates: { y, x } };
    });
  }

  getOnTissue(): number {
    let count = 0;
    this.polygons.forEach((ele: any) => {
      if (ele.on_tissue) {
        count += 1;
      }
    });
    return count;
  }

  autoMask(pixels: any, threshold: number): any[] {
    const [height, width] = pixels.shape;
    const r = Math.round(this.radius / this.scalefactor);
    lodash.each(this.polygons, (v, i) => {
      const poly = document.getElementById(`${v[4]}_tixel`);
      const points = poly!.getAttribute('points');
      const split_points = points!.split(',');
      const center = ROI.center([Number(split_points[0]), Number(split_points[1])], [Number(split_points[2]), Number(split_points[3])], [Number(split_points[4]), Number(split_points[5])], [Number(split_points[6]), Number(split_points[7])]);
      const x = Math.round(center[0] / this.scalefactor);
      const y = Math.round(center[1] / this.scalefactor);
      let pixval = 0.0;
      for (let row = x - r; row < x + r; row += 1) {
        for (let col = y - r; col < y + r; col += 1) {
          pixval += pixels.data[row * width + col];
        }
      }
      pixval /= (2 * r) ** 2;
      const on_tissue_local = pixval < threshold;
      poly!.setAttribute('fill', on_tissue_local ? 'red' : 'none');
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
    const lineConfig = { points, stroke: 'red', strokeWidth: 1, closed: true, visible: true };
    return lineConfig;
  }

  setPolygonsInCircle(x: number, y: number, radius: number, brush_on: boolean) {
    lodash.each(this.polygons, (v: any, i: number) => {
      const poly = document.getElementById(`${v[4]}_tixel`);
      const points = poly!.getAttribute('points');
      const split_points = points!.split(',');
      const center = ROI.center([Number(split_points[0]), Number(split_points[1])], [Number(split_points[2]), Number(split_points[3])], [Number(split_points[4]), Number(split_points[5])], [Number(split_points[6]), Number(split_points[7])]);
      const centerx = center[0];
      const centery = center[1];
      const tf = ((centerx - x)) ** 2 + ((centery - y) ** 2) < (radius ** 2);
      if (tf) {
        this.polygons[i][8] = brush_on;
        poly!.setAttribute('fill', brush_on ? 'red' : 'none');
      }
    });
  }

  fill_color_counts(tixel_color: Record<number, string>) {
    /**
     * Iterate through this.polygons and set color of the polygon
     * to be the tixel color map passed in.
     */
    if (Object.keys(tixel_color).length !== this.polygons.length) return;
    for (let i = 0; i < this.polygons.length; i += 1) {
      this.polygons[i].fill = tixel_color[i];
      this.polygons[i].opacity = this.polygons[i].on_tissue ? 1 : 0.5;
      // if (this.polygons[i].on_tissue) {
      //   this.polygons[i].strokeWidth = 1.5;
      // }
    }
  }

  remove_color_counts() {
    /**
     * Iterate through this.polygons and set color of
     * shape to be red for on tissue and null for off.
     */
    for (let i = 0; i < this.polygons.length; i += 1) {
      let fill = null;
      if (this.polygons[i].on_tissue) {
        fill = 'red';
      }
      this.polygons[i].fill = fill;
      this.polygons[i].opacity = 1;
    }
  }

  toggle_tixel_visibility() {
    /**
     * Setting all tixels to be invisible.
     */
    for (let i = 0; i < this.polygons.length; i += 1) {
      this.polygons[i].visible = !this.polygons[i].visible;
    }
  }

  setScaleFactor(scale: number) {
    const prevScalefactor = this.scalefactor;
    this.scalefactor = scale;
    // adjust positions
    const ratio = this.scalefactor / prevScalefactor;
    this.radius *= ratio;
    const newCoords: any = {};
    lodash.forIn(this.coordinates, (v: Point, k: string) => {
      newCoords[k] = { x: v.x * ratio, y: v.y * ratio };
    });
    this.coordinates = newCoords;
    const newPolygons: any[] = [];
    lodash.each(this.polygons, (v: any, idx) => {
      const elm = v;
      elm[5] = v[5] * ratio;
      const poly = document.getElementById(`${elm[4]}_tixel`);
      poly!.setAttribute('points', `${elm[0][0] * elm[5]},${elm[0][1] * elm[5]},${elm[1][0] * elm[5]},${elm[1][1] * elm[5]},${elm[2][0] * elm[5]},${elm[2][1] * elm[5]},${elm[3][0] * elm[5]},${elm[3][1] * elm[5]}`);
      newPolygons.push(elm);
    });
    this.polygons = newPolygons;
  }

  get_distance_wscale = function (x1: number, y1: number, x2: number, y2: number, scale: number) {
    const d = Math.sqrt((((x2 / scale) - (x1 / scale)) ** 2) + (((y2 / scale) - (y1 / scale)) ** 2));
    const rounded = Math.round(d * 1000);
    return rounded / 1000;
  }

  getQCScaleFactors(img: any, length: any[]) {
    // obtaining scale factor for high res and low res images
    const hsf = 2000.0 / img.image.width;
    const lsf = 600.0 / img.image.width;
    const mask = this.getMask(length);
    let rowcount = 50;
    if (mask.length === 10000) rowcount = 100;
    const { x: x1, y: y1 } = mask[0].coordinates;
    const { x: x2, y: y2 } = mask[1].coordinates;
    const [p1, p2, p3, p4] = this.getCoordinates();

    const ratioNum = (this.channels * 2) - 1;
    const leftS = ROI.ratio50l(p1.x, p1.y, p4.x, p4.y, ratioNum);
    const topS = ROI.ratio50l(p1.x, p1.y, p2.x, p2.y, ratioNum);
    const slope = [(leftS[1] - p1.y), (leftS[0] - p1.x)];
    // const slopeT = [(topS[1] - p1.y), (topS[0] - p1.x)];
    const p = this.get_distance_wscale(leftS[0], leftS[1], topS[0], topS[1], this.scalefactor);
    const q = this.get_distance_wscale(p1.x, p1.y, topS[0] + slope[1], topS[1] + slope[0], this.scalefactor);
    const sdf = (p + q) / 2;
    const spot_fiduciary_ratio = 1.6153846;
    return {
      spot_diameter_fullres: sdf,
      fiducial_diameter_fullres: sdf * spot_fiduciary_ratio,
      tissue_hires_scalef: hsf,
      tissue_lowres_scalef: lsf,
    };
  }

  loadTixels(tixel_array: any[] = []) {
    /* eslint-disable prefer-destructuring */
    const [p1, p2, p3, p4] = this.getCoordinates();
    const ratioNum = (this.channels * 2) - 1;
    const leftS = ROI.ratio50l(p1.x, p1.y, p4.x, p4.y, ratioNum);
    const topS = ROI.ratio50l(p1.x, p1.y, p2.x, p2.y, ratioNum);
    const slope = [(leftS[1] - p1.y), (leftS[0] - p1.x)];
    if (this.radius === 0) this.radius = slope[0];
    const slopeT = [(topS[1] - p1.y), (topS[0] - p1.x)];
    const slopeO = [slope[0] * 2, slope[1] * 2];
    const slopeTO = [slopeT[0] * 2, slopeT[1] * 2];
    const prev = [];
    prev.push(p1.x);
    prev.push(p1.y);
    let tL: (number)[];
    let tR: (number)[];
    let bL: (number)[];
    let bR: (number)[];
    let center: (number)[];
    const top = [0, 0];
    const left = [0, 0];
    let flag = false;
    this.polygons = [];
    for (let i = 0; i < this.channels; i += 1) {
      top.fill(prev[0] + slopeT[1], 0);
      top.fill(prev[1] + slopeT[0], 1);
      flag = false;
      for (let j = 0; j < this.channels; j += 1) {
        if (flag === false) {
          left.fill(prev[0], 0);
          left.fill(prev[1], 1);
          tL = [left[0], left[1]];
          tR = [top[0], top[1]];
          bL = [tL[0] + slope[1], tL[1] + slope[0]];
          bR = [tR[0] + slope[1], tR[1] + slope[0]];
          flag = true;
        } else {
          left[0] += slopeO[1];
          left[1] += slopeO[0];
          tL = [left[0], left[1]];
          tR = [top[0], top[1]];
          bL = [tL[0] + slope[1], tL[1] + slope[0]];
          bR = [tR[0] + slope[1], tR[1] + slope[0]];
        }
        center = ROI.center(tL, tR, bR, bL);
        const topLC = [tL[0], tL[1]];
        const topRC = [tR[0], tR[1]];
        const botLC = [bL[0], bL[1]];
        const botRC = [bR[0], bR[1]];
        const ID = (i * this.channels) + j;
        let current_fill = '0';
        const value = tixel_array[(i * this.channels) + j];
        if (value) {
          const { 1: fill } = value;
          current_fill = fill;
        }
        // points, scalefactor, center, on_off
        this.polygons.push([topLC, topRC, botRC, botLC, ID, 1, center[0], center[1], (current_fill === '1') ? 'red' : 'none', [j, i]]);
        top[0] += slopeO[1];
        top[1] += slopeO[0];
      }
      prev[0] += slopeTO[1];
      prev[1] += slopeTO[0];
    }
  }
}
