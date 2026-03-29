import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  LabelSize, 
  LabelGeneratorConfig, 
  LABEL_SIZES, 
  mmToPixels,
  getColorSchemeClasses 
} from '@/lib/label-templates';

export interface ZoneLabelData {
  zoneId: string;
  zoneName: string;
  targetNC: number;
  floorName: string;
  spaceType: string;
  buildingName?: string;
}

interface AcousticZoneLabelProps {
  zone: ZoneLabelData;
  config: LabelGeneratorConfig;
  projectId: string;
  baseUrl?: string;
  forPrint?: boolean;
}

export function AcousticZoneLabel({
  zone,
  config,
  projectId,
  baseUrl = window.location.origin,
  forPrint = false,
}: AcousticZoneLabelProps) {
  const sizeConfig = LABEL_SIZES[config.labelSize];
  const { dimensions, layout } = sizeConfig;
  const colorClasses = getColorSchemeClasses(config.colorScheme);
  
  // Generate deep link URL
  const measurementUrl = `${baseUrl}/commissioning/acoustic-measurement?zoneId=${zone.zoneId}&autoStart=true`;
  
  // Calculate pixel sizes for screen display (use mm for print)
  const scaleFactor = forPrint ? 3.78 : 2.5; // Higher res for print
  const width = dimensions.width * scaleFactor;
  const height = dimensions.height * scaleFactor;
  const qrSize = dimensions.qrSize * scaleFactor;
  
  const borderClass = {
    solid: 'border-2',
    dashed: 'border-2 border-dashed',
    none: 'border-0',
  }[config.borderStyle];

  if (config.labelSize === 'small') {
    return (
      <SmallLabel
        zone={zone}
        config={config}
        measurementUrl={measurementUrl}
        width={width}
        height={height}
        qrSize={qrSize}
        borderClass={borderClass}
        colorClasses={colorClasses}
        forPrint={forPrint}
      />
    );
  }

  if (config.labelSize === 'badge') {
    return (
      <BadgeLabel
        zone={zone}
        config={config}
        measurementUrl={measurementUrl}
        width={width}
        height={height}
        qrSize={qrSize}
        borderClass={borderClass}
        colorClasses={colorClasses}
        forPrint={forPrint}
      />
    );
  }

  if (config.labelSize === 'large') {
    return (
      <LargeLabel
        zone={zone}
        config={config}
        measurementUrl={measurementUrl}
        width={width}
        height={height}
        qrSize={qrSize}
        borderClass={borderClass}
        colorClasses={colorClasses}
        forPrint={forPrint}
      />
    );
  }

  // Medium (default)
  return (
    <MediumLabel
      zone={zone}
      config={config}
      measurementUrl={measurementUrl}
      width={width}
      height={height}
      qrSize={qrSize}
      borderClass={borderClass}
      colorClasses={colorClasses}
      forPrint={forPrint}
    />
  );
}

interface LabelVariantProps {
  zone: ZoneLabelData;
  config: LabelGeneratorConfig;
  measurementUrl: string;
  width: number;
  height: number;
  qrSize: number;
  borderClass: string;
  colorClasses: ReturnType<typeof getColorSchemeClasses>;
  forPrint: boolean;
}

function SmallLabel({
  zone,
  config,
  measurementUrl,
  width,
  height,
  qrSize,
  borderClass,
  colorClasses,
  forPrint,
}: LabelVariantProps) {
  const fontSize = forPrint ? 'text-[8px]' : 'text-[6px]';
  
  return (
    <div
      className={`${colorClasses.background} ${borderClass} ${colorClasses.border} rounded-sm flex items-center gap-1 p-1`}
      style={{ width, height }}
    >
      {config.showQRCode && (
        <QRCodeSVG
          value={measurementUrl}
          size={qrSize}
          level="M"
          includeMargin={false}
        />
      )}
      <div className="flex flex-col justify-center min-w-0 flex-1">
        {config.showZoneName && (
          <div className={`${fontSize} font-semibold ${colorClasses.text} truncate`}>
            {zone.zoneName}
          </div>
        )}
        <div className={`${fontSize} ${colorClasses.text} opacity-80 truncate`}>
          {config.showTargetNC && `NC-${zone.targetNC}`}
          {config.showTargetNC && config.showFloorName && ' | '}
          {config.showFloorName && zone.floorName}
        </div>
      </div>
    </div>
  );
}

function MediumLabel({
  zone,
  config,
  measurementUrl,
  width,
  height,
  qrSize,
  borderClass,
  colorClasses,
  forPrint,
}: LabelVariantProps) {
  const titleSize = forPrint ? 'text-[10px]' : 'text-[8px]';
  const textSize = forPrint ? 'text-[8px]' : 'text-[7px]';
  
  return (
    <div
      className={`${colorClasses.background} ${borderClass} ${colorClasses.border} rounded flex flex-col items-center justify-center p-2 gap-1`}
      style={{ width, height }}
    >
      {config.showQRCode && (
        <QRCodeSVG
          value={measurementUrl}
          size={qrSize}
          level="M"
          includeMargin={false}
        />
      )}
      {config.showZoneName && (
        <div className={`${titleSize} font-bold ${colorClasses.accent} text-center truncate w-full`}>
          {zone.zoneName}
        </div>
      )}
      {config.showTargetNC && (
        <div className={`${textSize} ${colorClasses.text} text-center`}>
          Target: NC-{zone.targetNC}
        </div>
      )}
      {(config.showFloorName || config.showSpaceType) && (
        <div className={`${textSize} ${colorClasses.text} opacity-80 text-center truncate w-full`}>
          {config.showFloorName && zone.floorName}
          {config.showFloorName && config.showSpaceType && ' - '}
          {config.showSpaceType && zone.spaceType}
        </div>
      )}
    </div>
  );
}

function LargeLabel({
  zone,
  config,
  measurementUrl,
  width,
  height,
  qrSize,
  borderClass,
  colorClasses,
  forPrint,
}: LabelVariantProps) {
  const headerSize = forPrint ? 'text-[9px]' : 'text-[7px]';
  const titleSize = forPrint ? 'text-[12px]' : 'text-[10px]';
  const textSize = forPrint ? 'text-[9px]' : 'text-[8px]';
  const smallSize = forPrint ? 'text-[7px]' : 'text-[6px]';
  
  return (
    <div
      className={`${colorClasses.background} ${borderClass} ${colorClasses.border} rounded flex flex-col items-center p-2`}
      style={{ width, height }}
    >
      <div className={`${headerSize} font-semibold ${colorClasses.text} uppercase tracking-wide mb-1`}>
        Acoustic Zone
      </div>
      
      {config.showQRCode && (
        <div className="border border-gray-200 p-1 rounded mb-1">
          <QRCodeSVG
            value={measurementUrl}
            size={qrSize}
            level="M"
            includeMargin={false}
          />
        </div>
      )}
      
      {config.showZoneName && (
        <div className={`${titleSize} font-bold ${colorClasses.accent} text-center truncate w-full`}>
          {zone.zoneName}
        </div>
      )}
      
      {config.showTargetNC && (
        <div className={`${textSize} ${colorClasses.text} text-center`}>
          Target: NC-{zone.targetNC}
        </div>
      )}
      
      {config.showFloorName && (
        <div className={`${textSize} ${colorClasses.text} opacity-80 text-center`}>
          {zone.floorName}
          {config.showBuildingName && zone.buildingName && ` - ${zone.buildingName}`}
        </div>
      )}
      
      {config.showSpaceType && (
        <div className={`${smallSize} ${colorClasses.text} opacity-70 text-center`}>
          Space Type: {zone.spaceType}
        </div>
      )}
      
      {config.showInstructions && (
        <div className={`${smallSize} ${colorClasses.text} opacity-60 text-center mt-auto`}>
          Scan to record NC measurement
        </div>
      )}
    </div>
  );
}

function BadgeLabel({
  zone,
  config,
  measurementUrl,
  width,
  height,
  qrSize,
  borderClass,
  colorClasses,
  forPrint,
}: LabelVariantProps) {
  const headerSize = forPrint ? 'text-[8px]' : 'text-[6px]';
  const titleSize = forPrint ? 'text-[10px]' : 'text-[8px]';
  const textSize = forPrint ? 'text-[8px]' : 'text-[7px]';
  const smallSize = forPrint ? 'text-[7px]' : 'text-[6px]';
  
  return (
    <div
      className={`${colorClasses.background} ${borderClass} ${colorClasses.border} rounded flex flex-col`}
      style={{ width, height }}
    >
      {/* Header */}
      <div className={`${headerSize} font-semibold bg-muted ${colorClasses.text} px-2 py-1 border-b ${colorClasses.border}`}>
        ACOUSTIC MEASUREMENT ZONE
      </div>
      
      {/* Content */}
      <div className="flex items-center gap-2 p-2 flex-1">
        {config.showQRCode && (
          <QRCodeSVG
            value={measurementUrl}
            size={qrSize}
            level="M"
            includeMargin={false}
          />
        )}
        
        <div className="flex flex-col justify-center min-w-0 flex-1">
          {config.showZoneName && (
            <div className={`${titleSize} font-bold ${colorClasses.accent} truncate`}>
              {zone.zoneName}
            </div>
          )}
          
          {config.showTargetNC && (
            <div className={`${textSize} ${colorClasses.text}`}>
              Target NC: {zone.targetNC}
            </div>
          )}
          
          {config.showFloorName && (
            <div className={`${textSize} ${colorClasses.text} opacity-80`}>
              Floor: {zone.floorName}
            </div>
          )}
          
          {config.showSpaceType && (
            <div className={`${textSize} ${colorClasses.text} opacity-70`}>
              Type: {zone.spaceType}
            </div>
          )}
        </div>
      </div>
      
      {/* Footer */}
      {config.showInstructions && (
        <div className={`${smallSize} ${colorClasses.text} opacity-60 text-center px-2 py-1 border-t ${colorClasses.border}`}>
          Scan QR to start measurement
        </div>
      )}
    </div>
  );
}
