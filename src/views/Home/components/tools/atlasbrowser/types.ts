
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

export interface Polygon {
  sceneFunc: Function,
  id: string,
  fill: string | null,
  centerx: number,
  centery: number,
  radius: number,
  stroke: string,
  strokeWidth: number,
  posit: Array<number>,
  scaleX: number,
  scaleY: number,
  raw_fragments: number | null,
  log_fragments: number | null,
}
