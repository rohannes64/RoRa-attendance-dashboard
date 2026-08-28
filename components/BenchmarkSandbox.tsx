'use client';

import React, { useState, useRef } from 'react';
import {
  Cpu,
  Upload,
  Play,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';
import type { StudentProfile, BenchmarkTestCase, DetectionResult } from '../types/attendance';
import { BENCHMARK_TEST_CASES } from '../data/benchmarkData';
import {
  detectFacesInMedia,
  matchStudentDescriptor,
  drawAdvancedHUD,
  calculateCosineSimilarity,
} from '../lib/faceApi';
import { evaluateLiveness, createLivenessState } from '../lib/liveness';

interface BenchmarkSandboxProps {
  enrolledStudents: StudentProfile[];
}

export const BenchmarkSandbox: React.FC<BenchmarkSandboxProps> = ({ enrolledStudents }) => {
  const [selectedTestCase, setSelectedTestCase] = useState<BenchmarkTestCase>(BENCHMARK_TEST_CASES[0]);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [resultTelemetry, setResultTelemetry] = useState<{
    latencyMs: number;
    facesDetected: number;
    bestMatch: StudentProfile | null;
    distance: number;
    confidence: number;
    livenessScore: number;
    topMatches: { student: StudentProfile; distance: number; confidence: number; cosineSim: number }[];
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const runTestInference = async (imgUrl: string) => {
    setIsRunning(true);
    const startTime = performance.now();

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imgUrl;

    img.onload = async () => {
      try {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }

        const rawDetections = await detectFacesInMedia(img, {
          useTiny: false,
          scoreThreshold: 0.4,
        });

        const detectionResults: DetectionResult[] = [];
        let primaryMatch: StudentProfile | null = null;
        let bestDistance = 1.0;
        let bestConfidence = 0;
        let topRankedMatches: { student: StudentProfile; distance: number; confidence: number; cosineSim: number }[] = [];

        for (const det of rawDetections) {
          const landmarks = det.landmarks.positions.map((p) => ({ x: p.x, y: p.y }));
          const livenessRes = evaluateLiveness(landmarks, createLivenessState());
          const matchRes = matchStudentDescriptor(det.descriptor, enrolledStudents, 0.55);

          if (!primaryMatch && matchRes.matchedStudent) {
            primaryMatch = matchRes.matchedStudent;
            bestDistance = matchRes.distance;
            bestConfidence = matchRes.confidence;

            topRankedMatches = matchRes.allMatches.map((m) => ({
              student: m.student,
              distance: m.distance,
              confidence: m.confidence,
              cosineSim: Number(calculateCosineSimilarity(det.descriptor, m.student.descriptor).toFixed(4)),
            }));
          }

          detectionResults.push({
            id: Math.random().toString(),
            box: {
              x: det.detection.box.x,
              y: det.detection.box.y,
              width: det.detection.box.width,
              height: det.detection.box.height,
            },
            landmarks,
            matchedStudent: matchRes.matchedStudent,
            distance: matchRes.distance,
            confidence: matchRes.confidence,
            livenessScore: livenessRes.livenessScore,
            isLive: livenessRes.isLive,
            blinkDetected: false,
          });
        }

        drawAdvancedHUD(canvas, detectionResults, true);

        const latency = Math.round(performance.now() - startTime);

        setResultTelemetry({
          latencyMs: latency,
          facesDetected: rawDetections.length,
          bestMatch: primaryMatch,
          distance: bestDistance,
          confidence: bestConfidence,
          livenessScore: 95,
          topMatches: topRankedMatches,
        });
      } catch (err) {
        console.error('Benchmark inference error:', err);
      } finally {
        setIsRunning(false);
      }
    };
  };

  const handleSelectCase = (testCase: BenchmarkTestCase) => {
    setSelectedTestCase(testCase);
    setCustomImageUrl(null);
    runTestInference(testCase.imageUrl);
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomImageUrl(url);
    runTestInference(url);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="product-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white font-sans">
              Benchmark Testing Sandbox
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Test precision against challenging Indian environmental conditions (lighting, angles, spectacles).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary text-xs"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload Image</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleCustomUpload}
            className="hidden"
          />

          <button
            onClick={() => runTestInference(customImageUrl || selectedTestCase.imageUrl)}
            disabled={isRunning}
            className="btn-primary text-xs"
          >
            <Play className="h-3.5 w-3.5" />
            <span>{isRunning ? 'Processing...' : 'Run Inference'}</span>
          </button>
        </div>
      </div>

      {/* Preset Scenarios Carousel */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {BENCHMARK_TEST_CASES.map((tc) => {
          const isSelected = !customImageUrl && selectedTestCase.id === tc.id;
          return (
            <button
              key={tc.id}
              onClick={() => handleSelectCase(tc)}
              className={`product-card p-2.5 text-left transition-colors relative ${
                isSelected
                  ? 'border-[#3b82f6] bg-[#12192b]'
                  : 'hover:border-[#283754]'
              }`}
            >
              <div className="aspect-video w-full rounded overflow-hidden mb-2 bg-[#060910] border border-[#1e2a42]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tc.imageUrl}
                  alt={tc.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <span className="tag-neutral text-[9px] mb-1">
                {tc.category.replace('_', ' ')}
              </span>

              <h5 className="text-xs font-semibold text-white truncate mt-1">{tc.name}</h5>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Exp: {tc.expectedConfidenceRange[0]}-{tc.expectedConfidenceRange[1]}%</p>
            </button>
          );
        })}
      </div>

      {/* Main Testing View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Rendered Canvas */}
        <div className="lg:col-span-7 product-card p-3 flex flex-col items-center justify-center min-h-[380px] bg-[#070a10] relative">
          <canvas
            ref={canvasRef}
            className="max-h-[400px] max-w-full rounded object-contain border border-[#1e2a42]"
          />

          {!resultTelemetry && !isRunning && (
            <div className="text-center p-4">
              <ImageIcon className="h-8 w-8 text-slate-600 mx-auto mb-1.5" />
              <p className="text-xs text-slate-400">Click &quot;Run Inference&quot; or select a scenario above.</p>
            </div>
          )}
        </div>

        {/* Telemetry Breakdown */}
        <div className="lg:col-span-5 space-y-3">
          <div className="product-card p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1b273d]">
              <span className="text-xs font-mono font-medium text-slate-400 uppercase">
                Detection Outcome
              </span>
              <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                {resultTelemetry ? `${resultTelemetry.latencyMs}ms latency` : 'Standby'}
              </span>
            </div>

            {resultTelemetry?.bestMatch ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resultTelemetry.bestMatch.avatarUrl}
                    alt={resultTelemetry.bestMatch.name}
                    className="h-10 w-10 rounded object-cover border border-[#1e2a42]"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-semibold text-white">
                        {resultTelemetry.bestMatch.name}
                      </h4>
                      <span className="tag-present text-[10px]">MATCH</span>
                    </div>
                    <p className="text-[11px] font-mono text-emerald-400">
                      {resultTelemetry.bestMatch.rollNo}
                    </p>
                    <p className="text-[10.5px] text-slate-400">{resultTelemetry.bestMatch.branch}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="rounded bg-[#090d14] border border-[#1a2338] p-2">
                    <span className="text-slate-500 block text-[10px]">Confidence</span>
                    <span className="text-sm font-semibold text-emerald-400 tabular-nums">
                      {resultTelemetry.confidence}%
                    </span>
                  </div>
                  <div className="rounded bg-[#090d14] border border-[#1a2338] p-2">
                    <span className="text-slate-500 block text-[10px]">Euclidean Dist</span>
                    <span className="text-sm font-semibold text-slate-200 tabular-nums">
                      {resultTelemetry.distance.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-slate-500 text-xs">
                {resultTelemetry
                  ? 'No enrolled student matched within threshold.'
                  : 'Run inference to inspect telemetry.'}
              </div>
            )}
          </div>

          {/* Top Nearest Vectors */}
          <div className="product-card p-4 space-y-2.5">
            <h5 className="text-xs font-mono font-medium text-slate-400 uppercase">
              Top Ranked Nearest Neighbors
            </h5>

            <div className="space-y-1.5">
              {resultTelemetry?.topMatches && resultTelemetry.topMatches.length > 0 ? (
                resultTelemetry.topMatches.map((match, idx) => (
                  <div
                    key={match.student.id}
                    className="flex items-center justify-between rounded bg-[#090d14] border border-[#182338] p-2 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-[10px] w-3">#{idx + 1}</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={match.student.avatarUrl}
                        alt={match.student.name}
                        className="h-6 w-6 rounded object-cover"
                      />
                      <div>
                        <span className="text-white font-sans text-xs font-medium block">{match.student.name}</span>
                        <span className="text-[10px] text-slate-500">{match.student.rollNo}</span>
                      </div>
                    </div>

                    <div className="text-right tabular-nums">
                      <span
                        className={`text-xs font-semibold block ${
                          idx === 0 ? 'text-emerald-400' : 'text-slate-400'
                        }`}
                      >
                        {match.confidence}%
                      </span>
                      <span className="text-[9.5px] text-slate-500 block">
                        cos={match.cosineSim}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-slate-600 text-xs font-mono">
                  Awaiting analysis...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
