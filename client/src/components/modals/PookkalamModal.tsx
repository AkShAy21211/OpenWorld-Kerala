import React, { useState, useEffect } from 'react';
import { ModalWrapper } from '../common/ModalWrapper';
import { useUserStore } from '../../store/useUserStore';
import { fetchPookkalams, savePookkalamDesign } from '../../services/api';
import { soundManager } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { PookkalamDesignRecord } from 'fair-shared';
import { Palette, Sparkles, Image as ImageIcon, Send } from 'lucide-react';

const FLOWER_PALETTE = [
  { name: 'Yellow Marigold (Jamanthi)', hex: '#FACC15' },
  { name: 'Orange Marigold (Chethi)', hex: '#EA580C' },
  { name: 'Red Hibiscus (Chembarathi)', hex: '#DC2626' },
  { name: 'Sacred White (Thumba)', hex: '#FDFBF7' },
  { name: 'Pink Lotus (Thamara)', hex: '#EC4899' },
  { name: 'Tulsi Green (Thulasi)', hex: '#16A34A' },
  { name: 'Royal Purple (Arali)', hex: '#8B5CF6' },
];

export const PookkalamModal: React.FC = () => {
  const { addPoints } = useUserStore();
  const [tab, setTab] = useState<'create' | 'gallery'>('create');
  
  // Creation form state
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([
    '#FACC15', // Yellow
    '#EA580C', // Orange
    '#DC2626', // Red
    '#FDFBF7', // White
  ]);
  const [pattern, setPattern] = useState<'chakram' | 'lotus' | 'star' | 'rings'>('chakram');
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Gallery state
  const [designs, setDesigns] = useState<PookkalamDesignRecord[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);

  useEffect(() => {
    if (tab === 'gallery') {
      setLoadingGallery(true);
      fetchPookkalams()
        .then((res) => setDesigns(res.designs))
        .catch(console.error)
        .finally(() => setLoadingGallery(false));
    }
  }, [tab]);

  const toggleColor = (hex: string) => {
    soundManager.playPop();
    if (selectedColors.includes(hex)) {
      if (selectedColors.length > 2) {
        setSelectedColors(selectedColors.filter(c => c !== hex));
      }
    } else {
      if (selectedColors.length < 4) {
        setSelectedColors([...selectedColors, hex]);
      } else {
        // Replace last
        setSelectedColors([...selectedColors.slice(0, 3), hex]);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setNotice(null);

    try {
      const res = await savePookkalamDesign(title || 'Kerala Floral Carpet', selectedColors, pattern, caption);
      if (res.success) {
        soundManager.playSuccess();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: selectedColors,
        });
        addPoints(3);
        setNotice('🌸 Pookkalam carpet shared! You earned 3 Fair Points.');
        setTitle('');
        setCaption('');
        setTab('gallery');
      }
    } catch (err) {
      console.error(err);
      setNotice('Failed to save pookkalam.');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to render decorative SVG Pookkalam preview
  const renderPookkalamSvg = (colors: string[], pat: string, size = 160) => {
    const c1 = colors[0] || '#EA580C';
    const c2 = colors[1] || '#FACC15';
    const c3 = colors[2] || '#DC2626';
    const c4 = colors[3] || '#FDFBF7';
    const center = size / 2;

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-lg">
        {/* Outer Ring */}
        <circle cx={center} cy={center} r={center - 4} fill="#166534" />
        <circle cx={center} cy={center} r={center - 10} fill={c1} />
        
        {/* Concentric / Patterned Layer */}
        {pat === 'lotus' ? (
          <g>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((ang) => (
              <ellipse
                key={ang}
                cx={center + Math.cos((ang * Math.PI) / 180) * (size * 0.22)}
                cy={center + Math.sin((ang * Math.PI) / 180) * (size * 0.22)}
                rx={size * 0.12}
                ry={size * 0.07}
                fill={c2}
                transform={`rotate(${ang} ${center + Math.cos((ang * Math.PI) / 180) * (size * 0.22)} ${center + Math.sin((ang * Math.PI) / 180) * (size * 0.22)})`}
              />
            ))}
          </g>
        ) : pat === 'star' ? (
          <g>
            <polygon
              points={`${center},${size * 0.15} ${size * 0.85},${center} ${center},${size * 0.85} ${size * 0.15},${center}`}
              fill={c2}
            />
            <polygon
              points={`${center},${size * 0.25} ${size * 0.75},${center} ${center},${size * 0.75} ${size * 0.25},${center}`}
              fill={c3}
              transform={`rotate(45 ${center} ${center})`}
            />
          </g>
        ) : (
          /* Chakram / Rings */
          <g>
            <circle cx={center} cy={center} r={size * 0.34} fill={c2} />
            <circle cx={center} cy={center} r={size * 0.24} fill={c3} />
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <line
                key={deg}
                x1={center}
                y1={center}
                x2={center + Math.cos((deg * Math.PI) / 180) * (size * 0.34)}
                y2={center + Math.sin((deg * Math.PI) / 180) * (size * 0.34)}
                stroke={c4}
                strokeWidth="2"
              />
            ))}
          </g>
        )}

        {/* Inner Floral Core & Vilakku Lamp Base */}
        <circle cx={center} cy={center} r={size * 0.14} fill={c4} />
        <circle cx={center} cy={center} r={size * 0.08} fill="#D4AF37" stroke="#B8860B" strokeWidth="2" />
        <circle cx={center} cy={center} r={size * 0.03} fill="#FEF08A" />
      </svg>
    );
  };

  return (
    <ModalWrapper title="Pookkalam Floral Corner" malayalamTitle="പൂക്കളം" icon="🌸" maxWidth="max-w-2xl">
      <div className="space-y-5">
        {/* Tab Selector */}
        <div className="flex border-b border-stone-800">
          <button
            onClick={() => {
              soundManager.playPop();
              setTab('create');
            }}
            className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
              tab === 'create'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Palette size={16} /> Create Design
          </button>
          <button
            onClick={() => {
              soundManager.playPop();
              setTab('gallery');
            }}
            className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
              tab === 'gallery'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <ImageIcon size={16} /> Community Gallery
          </button>
        </div>

        {notice && (
          <div className="p-3 bg-amber-950/70 border border-amber-500/40 rounded-xl text-center text-xs text-amber-200">
            {notice}
          </div>
        )}

        {tab === 'create' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Live Interactive Preview */}
            <div className="flex flex-col items-center justify-center p-4 bg-stone-950/60 rounded-2xl border border-stone-800">
              <div className="p-2 bg-stone-900/80 rounded-2xl border border-amber-500/20 shadow-inner">
                {renderPookkalamSvg(selectedColors, pattern, 180)}
              </div>
              <span className="text-xs text-amber-400/80 mt-3 font-medium">Live Rangoli Preview</span>
            </div>

            {/* Customizer Controls */}
            <form onSubmit={handleSave} className="space-y-4 text-left">
              {/* Pattern Selector */}
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1.5">Mandala Pattern:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['chakram', 'lotus', 'star'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        soundManager.playPop();
                        setPattern(p);
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium capitalize border transition-all ${
                        pattern === p
                          ? 'bg-amber-600 text-white border-amber-400'
                          : 'bg-stone-900 text-stone-300 border-stone-700 hover:border-stone-500'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Flower Color Palette */}
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                  Pick Flower Petals (Up to 4):
                </label>
                <div className="flex flex-wrap gap-2">
                  {FLOWER_PALETTE.map((f) => {
                    const isPicked = selectedColors.includes(f.hex);
                    return (
                      <button
                        key={f.hex}
                        type="button"
                        onClick={() => toggleColor(f.hex)}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${
                          isPicked ? 'scale-110 border-white shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: f.hex }}
                        title={f.name}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Title Input */}
              <div>
                <input
                  type="text"
                  placeholder="Carpet Title (e.g. Onam Atham)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={32}
                  className="w-full px-3 py-2 bg-stone-900/90 border border-stone-700 rounded-lg text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Caption Input */}
              <div>
                <input
                  type="text"
                  placeholder="Short greeting or caption (optional)"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={80}
                  className="w-full px-3 py-2 bg-stone-900/90 border border-stone-700 rounded-lg text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 px-4 kerala-btn rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              >
                <Send size={16} />
                {isSaving ? 'Placing Petals...' : 'Place in Photo Corner (+3 pts)'}
              </button>
            </form>
          </div>
        ) : (
          /* Community Gallery */
          <div className="space-y-4">
            {loadingGallery ? (
              <div className="text-center py-8 text-stone-400">Loading flower carpets...</div>
            ) : designs.length === 0 ? (
              <div className="text-center py-8 text-stone-400 text-xs">
                No designs yet. Be the first to lay down a flower carpet!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-1">
                {designs.map((d) => (
                  <div key={d.id} className="p-3.5 bg-stone-900/70 border border-stone-800 rounded-xl flex items-center gap-3">
                    <div className="shrink-0">
                      {renderPookkalamSvg(d.colors, d.pattern, 76)}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <h4 className="text-xs font-bold text-amber-200 truncate">{d.title}</h4>
                      <p className="text-[11px] text-stone-400">by {d.displayName}</p>
                      {d.caption && (
                        <p className="text-[11px] text-stone-300 italic mt-1 line-clamp-2">"{d.caption}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};
