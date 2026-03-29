import { QRCodeSVG } from 'qrcode.react';
import { AVERY_TEMPLATES, type LabelGeneratorConfig } from '@/lib/label-templates';

export interface ZoneLabelData {
  zoneId: string;
  zoneName: string;
  targetNC: number;
  floorName: string;
  spaceType: string;
  buildingName?: string;
}

interface AveryZoneLabelProps {
  zone: ZoneLabelData;
  templateId: string;
  config: LabelGeneratorConfig;
  projectId: string;
}

export function AveryZoneLabel({ zone, templateId, config, projectId }: AveryZoneLabelProps) {
  const template = AVERY_TEMPLATES[templateId];
  if (!template) return null;

  const deepLinkUrl = `${window.location.origin}/design/acoustic-measurement?zoneId=${zone.zoneId}&projectId=${projectId}&autoStart=true`;

  switch (templateId) {
    case '5160':
      return (
        <Avery5160Label
          zone={zone}
          config={config}
          deepLinkUrl={deepLinkUrl}
          qrSize={template.qrSize}
        />
      );
    case '5163':
      return (
        <Avery5163Label
          zone={zone}
          config={config}
          deepLinkUrl={deepLinkUrl}
          qrSize={template.qrSize}
        />
      );
    case '5167':
      return (
        <Avery5167Label
          zone={zone}
          config={config}
          deepLinkUrl={deepLinkUrl}
          qrSize={template.qrSize}
        />
      );
    default:
      return null;
  }
}

interface LabelVariantProps {
  zone: ZoneLabelData;
  config: LabelGeneratorConfig;
  deepLinkUrl: string;
  qrSize: number;
}

// Avery 5160: Address Labels - 66.7mm × 25.4mm (compact horizontal)
function Avery5160Label({ zone, config, deepLinkUrl, qrSize }: LabelVariantProps) {
  return (
    <div
      className="flex items-center gap-1 p-0.5 bg-white overflow-hidden"
      style={{
        width: '66.7mm',
        height: '25.4mm',
        fontSize: '7pt',
        lineHeight: '1.1',
      }}
    >
      {config.showQRCode && (
        <div className="flex-shrink-0">
          <QRCodeSVG
            value={deepLinkUrl}
            size={qrSize * 3.78} // mm to pixels at 96dpi
            level="M"
            includeMargin={false}
          />
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        {config.showZoneName && (
          <div className="font-bold truncate" style={{ fontSize: '8pt' }}>
            {zone.zoneName}
          </div>
        )}
        {config.showTargetNC && (
          <div className="text-gray-700" style={{ fontSize: '7pt' }}>
            Target NC: {zone.targetNC}
          </div>
        )}
        {config.showFloorName && (
          <div className="text-gray-500 truncate" style={{ fontSize: '6pt' }}>
            {zone.floorName}
          </div>
        )}
      </div>
    </div>
  );
}

// Avery 5163: Shipping Labels - 101.6mm × 50.8mm (full info vertical)
function Avery5163Label({ zone, config, deepLinkUrl, qrSize }: LabelVariantProps) {
  return (
    <div
      className="flex flex-col items-center justify-center p-1 bg-white overflow-hidden"
      style={{
        width: '101.6mm',
        height: '50.8mm',
        fontSize: '9pt',
        lineHeight: '1.2',
      }}
    >
      {config.showQRCode && (
        <div className="mb-1">
          <QRCodeSVG
            value={deepLinkUrl}
            size={qrSize * 3.78}
            level="M"
            includeMargin={false}
          />
        </div>
      )}
      <div className="text-center w-full">
        {config.showZoneName && (
          <div className="font-bold truncate" style={{ fontSize: '11pt' }}>
            {zone.zoneName}
          </div>
        )}
        <div className="flex justify-center gap-2 mt-0.5">
          {config.showTargetNC && (
            <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 rounded" style={{ fontSize: '9pt' }}>
              NC {zone.targetNC}
            </span>
          )}
          {config.showSpaceType && (
            <span className="text-gray-600" style={{ fontSize: '8pt' }}>
              {zone.spaceType}
            </span>
          )}
        </div>
        {config.showFloorName && (
          <div className="text-gray-500 mt-0.5 truncate" style={{ fontSize: '8pt' }}>
            {zone.floorName}
          </div>
        )}
        {config.showInstructions && (
          <div className="text-gray-400 mt-1" style={{ fontSize: '6pt' }}>
            Scan QR to start NC measurement
          </div>
        )}
      </div>
    </div>
  );
}

// Avery 5167: Return Address Labels - 44.5mm × 12.7mm (ultra compact)
function Avery5167Label({ zone, config, deepLinkUrl, qrSize }: LabelVariantProps) {
  return (
    <div
      className="flex items-center gap-0.5 px-0.5 bg-white overflow-hidden"
      style={{
        width: '44.5mm',
        height: '12.7mm',
        fontSize: '5pt',
        lineHeight: '1',
      }}
    >
      {config.showQRCode && (
        <div className="flex-shrink-0">
          <QRCodeSVG
            value={deepLinkUrl}
            size={qrSize * 3.78}
            level="L"
            includeMargin={false}
          />
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        {config.showZoneName && (
          <div className="font-bold truncate" style={{ fontSize: '6pt' }}>
            {zone.zoneName}
          </div>
        )}
        {config.showTargetNC && (
          <div className="text-gray-600" style={{ fontSize: '5pt' }}>
            NC{zone.targetNC}
          </div>
        )}
      </div>
    </div>
  );
}
