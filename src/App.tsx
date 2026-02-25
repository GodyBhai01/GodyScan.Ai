/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Camera, Upload, RefreshCcw, Info, CheckCircle2, AlertCircle, Utensils, Box, Loader2, X, Star, Zap, Droplets, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeImage } from './services/geminiService';

interface AnalysisResult {
  type: 'food' | 'electronic' | 'personal_care' | 'object';
  name: string;
  description: string;
  howToUse: string;
  advantages: string[];
  disadvantages: string[];
  rating: number;
  calories?: string;
  protein?: string;
  carbs?: string;
  fat?: string;
}

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        handleAnalyze(reader.result as string, file.type);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
    disabled: isAnalyzing
  });

  const startCamera = async () => {
    setIsCameraOpen(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError("Could not access camera. Please ensure you've granted permissions.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setImage(dataUrl);
        stopCamera();
        handleAnalyze(dataUrl, 'image/jpeg');
      }
    }
  };

  const handleAnalyze = async (base64: string, mimeType: string) => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const data = await analyzeImage(base64, mimeType);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to analyze image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
    setIsCameraOpen(false);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={18}
            className={star <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-slate-200"}
          />
        ))}
        <span className="ml-2 text-sm font-bold text-slate-600">{rating}/5</span>
      </div>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'food': return <Utensils size={16} className="text-emerald-600" />;
      case 'electronic': return <Zap size={16} className="text-blue-600" />;
      case 'personal_care': return <Droplets size={16} className="text-purple-600" />;
      default: return <Box size={16} className="text-slate-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-900 font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Zap size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">GodyScan.Ai</h1>
          </div>
          <button 
            onClick={reset}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
            title="Reset"
          >
            <RefreshCcw size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Input */}
          <section className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 overflow-hidden relative min-h-[400px] flex flex-col">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Upload size={20} className="text-indigo-600" />
                Input Image
              </h2>

              {!image && !isCameraOpen && (
                <div className="flex-1 flex flex-col gap-4">
                  <div 
                    {...getRootProps()} 
                    className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 transition-all cursor-pointer
                      ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'}`}
                  >
                    <input {...getInputProps()} />
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                      <Upload size={32} />
                    </div>
                    <p className="text-slate-600 font-medium text-center">
                      {isDragActive ? "Drop the image here" : "Drag & drop an image, or click to browse"}
                    </p>
                    <p className="text-slate-400 text-sm mt-2">Supports JPG, PNG, WEBP</p>
                  </div>

                  <button 
                    onClick={startCamera}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-[0.98]"
                  >
                    <Camera size={20} />
                    Use Camera
                  </button>
                </div>
              )}

              {isCameraOpen && (
                <div className="flex-1 flex flex-col gap-4">
                  <div className="relative flex-1 bg-black rounded-2xl overflow-hidden shadow-inner">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover"
                    />
                    <button 
                      onClick={stopCamera}
                      className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <button 
                    onClick={capturePhoto}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-[0.98]"
                  >
                    <div className="w-4 h-4 rounded-full border-2 border-white" />
                    Capture Photo
                  </button>
                </div>
              )}

              {image && !isCameraOpen && (
                <div className="flex-1 relative group">
                  <img 
                    src={image} 
                    alt="Preview" 
                    className="w-full h-full object-cover rounded-2xl shadow-md"
                  />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl">
                      <Loader2 className="animate-spin text-indigo-600 mb-2" size={40} />
                      <p className="text-indigo-700 font-semibold">Analyzing with AI...</p>
                    </div>
                  )}
                  {!isAnalyzing && (
                    <button 
                      onClick={() => setImage(null)}
                      className="absolute top-4 right-4 p-2 bg-white/90 text-slate-600 rounded-full shadow-lg hover:bg-white transition-all"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 text-red-700"
              >
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
              </motion.div>
            )}
          </section>

          {/* Right Column: Results */}
          <section className="space-y-6">
            <AnimatePresence mode="wait">
              {!result && !isAnalyzing && (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-3xl p-12 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center h-full min-h-[400px]"
                >
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
                    <Info size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Ready to Scan</h3>
                  <p className="text-slate-500 max-w-xs">
                    Upload food, electronics, or personal care products for a full analysis.
                  </p>
                </motion.div>
              )}

              {isAnalyzing && (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-3xl p-12 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center h-full min-h-[400px]"
                >
                  <div className="relative mb-6">
                    <div className="w-20 h-20 border-4 border-indigo-100 rounded-full" />
                    <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Processing Image</h3>
                  <p className="text-slate-500">GodyScan is identifying the contents...</p>
                </motion.div>
              )}

              {result && (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {/* Main Info Card */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getTypeIcon(result.type)}
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            {result.type.replace('_', ' ')} detected
                          </span>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">{result.name}</h2>
                        {renderStars(result.rating)}
                      </div>
                    </div>
                    <p className="text-slate-600 leading-relaxed mb-6">
                      {result.description}
                    </p>

                    {/* How to Use Section */}
                    <div className="bg-indigo-50/30 border border-indigo-100/50 rounded-2xl p-5 mb-6">
                      <h3 className="text-indigo-900 font-bold mb-2 flex items-center gap-2">
                        <BookOpen size={18} />
                        How to Use
                      </h3>
                      <p className="text-indigo-900/80 text-sm leading-relaxed">
                        {result.howToUse}
                      </p>
                    </div>

                    {result.type === 'food' && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl text-center">
                          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Calories</p>
                          <p className="text-xl font-bold text-slate-900">{result.calories || 'N/A'}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl text-center">
                          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Protein</p>
                          <p className="text-xl font-bold text-slate-900">{result.protein || 'N/A'}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl text-center">
                          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Carbs</p>
                          <p className="text-xl font-bold text-slate-900">{result.carbs || 'N/A'}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl text-center">
                          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Fat</p>
                          <p className="text-xl font-bold text-slate-900">{result.fat || 'N/A'}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pros & Cons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-6">
                      <h3 className="text-emerald-800 font-bold mb-4 flex items-center gap-2">
                        <CheckCircle2 size={18} />
                        Advantages
                      </h3>
                      <ul className="space-y-3">
                        {result.advantages.map((adv, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-emerald-900/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                            {adv}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-6">
                      <h3 className="text-amber-800 font-bold mb-4 flex items-center gap-2">
                        <AlertCircle size={18} />
                        Disadvantages
                      </h3>
                      <ul className="space-y-3">
                        {result.disadvantages.map((dis, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-amber-900/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                            {dis}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-12 text-center text-slate-400 text-sm">
        <p>© {new Date().getFullYear()} GodyScan.Ai. Powered by Gemini Flash.</p>
        <p className="mt-1 italic">Honest AI-powered insights for your daily products.</p>
      </footer>
    </div>
  );
}
