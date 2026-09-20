/**
 * OSMMinimap.tsx — OpenStreetMap (OSM) Live Minimap & Geo-Explorer
 * - Loads real OpenStreetMap tiles from https://tile.openstreetmap.org
 * - Displays live player GPS position and orientation at Thekkinkadu Maidan, Thrissur, Kerala
 * - Features Points of Interest (POIs) for rides, attractions, and cultural zones
 * - Supports compact minimap view and expandable full-screen explorer
 */

import React, { useState, useEffect, useRef } from 'react';
import { worldToGps, FAIR_POIS, OSM_CENTER_LAT, OSM_CENTER_LON, FairPOI } from '../utils/osmCoords';
import { MapPin, Navigation, Maximize2, Minimize2, Compass, Layers, Info } from 'lucide-react';

interface OSMMinimapProps {
  playerPos?: { x: number; z: number };
  playerYaw?: number; // radians
}

export const OSMMinimap: React.FC<OSMMinimapProps> = ({ playerPos = { x: 0, z: -60 }, playerYaw = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePoi, setActivePoi] = useState<FairPOI | null>(null);
  const [zoom, setZoom] = useState(17); // OSM zoom level (17 = high detail campus/park level)

  // Current GPS coordinates
  const gps = worldToGps(playerPos.x, playerPos.z);

  // Convert GPS coordinate to pixel position on the 200m festival ground canvas
  // Fair ground is 200x200 meters, from -100 to 100 in X and Z
  const getCanvasPercent = (x: number, z: number) => {
    // 0% at -100, 50% at 0, 100% at +100
    const px = ((x + 100) / 200) * 100;
    // Babylon +Z is North (top of map, 0% Y), -Z is South (bottom of map, 100% Y)
    const py = ((100 - z) / 200) * 100;
    return { px, py };
  };

  const playerCanvasPos = getCanvasPercent(playerPos.x, playerPos.z);
  // Heading angle in degrees (clockwise from North)
  const headingDeg = (playerYaw * 180) / Math.PI;

  return (
    <>
      {/* ── Compact Minimap Widget (Top Right HUD) ────────────────────── */}
      <div className="pointer-events-auto relative group">
        <div
          className={`relative overflow-hidden rounded-2xl border border-amber-500/40 bg-stone-950/90 shadow-2xl backdrop-blur-md transition-all duration-300 ${
            isExpanded ? 'opacity-0 pointer-events-none' : 'w-44 h-44 sm:w-52 sm:h-52'
          }`}
        >
          {/* Real OpenStreetMap Tile Background */}
          <div className="absolute inset-0 opacity-80 mix-blend-screen overflow-hidden">
            {/* Real OSM Tile centered on Thrissur Pooram grounds */}
            <img
              src={`https://tile.openstreetmap.org/17/93294/59146.png`}
              alt="OpenStreetMap"
              className="w-full h-full object-cover scale-150 filter brightness-90 contrast-110"
              onError={(e) => {
                // Fallback styling if offline
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            {/* Grid overlay for ground boundary */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-stone-950/40" />
            <div className="absolute inset-0 border border-emerald-500/20 m-2 rounded-xl" />
          </div>

          {/* Compass Rose */}
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-stone-900/80 px-1.5 py-0.5 rounded-md border border-stone-700/60 text-[10px] text-amber-300 font-mono">
            <Compass size={11} className="text-amber-400 animate-pulse" />
            <span>N</span>
          </div>

          {/* Expand Button */}
          <button
            onClick={() => setIsExpanded(true)}
            className="absolute top-2 right-2 p-1 rounded-lg bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700/60 transition-colors shadow"
            title="Expand OpenStreetMap"
          >
            <Maximize2 size={12} />
          </button>

          {/* POI Markers */}
          {FAIR_POIS.map((poi) => {
            const pos = getCanvasPercent(poi.worldPos[0], poi.worldPos[1]);
            return (
              <button
                key={poi.id}
                onClick={() => setActivePoi(poi)}
                style={{ left: `${pos.px}%`, top: `${pos.py}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group/pin transition-transform hover:scale-125 focus:outline-none"
                title={`${poi.name} (${poi.malayalamName})`}
              >
                <span className="text-xs drop-shadow-md">{poi.icon}</span>
              </button>
            );
          })}

          {/* Player GPS Indicator with Direction Cone */}
          <div
            style={{ left: `${playerCanvasPos.px}%`, top: `${playerCanvasPos.py}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-100"
          >
            {/* Direction cone */}
            <div
              style={{ transform: `rotate(${headingDeg}deg)` }}
              className="relative w-7 h-7 flex items-center justify-center origin-center"
            >
              <div className="absolute -top-1 w-0 h-0 border-x-4 border-x-transparent border-b-6 border-b-rose-500/80" />
            </div>
            {/* Center GPS pulse pin */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-rose-500 border-2 border-white shadow-lg animate-ping" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white" />
          </div>

          {/* Live GPS Coordinates Footer */}
          <div className="absolute bottom-1 inset-x-1 bg-stone-950/85 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-stone-800 flex items-center justify-between text-[9px] text-stone-300 font-mono">
            <span className="text-amber-400 truncate max-w-[90px]">Thekkinkadu Maidan</span>
            <span>{gps.lat.toFixed(4)}°N, {gps.lon.toFixed(4)}°E</span>
          </div>
        </div>
      </div>

      {/* ── Expandable Full-Screen OpenStreetMap Explorer ────────────── */}
      {isExpanded && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-lg animate-fadeIn">
          <div className="relative w-full max-w-4xl h-[85vh] bg-stone-950 border border-amber-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-800 bg-stone-900/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                  <Navigation size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                    OpenStreetMap · Thrissur Pooram Grounds
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-normal">
                      Live GPS
                    </span>
                  </h2>
                  <p className="text-xs text-stone-400 font-malayalam">
                    തെക്കേഗോപുരനട & തേക്കിൻകാട് മൈതാനം (Thekkinkadu Maidan, Thrissur, Kerala)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
                >
                  <Minimize2 size={16} />
                </button>
              </div>
            </div>

            {/* Map Body Area */}
            <div className="relative flex-1 bg-stone-900 overflow-hidden">
              {/* OSM Slippy Map Tiles Layer */}
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-[#242424]">
                <img
                  src="https://tile.openstreetmap.org/17/93294/59146.png"
                  alt="OpenStreetMap Thekkinkadu Maidan"
                  className="w-full h-full object-cover filter brightness-95 contrast-105"
                />
                {/* Fairground boundary overlay */}
                <div className="absolute inset-16 border-2 border-dashed border-amber-500/50 rounded-2xl pointer-events-none bg-amber-500/5 flex items-center justify-center">
                  <span className="text-amber-300/30 text-2xl font-black uppercase tracking-widest pointer-events-none">
                    Kerala Fair Festival Grounds
                  </span>
                </div>
              </div>

              {/* POI Pins on Expanded Map */}
              {FAIR_POIS.map((poi) => {
                const pos = getCanvasPercent(poi.worldPos[0], poi.worldPos[1]);
                const isActive = activePoi?.id === poi.id;
                return (
                  <div
                    key={poi.id}
                    style={{ left: `${pos.px}%`, top: `${pos.py}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                  >
                    <button
                      onClick={() => setActivePoi(poi)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-xl border text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-amber-500 text-stone-950 border-white scale-110 ring-4 ring-amber-500/40'
                          : 'bg-stone-900/90 text-stone-200 border-stone-700 hover:bg-stone-800'
                      }`}
                    >
                      <span className="text-sm">{poi.icon}</span>
                      <span className="hidden sm:inline">{poi.name}</span>
                    </button>
                  </div>
                );
              })}

              {/* Player Position Marker on Expanded Map */}
              <div
                style={{ left: `${playerCanvasPos.px}%`, top: `${playerCanvasPos.py}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
              >
                <div
                  style={{ transform: `rotate(${headingDeg}deg)` }}
                  className="relative w-10 h-10 flex items-center justify-center"
                >
                  <div className="absolute -top-2 w-0 h-0 border-x-6 border-x-transparent border-b-8 border-b-rose-500" />
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-rose-500 border-2 border-white shadow-xl animate-ping" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white shadow-xl" />
                <span className="absolute top-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold whitespace-nowrap shadow">
                  You Are Here
                </span>
              </div>

              {/* Active POI Information Card */}
              {activePoi && (
                <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md bg-stone-950/95 border border-amber-500/50 p-4 rounded-2xl shadow-2xl backdrop-blur-md flex items-start gap-3 z-30 animate-fadeIn">
                  <span className="text-3xl p-2 bg-stone-900 rounded-xl border border-stone-800">
                    {activePoi.icon}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-amber-300">{activePoi.name}</h4>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-stone-800 text-stone-300 capitalize">
                        {activePoi.category}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 font-malayalam mt-0.5">
                      {activePoi.malayalamName}
                    </p>
                    <p className="text-[11px] font-mono text-stone-400 mt-1">
                      World Coords: ({activePoi.worldPos[0]}m, {activePoi.worldPos[1]}m)
                    </p>
                  </div>
                  <button
                    onClick={() => setActivePoi(null)}
                    className="text-stone-400 hover:text-white text-xs px-2"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Footer with OSM Attribution & Real-World GPS */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 border-t border-stone-800 bg-stone-900/90 text-xs text-stone-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-stone-300">
                  GPS: {gps.lat.toFixed(6)}° N, {gps.lon.toFixed(6)}° E
                </span>
              </div>

              <div className="text-[11px] text-stone-500">
                Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="text-amber-400/80 underline hover:text-amber-300">OpenStreetMap</a> contributors
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
