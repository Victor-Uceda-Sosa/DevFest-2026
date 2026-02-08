import React from 'react';
import { Card } from './ui/card';
import { X } from 'lucide-react';

interface MedicalImage {
  id: string;
  type: 'xray' | 'ct' | 'mri' | 'ultrasound' | 'lab' | 'physical-exam' | 'photo';
  url: string;
  title: string;
  description?: string;
  findings?: string;
}

interface MedicalImagesProps {
  images: MedicalImage[];
  title?: string;
  onImageClick?: (image: MedicalImage) => void;
}

export function MedicalImages({ images, title = 'Medical Imaging', onImageClick }: MedicalImagesProps) {
  const [selectedImage, setSelectedImage] = React.useState<MedicalImage | null>(null);

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <>
      {/* Images Grid */}
      <Card className="p-4 bg-slate-800/50 border border-cyan-500/30">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((image) => (
            <div
              key={image.id}
              className="cursor-pointer group"
              onClick={() => {
                setSelectedImage(image);
                onImageClick?.(image);
              }}
            >
              <div className="relative bg-black rounded-lg overflow-hidden border-2 border-slate-700/50 hover:border-cyan-500/50 transition-all h-32">
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23374151" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" fill="%239CA3AF" font-size="14"%3EImage Not Found%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 truncate">{image.title}</p>
              <p className="text-xs text-gray-500 truncate">{image.type.replace('-', ' ')}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Full Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <Card className="relative max-w-4xl w-full bg-slate-900 border border-cyan-500/30 p-6">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-white">{selectedImage.title}</h3>
                <p className="text-sm text-gray-400">
                  {selectedImage.type.replace('-', ' ').toUpperCase()}
                </p>
              </div>

              <div className="bg-black rounded-lg overflow-hidden border border-slate-700/50">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.title}
                  className="w-full h-auto max-h-96 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23374151" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" fill="%239CA3AF" font-size="18"%3EImage Not Found%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>

              {selectedImage.description && (
                <div>
                  <h4 className="text-sm font-semibold text-cyan-400 mb-1">Description</h4>
                  <p className="text-sm text-gray-300">{selectedImage.description}</p>
                </div>
              )}

              {selectedImage.findings && (
                <div>
                  <h4 className="text-sm font-semibold text-cyan-400 mb-1">Key Findings</h4>
                  <p className="text-sm text-gray-300">{selectedImage.findings}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
