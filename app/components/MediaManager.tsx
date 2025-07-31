'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  title: string;
  altText: string;
  caption: string;
  description: string;
  category: string;
  tags: string[];
  size: number;
  type: string;
  urls: {
    s3: string;
    cloudfront: string;
    relative: string;
  };
  metadata: {
    uploadedAt: string;
    s3Key: string;
    bucket: string;
  };
}

interface MediaManagerProps {
  onSelect?: (media: MediaFile) => void;
  multiple?: boolean;
  selectedMedia?: MediaFile[];
  onSelectionChange?: (media: MediaFile[]) => void;
}

const MediaManager = ({ 
  onSelect, 
  multiple = false, 
  selectedMedia = [], 
  onSelectionChange 
}: MediaManagerProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Upload configuration
  const [uploadConfig, setUploadConfig] = useState({
    allowedTypes: [],
    maxFileSize: 0,
    maxFileSizeMB: 0,
    mediaFolder: '',
    s3Bucket: ''
  });

  // Fetch upload configuration
  const fetchUploadConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/media/upload');
      if (response.ok) {
        const config = await response.json();
        setUploadConfig(config);
      }
    } catch (error) {
      console.error('Failed to fetch upload config:', error);
    }
  }, []);

  // Handle file upload
  const handleFileUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData(event.currentTarget);
      const file = formData.get('file') as File;

      if (!file) {
        throw new Error('No file selected');
      }

      // Validate file type
      if (!uploadConfig.allowedTypes.includes(file.type)) {
        throw new Error(`File type ${file.type} is not supported`);
      }

      // Validate file size
      if (file.size > uploadConfig.maxFileSize) {
        throw new Error(`File size exceeds maximum of ${uploadConfig.maxFileSizeMB}MB`);
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      if (result.success) {
        setMediaFiles(prev => [result.data, ...prev]);
        setUploadProgress(100);
        
        // Auto-select if single selection mode
        if (!multiple && onSelect) {
          onSelect(result.data);
        }
        
        // Reset form
        if (formRef.current) {
          formRef.current.reset();
        }
        setShowUploadForm(false);
        
        setTimeout(() => {
          setUploadProgress(0);
          setIsUploading(false);
        }, 1000);
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      setUploadProgress(0);
      setIsUploading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (media: MediaFile) => {
    if (multiple && onSelectionChange) {
      const isSelected = selectedMedia.some(m => m.id === media.id);
      if (isSelected) {
        onSelectionChange(selectedMedia.filter(m => m.id !== media.id));
      } else {
        onSelectionChange([...selectedMedia, media]);
      }
    } else if (!multiple && onSelect) {
      onSelect(media);
    }
  };

  // Check if file is selected
  const isFileSelected = (media: MediaFile) => {
    return selectedMedia.some(m => m.id === media.id);
  };

  // Filter media files
  const filteredMedia = mediaFiles.filter(media => {
    const matchesSearch = media.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         media.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         media.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = !selectedCategory || media.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = [...new Set(mediaFiles.map(m => m.category).filter(Boolean))];

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file type icon
  const getFileTypeIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return '🖼️';
    } else if (type.startsWith('video/')) {
      return '🎥';
    } else if (type === 'application/pdf') {
      return '📄';
    }
    return '📁';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Media Manager</h2>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {showUploadForm ? 'Cancel Upload' : 'Upload Media'}
        </button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Upload New Media</h3>
          
          <form ref={formRef} onSubmit={handleFileUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File
              </label>
              <input
                type="file"
                name="file"
                required
                accept={uploadConfig.allowedTypes.join(',')}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Max size: {uploadConfig.maxFileSizeMB}MB | 
                Supported: {uploadConfig.allowedTypes.join(', ')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alt Text
                </label>
                <input
                  type="text"
                  name="altText"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caption
                </label>
                <input
                  type="text"
                  name="caption"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  placeholder="tag1, tag2, tag3"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Upload Error */}
            {uploadError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{uploadError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isUploading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search media..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="w-full md:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredMedia.map((media) => (
          <div
            key={media.id}
            onClick={() => handleFileSelect(media)}
            className={`
              relative group cursor-pointer rounded-lg border-2 transition-all duration-200
              ${isFileSelected(media) 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            {/* Selection Indicator */}
            {isFileSelected(media) && (
              <div className="absolute top-2 right-2 z-10">
                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}

            {/* Media Preview */}
            <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
              {media.type.startsWith('image/') ? (
                <Image
                  src={media.urls.cloudfront}
                  alt={media.altText || media.title}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl">{getFileTypeIcon(media.type)}</span>
                </div>
              )}
            </div>

            {/* Media Info */}
            <div className="p-3">
              <h4 className="font-medium text-gray-900 truncate" title={media.title}>
                {media.title}
              </h4>
              <p className="text-sm text-gray-500 truncate" title={media.originalName}>
                {media.originalName}
              </p>
              <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                <span>{formatFileSize(media.size)}</span>
                <span>{new Date(media.metadata.uploadedAt).toLocaleDateString()}</span>
              </div>
              
              {/* Tags */}
              {media.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {media.tags.slice(0, 2).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {media.tags.length > 2 && (
                    <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                      +{media.tags.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredMedia.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No media found</h3>
          <p className="text-gray-500">
            {searchTerm || selectedCategory 
              ? 'Try adjusting your search or filters'
              : 'Upload your first media file to get started'
            }
          </p>
        </div>
      )}

      {/* Selection Summary */}
      {multiple && selectedMedia.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800">
            {selectedMedia.length} item{selectedMedia.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}
    </div>
  );
};

export default MediaManager; 