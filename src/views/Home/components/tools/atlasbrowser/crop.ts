import lodash from 'lodash';
import { get_uuid, generateRouteByQuery, objectToArray } from '@/utils';
import { Point, Circle } from './types';

export class Crop {
  coordinates: any | null;

  scalefactor: number;

  constructor(coord: Circle[] | null) {
    this.scalefactor = 0.15;
    if (coord) this.coordinates = coord;
    else {
      const width = window.innerWidth;
      const height = window.innerHeight;
      this.coordinates = {}; // LeftTop, LeftBottom, RightTop, RightBottom
      this.initialize(width, height);
    }
  }

  initialize(width: number, height: number) {
    const rng = [[0.0, 0.0], [1.0, 1.0]];
    rng.forEach((x: number[], idx: number) => {
      const [xp, yp] = x;
      const id = idx;
      const circle: any = {
        draggable: true,
        id,
        x: xp * width * this.scalefactor,
        y: yp * height * this.scalefactor,
        stroke: 'red',
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
    const real = this.realCoords();
    const anchors = points.map((v, idx) => {
      const circle = {
        draggable: true,
        id: v.id,
        x: real[idx].x,
        y: real[idx].y,
        stroke: 'red',
        radius: 10,
      };
      return circle;
    });
    return anchors;
  }

  moveToNewCenter(center: Point, width: number, height: number): any {
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
      x: (anchors.map((val) => val.x).reduce((a, b) => a + b, 0)) / 2,
      y: (anchors.map((val) => val.y).reduce((a, b) => a + b, 0)) / 2,
      stroke: 'red',
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

  setCoordinates(crop_area: Point[]): any {
    let idx = 0;
    lodash.forIn(this.coordinates, (v, k) => {
      this.coordinates[k] = { x: crop_area[idx].x * this.scalefactor, y: crop_area[idx].y * this.scalefactor };
      idx += 1;
    });
  }

  generateRect() {
    const coords: Point[] = this.getCoordinates();
    const length1 = Math.floor(coords[1].x - coords[0].x);
    const length2 = Math.floor(coords[1].y - coords[0].y);

    let added_on = 0;
    if (length1 > length2) {
      added_on = length1 - length2;
    }
    if (length1 < length2) {
      added_on = length1 - length2;
    }
    const points: number[] = [];
    const [c1, c2] = coords;
    c2.y += added_on;
    const x = Math.min(c1.x, c2.x);
    const y = Math.min(c1.y, c2.y);
    const width = Math.abs(c1.x - c2.x);
    const height = Math.abs(c1.y - c2.y);
    const rectConfig = { x, y, width, height, stroke: 'blue', strokeWidth: 2 };
    return rectConfig;
  }

  realCoords() {
    const coords: Point[] = this.getCoordinates();
    const length1 = Math.floor(coords[1].x - coords[0].x);
    const length2 = Math.floor(coords[1].y - coords[0].y);
    let added_on = 0;
    if (length1 > length2) {
      added_on = length1 - length2;
    }
    if (length1 < length2) {
      added_on = length1 - length2;
    }
    const [c1, c2] = coords;
    c2.y += added_on;
    this.coordinates[1].y += added_on;
    return [c1, c2];
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
  }
}
