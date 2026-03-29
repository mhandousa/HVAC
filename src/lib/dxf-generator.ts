// Basic DXF File Generator for HVAC Schematics
// Generates DXF R12/R13 compatible format

export interface DXFPoint {
  x: number;
  y: number;
}

export interface DXFLine {
  type: 'line';
  start: DXFPoint;
  end: DXFPoint;
  layer: string;
  color?: number;
}

export interface DXFCircle {
  type: 'circle';
  center: DXFPoint;
  radius: number;
  layer: string;
  color?: number;
}

export interface DXFText {
  type: 'text';
  position: DXFPoint;
  height: number;
  text: string;
  layer: string;
  color?: number;
  rotation?: number;
}

export interface DXFPolyline {
  type: 'polyline';
  points: DXFPoint[];
  closed: boolean;
  layer: string;
  color?: number;
}

export type DXFEntity = DXFLine | DXFCircle | DXFText | DXFPolyline;

export interface DXFLayer {
  name: string;
  color: number;
  lineType: string;
}

// AutoCAD Color Index (ACI) common colors
export const DXF_COLORS = {
  RED: 1,
  YELLOW: 2,
  GREEN: 3,
  CYAN: 4,
  BLUE: 5,
  MAGENTA: 6,
  WHITE: 7,
  GRAY: 8,
  LIGHT_GRAY: 9,
};

// Standard layers for HVAC drawings
export const HVAC_LAYERS: DXFLayer[] = [
  { name: 'M-DUCT-SUPPLY', color: DXF_COLORS.CYAN, lineType: 'CONTINUOUS' },
  { name: 'M-DUCT-RETURN', color: DXF_COLORS.GREEN, lineType: 'CONTINUOUS' },
  { name: 'M-DUCT-EXHAUST', color: DXF_COLORS.MAGENTA, lineType: 'CONTINUOUS' },
  { name: 'M-PIPE-CHW', color: DXF_COLORS.BLUE, lineType: 'CONTINUOUS' },
  { name: 'M-PIPE-HW', color: DXF_COLORS.RED, lineType: 'CONTINUOUS' },
  { name: 'M-PIPE-REFRIG', color: DXF_COLORS.CYAN, lineType: 'DASHED' },
  { name: 'M-EQUIP', color: DXF_COLORS.WHITE, lineType: 'CONTINUOUS' },
  { name: 'M-TEXT', color: DXF_COLORS.WHITE, lineType: 'CONTINUOUS' },
  { name: 'M-DIMS', color: DXF_COLORS.GRAY, lineType: 'CONTINUOUS' },
];

class DXFWriter {
  private lines: string[] = [];
  private handle = 100;

  private nextHandle(): string {
    return (this.handle++).toString(16).toUpperCase();
  }

  private addGroupCode(code: number, value: string | number): void {
    this.lines.push(code.toString());
    this.lines.push(value.toString());
  }

  private writeHeader(): void {
    this.addGroupCode(0, 'SECTION');
    this.addGroupCode(2, 'HEADER');
    
    // AutoCAD version
    this.addGroupCode(9, '$ACADVER');
    this.addGroupCode(1, 'AC1009'); // AutoCAD R12
    
    // Drawing units (decimal)
    this.addGroupCode(9, '$LUNITS');
    this.addGroupCode(70, 2);
    
    // Drawing extents
    this.addGroupCode(9, '$EXTMIN');
    this.addGroupCode(10, 0);
    this.addGroupCode(20, 0);
    this.addGroupCode(30, 0);
    
    this.addGroupCode(9, '$EXTMAX');
    this.addGroupCode(10, 1000);
    this.addGroupCode(20, 1000);
    this.addGroupCode(30, 0);
    
    this.addGroupCode(0, 'ENDSEC');
  }

  private writeTables(layers: DXFLayer[]): void {
    this.addGroupCode(0, 'SECTION');
    this.addGroupCode(2, 'TABLES');
    
    // Line types table
    this.addGroupCode(0, 'TABLE');
    this.addGroupCode(2, 'LTYPE');
    this.addGroupCode(70, 2);
    
    // Continuous line type
    this.addGroupCode(0, 'LTYPE');
    this.addGroupCode(2, 'CONTINUOUS');
    this.addGroupCode(70, 0);
    this.addGroupCode(3, 'Solid line');
    this.addGroupCode(72, 65);
    this.addGroupCode(73, 0);
    this.addGroupCode(40, 0);
    
    // Dashed line type
    this.addGroupCode(0, 'LTYPE');
    this.addGroupCode(2, 'DASHED');
    this.addGroupCode(70, 0);
    this.addGroupCode(3, 'Dashed _ _ _ _');
    this.addGroupCode(72, 65);
    this.addGroupCode(73, 2);
    this.addGroupCode(40, 0.75);
    this.addGroupCode(49, 0.5);
    this.addGroupCode(49, -0.25);
    
    this.addGroupCode(0, 'ENDTAB');
    
    // Layers table
    this.addGroupCode(0, 'TABLE');
    this.addGroupCode(2, 'LAYER');
    this.addGroupCode(70, layers.length + 1);
    
    // Default layer 0
    this.addGroupCode(0, 'LAYER');
    this.addGroupCode(2, '0');
    this.addGroupCode(70, 0);
    this.addGroupCode(62, 7);
    this.addGroupCode(6, 'CONTINUOUS');
    
    // Custom layers
    for (const layer of layers) {
      this.addGroupCode(0, 'LAYER');
      this.addGroupCode(2, layer.name);
      this.addGroupCode(70, 0);
      this.addGroupCode(62, layer.color);
      this.addGroupCode(6, layer.lineType);
    }
    
    this.addGroupCode(0, 'ENDTAB');
    this.addGroupCode(0, 'ENDSEC');
  }

  private writeEntities(entities: DXFEntity[]): void {
    this.addGroupCode(0, 'SECTION');
    this.addGroupCode(2, 'ENTITIES');
    
    for (const entity of entities) {
      switch (entity.type) {
        case 'line':
          this.writeLine(entity);
          break;
        case 'circle':
          this.writeCircle(entity);
          break;
        case 'text':
          this.writeText(entity);
          break;
        case 'polyline':
          this.writePolyline(entity);
          break;
      }
    }
    
    this.addGroupCode(0, 'ENDSEC');
  }

  private writeLine(line: DXFLine): void {
    this.addGroupCode(0, 'LINE');
    this.addGroupCode(8, line.layer);
    if (line.color) this.addGroupCode(62, line.color);
    this.addGroupCode(10, line.start.x);
    this.addGroupCode(20, line.start.y);
    this.addGroupCode(30, 0);
    this.addGroupCode(11, line.end.x);
    this.addGroupCode(21, line.end.y);
    this.addGroupCode(31, 0);
  }

  private writeCircle(circle: DXFCircle): void {
    this.addGroupCode(0, 'CIRCLE');
    this.addGroupCode(8, circle.layer);
    if (circle.color) this.addGroupCode(62, circle.color);
    this.addGroupCode(10, circle.center.x);
    this.addGroupCode(20, circle.center.y);
    this.addGroupCode(30, 0);
    this.addGroupCode(40, circle.radius);
  }

  private writeText(text: DXFText): void {
    this.addGroupCode(0, 'TEXT');
    this.addGroupCode(8, text.layer);
    if (text.color) this.addGroupCode(62, text.color);
    this.addGroupCode(10, text.position.x);
    this.addGroupCode(20, text.position.y);
    this.addGroupCode(30, 0);
    this.addGroupCode(40, text.height);
    this.addGroupCode(1, text.text);
    if (text.rotation) this.addGroupCode(50, text.rotation);
  }

  private writePolyline(polyline: DXFPolyline): void {
    this.addGroupCode(0, 'POLYLINE');
    this.addGroupCode(8, polyline.layer);
    if (polyline.color) this.addGroupCode(62, polyline.color);
    this.addGroupCode(66, 1);
    this.addGroupCode(70, polyline.closed ? 1 : 0);
    
    for (const point of polyline.points) {
      this.addGroupCode(0, 'VERTEX');
      this.addGroupCode(8, polyline.layer);
      this.addGroupCode(10, point.x);
      this.addGroupCode(20, point.y);
      this.addGroupCode(30, 0);
    }
    
    this.addGroupCode(0, 'SEQEND');
    this.addGroupCode(8, polyline.layer);
  }

  private writeEOF(): void {
    this.addGroupCode(0, 'EOF');
  }

  public generate(entities: DXFEntity[], layers: DXFLayer[] = HVAC_LAYERS): string {
    this.lines = [];
    this.handle = 100;
    
    this.writeHeader();
    this.writeTables(layers);
    this.writeEntities(entities);
    this.writeEOF();
    
    return this.lines.join('\n');
  }
}

// Helper functions to create entities
export function createLine(
  startX: number, startY: number,
  endX: number, endY: number,
  layer: string,
  color?: number
): DXFLine {
  return {
    type: 'line',
    start: { x: startX, y: startY },
    end: { x: endX, y: endY },
    layer,
    color,
  };
}

export function createCircle(
  centerX: number, centerY: number,
  radius: number,
  layer: string,
  color?: number
): DXFCircle {
  return {
    type: 'circle',
    center: { x: centerX, y: centerY },
    radius,
    layer,
    color,
  };
}

export function createText(
  x: number, y: number,
  height: number,
  text: string,
  layer: string,
  color?: number,
  rotation?: number
): DXFText {
  return {
    type: 'text',
    position: { x, y },
    height,
    text,
    layer,
    color,
    rotation,
  };
}

export function createRectangle(
  x: number, y: number,
  width: number, height: number,
  layer: string,
  color?: number
): DXFPolyline {
  return {
    type: 'polyline',
    points: [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height },
    ],
    closed: true,
    layer,
    color,
  };
}

// Equipment symbols
export function createAHUSymbol(x: number, y: number, scale: number = 1): DXFEntity[] {
  const entities: DXFEntity[] = [];
  const layer = 'M-EQUIP';
  
  // Box
  entities.push(createRectangle(x, y, 40 * scale, 20 * scale, layer));
  
  // Fan circle
  entities.push(createCircle(x + 30 * scale, y + 10 * scale, 5 * scale, layer));
  
  // Coil lines
  for (let i = 0; i < 3; i++) {
    entities.push(createLine(
      x + 5 * scale + i * 5 * scale, y + 3 * scale,
      x + 5 * scale + i * 5 * scale, y + 17 * scale,
      layer
    ));
  }
  
  return entities;
}

export function createFCUSymbol(x: number, y: number, scale: number = 1): DXFEntity[] {
  const entities: DXFEntity[] = [];
  const layer = 'M-EQUIP';
  
  // Box
  entities.push(createRectangle(x, y, 20 * scale, 15 * scale, layer));
  
  // Fan circle
  entities.push(createCircle(x + 10 * scale, y + 7.5 * scale, 4 * scale, layer));
  
  return entities;
}

export function createDiffuserSymbol(x: number, y: number, scale: number = 1): DXFEntity[] {
  const entities: DXFEntity[] = [];
  const layer = 'M-EQUIP';
  
  // Square with X
  entities.push(createRectangle(x, y, 10 * scale, 10 * scale, layer));
  entities.push(createLine(x, y, x + 10 * scale, y + 10 * scale, layer));
  entities.push(createLine(x + 10 * scale, y, x, y + 10 * scale, layer));
  
  return entities;
}

// Generate DXF file
export function generateDXF(entities: DXFEntity[], layers?: DXFLayer[]): string {
  const writer = new DXFWriter();
  return writer.generate(entities, layers);
}

// Download DXF file
export function downloadDXF(entities: DXFEntity[], filename: string, layers?: DXFLayer[]): void {
  const content = generateDXF(entities, layers);
  const blob = new Blob([content], { type: 'application/dxf' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.dxf') ? filename : `${filename}.dxf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
