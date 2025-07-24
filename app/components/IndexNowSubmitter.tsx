'use client';

import { useState } from 'react';
import { 
  submitToIndexNow, 
  submitWordPressPostToIndexNow,
  submitWordPressCategoryToIndexNow,
  submitWordPressTagToIndexNow,
  getIndexNowConfig
} from '../lib/indexnow';

interface IndexNowResponse {
  success: boolean;
  message: string;
  statusCode?: number;
}

type SearchEngine = 'google' | 'bing' | 'yandex';

export default function IndexNowSubmitter() {
  const [urls, setUrls] = useState<string>('');
  const [wordPressType, setWordPressType] = useState<'post' | 'category' | 'tag'>('post');
  const [wordPressSlug, setWordPressSlug] = useState<string>('');
  const [searchEngines, setSearchEngines] = useState<SearchEngine[]>(['google', 'bing']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<IndexNowResponse | null>(null);
  const [config] = useState(getIndexNowConfig());

  const handleUrlSubmission = async () => {
    if (!urls.trim()) {
      setResult({ success: false, message: 'Please enter at least one URL' });
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const urlList = urls.split('\n').map(url => url.trim()).filter(url => url);
      const response = await submitToIndexNow(urlList, searchEngines);
      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWordPressSubmission = async () => {
    if (!wordPressSlug.trim()) {
      setResult({ success: false, message: 'Please enter a WordPress slug' });
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      let response: IndexNowResponse;

      switch (wordPressType) {
        case 'post':
          response = await submitWordPressPostToIndexNow(wordPressSlug, searchEngines);
          break;
        case 'category':
          response = await submitWordPressCategoryToIndexNow(wordPressSlug, searchEngines);
          break;
        case 'tag':
          response = await submitWordPressTagToIndexNow(wordPressSlug, searchEngines);
          break;
        default:
          response = { success: false, message: 'Invalid WordPress type' };
      }

      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchEngineToggle = (engine: SearchEngine) => {
    setSearchEngines(prev => 
      prev.includes(engine) 
        ? prev.filter(e => e !== engine)
        : [...prev, engine]
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">IndexNow URL Submission</h2>
      
      {/* Configuration Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Configuration Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Status: </span>
            <span className={config.isConfigured ? 'text-green-600' : 'text-red-600'}>
              {config.isConfigured ? 'Configured' : 'Not Configured'}
            </span>
          </div>
          <div>
            <span className="font-medium">Key: </span>
            <span className="font-mono">{config.key}</span>
          </div>
          <div>
            <span className="font-medium">Host: </span>
            <span>{config.host}</span>
          </div>
          <div>
            <span className="font-medium">Key Location: </span>
            <span className="font-mono text-blue-600">{config.keyLocation}</span>
          </div>
        </div>
      </div>

      {/* Search Engine Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Search Engines</h3>
        <div className="flex flex-wrap gap-3">
          {config.endpoints.map(engine => (
            <label key={engine} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={searchEngines.includes(engine as SearchEngine)}
                onChange={() => handleSearchEngineToggle(engine as SearchEngine)}
                className="rounded border-gray-300"
              />
              <span className="capitalize">{engine}</span>
            </label>
          ))}
        </div>
      </div>

      {/* URL Submission */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">Submit URLs</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              URLs (one per line)
            </label>
            <textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              placeholder="https://www.cowboykimono.com/blog/example-post&#10;https://www.cowboykimono.com/shop"
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleUrlSubmission}
            disabled={isSubmitting || !config.isConfigured}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit URLs'}
          </button>
        </div>
      </div>

      {/* WordPress Submission */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">Submit WordPress Content</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Content Type</label>
              <select
                value={wordPressType}
                onChange={(e) => setWordPressType(e.target.value as 'post' | 'category' | 'tag')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="post">Blog Post</option>
                <option value="category">Category</option>
                <option value="tag">Tag</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Slug</label>
              <input
                type="text"
                value={wordPressSlug}
                onChange={(e) => setWordPressSlug(e.target.value)}
                placeholder="example-post-slug"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={handleWordPressSubmission}
            disabled={isSubmitting || !config.isConfigured}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit WordPress Content'}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className={`p-4 rounded-lg ${
          result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-2 ${
            result.success ? 'text-green-800' : 'text-red-800'
          }`}>
            {result.success ? 'Success' : 'Error'}
          </h3>
          <p className={result.success ? 'text-green-700' : 'text-red-700'}>
            {result.message}
          </p>
          {result.statusCode && (
            <p className="text-sm text-gray-600 mt-2">
              Status Code: {result.statusCode}
            </p>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-blue-800">Instructions</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Set NEXT_PUBLIC_INDEXNOW_KEY in your environment variables</li>
          <li>• Create a {config.key}.txt file at your domain root with your IndexNow key</li>
          <li>• URLs must be from your configured domain</li>
          <li>• WordPress submissions automatically construct the correct URLs</li>
          <li>• Multiple search engines can be selected for broader coverage</li>
        </ul>
      </div>
    </div>
  );
} 