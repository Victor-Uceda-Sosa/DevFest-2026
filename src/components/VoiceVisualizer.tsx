import React from 'react';

interface VoiceVisualizerProps {
  isRecording: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  size?: number;
}

export function VoiceVisualizer({ 
  isRecording, 
  isProcessing, 
  isSpeaking,
  size = 200 
}: VoiceVisualizerProps) {
  
  const getAnimationClass = () => {
    if (isSpeaking) return 'animate-morph';
    if (isRecording) return 'animate-pulse-glow';
    if (isProcessing) return 'animate-spin';
    return 'animate-float';
  };

  const getGradient = () => {
    if (isRecording) {
      return 'from-red-500 via-red-400 to-pink-500';
    }
    if (isProcessing) {
      return 'from-yellow-500 via-orange-400 to-yellow-500';
    }
    if (isSpeaking) {
      return 'from-green-500 via-emerald-400 to-teal-500';
    }
    return 'from-blue-500 via-cyan-400 to-blue-600';
  };

  const getGlowColor = () => {
    if (isRecording) return 'rgba(239, 68, 68, 0.4)';
    if (isProcessing) return 'rgba(251, 146, 60, 0.4)';
    if (isSpeaking) return 'rgba(16, 185, 129, 0.4)';
    return 'rgba(59, 130, 246, 0.4)';
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow ring */}
      <div 
        className={`absolute rounded-full ${getAnimationClass()}`}
        style={{
          width: size * 1.3,
          height: size * 1.3,
          background: `radial-gradient(circle, ${getGlowColor()} 0%, transparent 70%)`,
          filter: 'blur(20px)',
        }}
      />
      
      {/* Main circle */}
      <div 
        className={`relative rounded-full bg-gradient-to-br ${getGradient()} ${getAnimationClass()} shadow-2xl`}
        style={{
          width: size,
          height: size,
          transition: 'all 0.3s ease-in-out',
        }}
      >
        {/* Inner highlight */}
        <div 
          className="absolute inset-4 rounded-full bg-gradient-to-br from-white/20 to-transparent"
          style={{
            filter: 'blur(10px)',
          }}
        />
        
        {/* Center dot indicator */}
        {!isRecording && !isProcessing && !isSpeaking && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-white/90 animate-pulse" />
          </div>
        )}
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white font-semibold text-sm">REC</div>
        </div>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
