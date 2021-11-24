import lodash from 'lodash';
import { get_uuid, generateRouteByQuery, objectToArray } from '@/utils';
import { Point, Circle } from './types';

export class ROI {
  coordinates: any | null;

  scalefactor: number;

  polygons: any[];

  constructor(coord: Circle[] | null) {
    this.scalefactor = 0.15;
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
        x: xp * width * this.scalefactor,
        y: yp * height * this.scalefactor,
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
      const x = v.x / this.scalefactor;
      const y = v.y / this.scalefactor;
      const value = v.fill != null;
      return { position, value, coordinates: { x, y } };
    });
  }

  autoMask(pixels: any, threshold: number): any[] {
    const [height, width] = pixels.shape;
    // console.log(width, height);
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
      elm.strokeWidth = this.scalefactor < 0.11 ? 0 : Math.min(ratio, 1.0);
      newPolygons.push(elm);
    });
    this.polygons = newPolygons;
  }

  getQCScaleFactors(img: any) {
    const hsf = 2000.0 / img.image.width;
    const lsf = 600.0 / img.image.width;
    const mask = this.getMask();
    let rowcount = 50;
    if (mask.length === 10000) rowcount = 100;
    // console.log(mask);
    const { x: x1, y: y1 } = mask[0].coordinates;
    const { x: x2, y: y2 } = mask[rowcount].coordinates;
    const spot_fiduciary_ratio = 1.6153846;
    const sdf = Math.sqrt(((x2 - x1) ** 2) + ((y2 - y1) ** 2));
    return {
      spot_diameter_fullres: sdf,
      fiducial_diameter_fullres: sdf * spot_fiduciary_ratio,
      tissue_hires_scalef: hsf,
      tissue_lowres_scalef: lsf,
    };
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
