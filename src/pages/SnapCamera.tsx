import { useState, useRef, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, FlipHorizontal, SwitchCamera, X, Download, Share2,
  Sparkles, Zap, Sun, Moon, Droplets, Flame, Wind, CloudSnow,
  Heart, Star, Diamond, Crown, Palette, Settings2, Timer,
  Grid3X3, Focus, Maximize, ChevronLeft, ChevronRight, Circle,
  Video, ImageIcon, Send, Smile, Eye, EyeOff, RotateCcw,
  Contrast, Layers, Aperture, Rainbow
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Slider } from '@/components/ui/slider';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface FilterPreset {
  id: string;
  name: string;
  icon: React.ReactNode;
  filter: string;
  overlay?: string;
  gradient?: string;
}

interface LensEffect {
  id: string;
  name: string;
  icon: React.ReactNode;
  className: string;
}

const FILTERS: FilterPreset[] = [
  { id: 'none', name: 'Normal', icon: <Circle className="w-5 h-5" />, filter: 'none' },
  { id: 'vivid', name: 'Vivid', icon: <Sparkles className="w-5 h-5" />, filter: 'saturate(1.6) contrast(1.1) brightness(1.05)' },
  { id: 'warm', name: 'Warm', icon: <Flame className="w-5 h-5" />, filter: 'sepia(0.3) saturate(1.4) brightness(1.05) hue-rotate(-10deg)' },
  { id: 'cool', name: 'Cool', icon: <Droplets className="w-5 h-5" />, filter: 'saturate(0.9) brightness(1.1) hue-rotate(15deg)' },
  { id: 'golden', name: 'Golden', icon: <Sun className="w-5 h-5" />, filter: 'sepia(0.4) saturate(1.5) brightness(1.1) contrast(1.05)' },
  { id: 'midnight', name: 'Midnight', icon: <Moon className="w-5 h-5" />, filter: 'brightness(0.85) contrast(1.3) saturate(0.8) hue-rotate(200deg)' },
  { id: 'dreamy', name: 'Dreamy', icon: <Wind className="w-5 h-5" />, filter: 'brightness(1.15) contrast(0.9) saturate(1.2) blur(0.3px)', gradient: 'linear-gradient(135deg, rgba(255,182,193,0.15), rgba(135,206,250,0.15))' },
  { id: 'noir', name: 'Noir', icon: <Contrast className="w-5 h-5" />, filter: 'grayscale(1) contrast(1.4) brightness(0.95)' },
  { id: 'retro', name: 'Retro', icon: <Aperture className="w-5 h-5" />, filter: 'sepia(0.5) contrast(1.1) brightness(0.95) saturate(1.3)' },
  { id: 'frost', name: 'Frost', icon: <CloudSnow className="w-5 h-5" />, filter: 'brightness(1.2) saturate(0.6) hue-rotate(180deg) contrast(0.95)' },
  { id: 'neon', name: 'Neon', icon: <Zap className="w-5 h-5" />, filter: 'saturate(2.5) contrast(1.3) brightness(1.1)' },
  { id: 'cinema', name: 'Cinema', icon: <Layers className="w-5 h-5" />, filter: 'contrast(1.2) saturate(0.85) brightness(0.9) sepia(0.15)' },
  { id: 'pop', name: 'Pop Art', icon: <Palette className="w-5 h-5" />, filter: 'saturate(3) contrast(1.5) brightness(1.1)' },
  { id: 'vintage', name: 'Vintage', icon: <Diamond className="w-5 h-5" />, filter: 'sepia(0.6) contrast(0.95) brightness(1.05) saturate(0.8)' },
  { id: 'aurora', name: 'Aurora', icon: <Rainbow className="w-5 h-5" />, filter: 'saturate(1.8) hue-rotate(30deg) brightness(1.1) contrast(1.1)', gradient: 'linear-gradient(135deg, rgba(0,255,128,0.1), rgba(128,0,255,0.1), rgba(0,128,255,0.1))' },
  { id: 'love', name: 'Love', icon: <Heart className="w-5 h-5" />, filter: 'saturate(1.3) brightness(1.1) contrast(1.05)', gradient: 'radial-gradient(circle, transparent 40%, rgba(255,0,80,0.12) 100%)' },
];

const LENS_EFFECTS: LensEffect[] = [
  { id: 'none', name: 'None', icon: <EyeOff className="w-4 h-4" />, className: '' },
  { id: 'vignette', name: 'Vignette', icon: <Eye className="w-4 h-4" />, className: 'shadow-[inset_0_0_120px_40px_rgba(0,0,0,0.5)]' },
  { id: 'light-leak', name: 'Light Leak', icon: <Star className="w-4 h-4" />, className: 'bg-gradient-to-br from-orange-400/20 via-transparent to-pink-400/15' },
  { id: 'prism', name: 'Prism', icon: <Diamond className="w-4 h-4" />, className: 'bg-gradient-to-tr from-cyan-400/10 via-purple-400/10 to-yellow-400/10' },
  { id: 'dust', name: 'Film Grain', icon: <Sparkles className="w-4 h-4" />, className: 'bg-[url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.08\'/%3E%3C/svg%3E")]' },
  { id: 'glow', name: 'Soft Glow', icon: <Crown className="w-4 h-4" />, className: 'bg-gradient-to-b from-white/5 via-transparent to-white/5 backdrop-blur-[0.5px]' },
];

export default function SnapCameraPage() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [mirrored, setMirrored] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('none');
  const [activeLens, setActiveLens] = useState<string>('none');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [recording, setRecording] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [brightness, setBrightness] = useState([100]);
  const [contrast, setContrast] = useState([100]);
  const [zoom, setZoom] = useState([1]);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<'filters' | 'lenses'>('filters');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const currentFilter = FILTERS.find(f => f.id === activeFilter) || FILTERS[0];
  const currentLens = LENS_EFFECTS.find(l => l.id === activeLens) || LENS_EFFECTS[0];

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch {
      console.error('Camera access denied');
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  const switchCamera = useCallback(() => {
    setFacingMode(f => f === 'user' ? 'environment' : 'user');
  }, []);

  useEffect(() => {
    if (cameraActive) startCamera();
  }, [facingMode]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const doCapture = () => {
      const video = videoRef.current!;
      const canvas = canvasRef.current!;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d')!;

      if (mirrored && facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      const combinedFilter = [
        currentFilter.filter !== 'none' ? currentFilter.filter : '',
        `brightness(${brightness[0]}%)`,
        `contrast(${contrast[0]}%)`,
      ].filter(Boolean).join(' ');

      ctx.filter = combinedFilter;
      ctx.drawImage(video, 0, 0);
      ctx.filter = 'none';

      // Draw overlay gradient
      if (currentFilter.gradient) {
        ctx.globalAlpha = 1;
      }

      setCapturedImage(canvas.toDataURL('image/png'));
    };

    if (timerSeconds > 0) {
      setCountdown(timerSeconds);
      let remaining = timerSeconds;
      const interval = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
          clearInterval(interval);
          setCountdown(null);
          doCapture();
        } else {
          setCountdown(remaining);
        }
      }, 1000);
    } else {
      doCapture();
    }
  }, [mirrored, facingMode, currentFilter, brightness, contrast, timerSeconds]);

  const downloadPhoto = useCallback(() => {
    if (!capturedImage) return;
    const a = document.createElement('a');
    a.href = capturedImage;
    a.download = `sigma-snap-${Date.now()}.png`;
    a.click();
  }, [capturedImage]);

  const combinedCSSFilter = [
    currentFilter.filter !== 'none' ? currentFilter.filter : '',
    brightness[0] !== 100 ? `brightness(${brightness[0]}%)` : '',
    contrast[0] !== 100 ? `contrast(${contrast[0]}%)` : '',
  ].filter(Boolean).join(' ') || 'none';

  return (
    <AppLayout>
      <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-background overflow-hidden">
        <canvas ref={canvasRef} className="hidden" />

        {/* Captured Image View */}
        <AnimatePresence>
          {capturedImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 z-50 bg-background flex flex-col"
            >
              <div className="h-14 flex items-center justify-between px-4 bg-card/80 backdrop-blur-xl">
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setCapturedImage(null)}>
                  <X className="w-5 h-5" />
                </Button>
                <span className="text-sm font-semibold text-foreground">Preview</span>
                <div className="w-9" />
              </div>
              <div className="flex-1 flex items-center justify-center p-4">
                <img src={capturedImage} alt="Captured" className="max-w-full max-h-full rounded-2xl shadow-2xl" />
              </div>
              <div className="p-4 flex justify-center gap-3">
                <Button variant="outline" size="lg" className="rounded-full gap-2" onClick={() => setCapturedImage(null)}>
                  <RotateCcw className="w-4 h-4" /> Retake
                </Button>
                <Button variant="outline" size="lg" className="rounded-full gap-2" onClick={downloadPhoto}>
                  <Download className="w-4 h-4" /> Save
                </Button>
                <Button size="lg" className="rounded-full gap-2 bg-primary shadow-lg shadow-primary/30">
                  <Send className="w-4 h-4" /> Share
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Camera View */}
        <div className="flex-1 flex flex-col lg:flex-row gap-0 relative">
          {/* Camera Viewport */}
          <div className="flex-1 relative flex items-center justify-center bg-black/95">
            {!cameraActive ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-6"
              >
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10 flex items-center justify-center backdrop-blur-sm">
                    <Camera className="w-14 h-14 text-primary" />
                  </div>
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary/30"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Sigma Camera</h2>
                  <p className="text-sm text-muted-foreground max-w-xs">Capture stunning moments with pro-grade filters, lenses, and effects</p>
                </div>
                <Button
                  onClick={startCamera}
                  size="lg"
                  className="rounded-full px-10 gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-shadow"
                >
                  <Camera className="w-5 h-5" /> Open Camera
                </Button>
              </motion.div>
            ) : (
              <>
                {/* Video Feed */}
                <div className="relative w-full h-full overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{
                      filter: combinedCSSFilter,
                      transform: `${mirrored && facingMode === 'user' ? 'scaleX(-1)' : ''} scale(${zoom[0]})`,
                      transition: 'filter 0.3s ease, transform 0.2s ease',
                    }}
                  />

                  {/* Filter Gradient Overlay */}
                  {currentFilter.gradient && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: currentFilter.gradient }}
                    />
                  )}

                  {/* Lens Effect Overlay */}
                  {currentLens.className && (
                    <div className={`absolute inset-0 pointer-events-none ${currentLens.className}`} />
                  )}

                  {/* Grid Overlay */}
                  {showGrid && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                        {Array.from({ length: 9 }).map((_, i) => (
                          <div key={i} className="border border-white/20" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Countdown */}
                  <AnimatePresence>
                    {countdown !== null && (
                      <motion.div
                        key={countdown}
                        initial={{ scale: 2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <span className="text-8xl font-black text-white drop-shadow-2xl">{countdown}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Recording Indicator */}
                  {recording && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-destructive/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                      <span className="text-xs font-semibold text-white">REC</span>
                    </div>
                  )}

                  {/* Top Controls */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <motion.div whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-md text-white hover:bg-black/50"
                        onClick={switchCamera}
                      >
                        <SwitchCamera className="w-5 h-5" />
                      </Button>
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-md text-white hover:bg-black/50"
                        onClick={() => setMirrored(!mirrored)}
                      >
                        <FlipHorizontal className="w-5 h-5" />
                      </Button>
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-10 w-10 rounded-full backdrop-blur-md text-white ${showGrid ? 'bg-primary/50' : 'bg-black/30 hover:bg-black/50'}`}
                        onClick={() => setShowGrid(!showGrid)}
                      >
                        <Grid3X3 className="w-5 h-5" />
                      </Button>
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-10 w-10 rounded-full backdrop-blur-md text-white ${showSettings ? 'bg-primary/50' : 'bg-black/30 hover:bg-black/50'}`}
                        onClick={() => setShowSettings(!showSettings)}
                      >
                        <Settings2 className="w-5 h-5" />
                      </Button>
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-10 w-10 rounded-full backdrop-blur-md text-white ${timerSeconds > 0 ? 'bg-primary/50' : 'bg-black/30 hover:bg-black/50'}`}
                        onClick={() => setTimerSeconds(t => t === 0 ? 3 : t === 3 ? 5 : t === 5 ? 10 : 0)}
                      >
                        <Timer className="w-5 h-5" />
                        {timerSeconds > 0 && (
                          <span className="absolute -bottom-0.5 -right-0.5 text-[9px] bg-primary text-primary-foreground w-4 h-4 rounded-full flex items-center justify-center font-bold">{timerSeconds}</span>
                        )}
                      </Button>
                    </motion.div>
                  </div>

                  {/* Settings Panel */}
                  <AnimatePresence>
                    {showSettings && (
                      <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 40 }}
                        className="absolute top-4 right-16 bg-black/60 backdrop-blur-2xl rounded-2xl p-4 space-y-4 w-56 border border-white/10"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-white/80"><Sun className="w-3.5 h-3.5 inline mr-1.5" />Brightness</span>
                            <span className="text-[10px] text-white/50">{brightness[0]}%</span>
                          </div>
                          <Slider value={brightness} onValueChange={setBrightness} min={50} max={150} step={1} className="w-full" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-white/80"><Contrast className="w-3.5 h-3.5 inline mr-1.5" />Contrast</span>
                            <span className="text-[10px] text-white/50">{contrast[0]}%</span>
                          </div>
                          <Slider value={contrast} onValueChange={setContrast} min={50} max={200} step={1} className="w-full" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-white/80"><Focus className="w-3.5 h-3.5 inline mr-1.5" />Zoom</span>
                            <span className="text-[10px] text-white/50">{zoom[0].toFixed(1)}x</span>
                          </div>
                          <Slider value={zoom} onValueChange={setZoom} min={1} max={3} step={0.1} className="w-full" />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full rounded-xl text-white/70 hover:text-white text-xs"
                          onClick={() => { setBrightness([100]); setContrast([100]); setZoom([1]); }}
                        >
                          <RotateCcw className="w-3 h-3 mr-1.5" /> Reset All
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Shutter & Mode */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
                    {/* Mode Switcher */}
                    <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md rounded-full p-1">
                      <button
                        onClick={() => setMode('photo')}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${mode === 'photo' ? 'bg-white text-black' : 'text-white/70 hover:text-white'}`}
                      >
                        <ImageIcon className="w-3.5 h-3.5 inline mr-1" /> Photo
                      </button>
                      <button
                        onClick={() => setMode('video')}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${mode === 'video' ? 'bg-destructive text-white' : 'text-white/70 hover:text-white'}`}
                      >
                        <Video className="w-3.5 h-3.5 inline mr-1" /> Video
                      </button>
                    </div>

                    {/* Shutter Button */}
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={mode === 'photo' ? capturePhoto : () => setRecording(!recording)}
                      className={`w-[72px] h-[72px] rounded-full flex items-center justify-center transition-all duration-200 ${
                        mode === 'video' && recording
                          ? 'bg-white/20 ring-4 ring-destructive'
                          : 'bg-white/20 ring-4 ring-white'
                      }`}
                    >
                      {mode === 'photo' ? (
                        <div className="w-14 h-14 rounded-full bg-white shadow-inner" />
                      ) : recording ? (
                        <div className="w-7 h-7 rounded-md bg-destructive" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-destructive" />
                      )}
                    </motion.button>
                  </div>

                  {/* Close Camera */}
                  <div className="absolute bottom-8 left-6">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-md text-white hover:bg-black/50"
                      onClick={stopCamera}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Filter / Lens Panel */}
          {cameraActive && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:w-80 bg-card/80 backdrop-blur-2xl border-t lg:border-t-0 lg:border-l border-border/20 flex flex-col"
            >
              {/* Category Tabs */}
              <div className="flex items-center gap-1 p-3 pb-0">
                <button
                  onClick={() => setFilterCategory('filters')}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                    filterCategory === 'filters'
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 inline mr-1" /> Filters
                </button>
                <button
                  onClick={() => setFilterCategory('lenses')}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                    filterCategory === 'lenses'
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                  }`}
                >
                  <Aperture className="w-3.5 h-3.5 inline mr-1" /> Lenses
                </button>
              </div>

              <ScrollArea className="flex-1 p-3">
                {filterCategory === 'filters' ? (
                  <div className="grid grid-cols-3 gap-2">
                    {FILTERS.map((filter, i) => (
                      <motion.button
                        key={filter.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.03 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveFilter(filter.id)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-200 ${
                          activeFilter === filter.id
                            ? 'bg-primary/15 ring-2 ring-primary/40 text-primary'
                            : 'bg-secondary/40 hover:bg-secondary/60 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {filter.icon}
                        <span className="text-[10px] font-medium">{filter.name}</span>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {LENS_EFFECTS.map((lens, i) => (
                      <motion.button
                        key={lens.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setActiveLens(lens.id)}
                        className={`flex items-center gap-2.5 p-3 rounded-2xl transition-all duration-200 ${
                          activeLens === lens.id
                            ? 'bg-primary/15 ring-2 ring-primary/40 text-primary'
                            : 'bg-secondary/40 hover:bg-secondary/60 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {lens.icon}
                        <span className="text-xs font-medium">{lens.name}</span>
                      </motion.button>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Active Filter Info */}
              <div className="p-3 border-t border-border/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      {currentFilter.icon}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{currentFilter.name}</p>
                      <p className="text-[10px] text-muted-foreground">{currentLens.name !== 'None' ? `+ ${currentLens.name}` : 'No lens'}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-xs h-7"
                    onClick={() => { setActiveFilter('none'); setActiveLens('none'); }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
