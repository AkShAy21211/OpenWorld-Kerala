import React, { useState, useEffect } from 'react';
import { ModalWrapper } from '../common/ModalWrapper';
import { useUserStore } from '../../store/useUserStore';
import { soundManager } from '../../utils/audio';
import { Camera, Download, Share2, Check } from 'lucide-react';

export const ScreenshotModal: React.FC = () => {
  const { user } = useUserStore();
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Grab canvas from Babylon 3D container
    const canvas = (document.querySelector('#babylon-canvas') || document.querySelector('canvas')) as HTMLCanvasElement | null;
    if (!canvas) return;

    // Create a framed composite with canvas
    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = canvas.width;
    frameCanvas.height = canvas.height;
    const ctx = frameCanvas.getContext('2d');
    if (!ctx) return;

    // 1. Draw game screenshot
    ctx.drawImage(canvas, 0, 0);

    // 2. Draw Kerala Souvenir decorative border
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, frameCanvas.width - 12, frameCanvas.height - 12);

    ctx.strokeStyle = '#991B1B';
    ctx.lineWidth = 4;
    ctx.strokeRect(14, 14, frameCanvas.width - 28, frameCanvas.height - 28);

    // 3. Draw Kerala Fair Stamp / Banner at bottom
    ctx.fillStyle = 'rgba(28, 16, 11, 0.85)';
    ctx.fillRect(16, frameCanvas.height - 52, frameCanvas.width - 32, 36);

    ctx.fillStyle = '#FEF08A';
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('🪔 Kerala Fair — One Fair Building', 32, frameCanvas.height - 28);

    ctx.fillStyle = '#F59E0B';
    ctx.font = '13px "Plus Jakarta Sans", sans-serif';
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    ctx.fillText(`Visitor: ${user?.displayName || 'Traveler'} • ${dateStr}`, frameCanvas.width - 290, frameCanvas.height - 28);

    const dataUrl = frameCanvas.toDataURL('image/png');
    setPhotoData(dataUrl);
    soundManager.playPop();
  }, [user]);

  const handleDownload = () => {
    if (!photoData) return;
    soundManager.playBell();
    const link = document.createElement('a');
    link.download = `kerala-fair-souvenir-${Date.now()}.png`;
    link.href = photoData;
    link.click();
  };

  const handleShare = () => {
    soundManager.playPop();
    const shareUrl = window.location.origin;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <ModalWrapper title="Souvenir Photo Corner" malayalamTitle="ഓർമ്മച്ചിത്രം" icon="📷" maxWidth="max-w-xl">
      <div className="space-y-4 text-center">
        {photoData ? (
          <div className="relative rounded-xl overflow-hidden border-2 border-amber-500/50 shadow-2xl">
            <img src={photoData} alt="Kerala Fair Souvenir" className="w-full h-auto block" />
          </div>
        ) : (
          <div className="py-16 text-stone-400">Capturing fair postcard...</div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleDownload}
            disabled={!photoData}
            className="flex-1 py-3 px-4 kerala-btn rounded-xl font-bold text-sm flex items-center justify-center gap-2"
          >
            <Download size={16} /> Download Souvenir Photo
          </button>

          <button
            onClick={handleShare}
            className="py-3 px-4 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors"
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
            {copied ? 'Link Copied!' : 'Invite Friend'}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};
