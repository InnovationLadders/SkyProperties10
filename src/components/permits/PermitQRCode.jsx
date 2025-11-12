import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { Download } from 'lucide-react';
import { Button } from '../ui/Button';

export const PermitQRCode = ({ permitId, qrData, size = 200 }) => {
  const { t } = useTranslation();

  const downloadQRCode = () => {
    const svg = document.getElementById(`qr-${permitId}`);
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = size;
    canvas.height = size;

    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `permit-${permitId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
        <QRCodeSVG
          id={`qr-${permitId}`}
          value={qrData}
          size={size}
          level="H"
          includeMargin={true}
        />
      </div>
      <Button
        onClick={downloadQRCode}
        variant="outline"
        className="gap-2"
      >
        <Download className="w-4 h-4" />
        {t('permit.downloadQRCode')}
      </Button>
    </div>
  );
};
