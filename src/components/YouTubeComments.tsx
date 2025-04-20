import React, { useState, useEffect } from 'react';
import { ArrowLeft, Shield, ShieldAlert, Loader2, Youtube } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { YouTubeComment, fetchYouTubeComments } from '../services/youtube';
import { loadAndPredict } from '../model/model.js';

interface YouTubeCommentsProps {
  videoId: string;
  onBack: () => void;
}

interface AnalyzedComment extends YouTubeComment {
  isToxic: boolean;
  toxicityScore?: number;
  isAnalyzing?: boolean;
}

const YouTubeComments: React.FC<YouTubeCommentsProps> = ({ videoId, onBack }) => {
  const [comments, setComments] = useState<AnalyzedComment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showToxicOnly, setShowToxicOnly] = useState<boolean>(false);
  
  // Fallback toxicity check using word list
  const checkToxicityFallback = (text: string): boolean => {
    const TOXIC_WORDS = [
      'spam', 'scam', 'hate', 'idiot', 'stupid', 'dumb', 'fool', 
      'jerk', 'racist', 'kill', 'die', 'attack', 'threat', 'abuse',
      'offensive', 'violent', 'nasty', 'horrible', 'terrible'
    ];
    const lowerText = text.toLowerCase();
    return TOXIC_WORDS.some(word => lowerText.includes(word));
  };
  
  // Check toxicity using TensorFlow model
  const checkToxicityWithModel = async (text: string): Promise<{
    isToxic: boolean;
    toxicityScore: number;
  }> => {
    try {
      const toxicityScore = await loadAndPredict(text);
      
      // Consider text toxic if toxicity score is above 50%
      const isToxic = toxicityScore > 50;
      
      return {
        isToxic,
        toxicityScore
      };
    } catch (error) {
      console.error('Error during classification:', error);
      // Fallback to simple word check if model fails
      return {
        isToxic: checkToxicityFallback(text),
        toxicityScore: 0
      };
    }
  };
  
  useEffect(() => {
    const loadComments = async () => {
      try {
        setLoading(true);
        
        // Fetch comments
        const fetchedComments = await fetchYouTubeComments(videoId);
        
        // Initially set comments with isAnalyzing flag
        setComments(
          fetchedComments.map(comment => ({
            ...comment,
            isAnalyzing: true,
            isToxic: false
          }))
        );
        
        // Analyze each comment sequentially to avoid overwhelming the model
        const analyzedComments = [];
        
        for (const comment of fetchedComments) {
          const result = await checkToxicityWithModel(comment.text);
          analyzedComments.push({
            ...comment,
            isToxic: result.isToxic,
            toxicityScore: result.toxicityScore,
            isAnalyzing: false
          });
          
          // Update state after each comment is analyzed
          setComments([...analyzedComments, ...fetchedComments.slice(analyzedComments.length).map(c => ({
            ...c,
            isAnalyzing: true,
            isToxic: false
          }))]);
        }
        
      } catch (err) {
        console.error('Failed to load comments:', err);
        setError('Failed to load comments. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadComments();
  }, [videoId]);
  
  const filteredComments = showToxicOnly 
    ? comments.filter(comment => comment.isToxic) 
    : comments;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-gray-900 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center mb-6"
        >
          <button 
            onClick={onBack}
            className="mr-4 p-2 rounded-lg hover:bg-white/50 transition-colors"
          >
            <ArrowLeft size={20} className="text-indigo-600" />
          </button>
          <div>
            <h1 className="text-2xl font-light tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center">
              <Youtube size={24} className="mr-2 text-red-500" />
              YouTube Comment Analysis
            </h1>
            <p className="text-sm text-gray-500">Video ID: {videoId}</p>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex justify-between items-center"
        >
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">
              {comments.filter(c => c.isToxic).length} toxic comments found
            </span>
          </div>
          
          <label className="flex items-center cursor-pointer">
            <span className="text-sm text-gray-600 mr-2">Show toxic only</span>
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={showToxicOnly}
                onChange={() => setShowToxicOnly(!showToxicOnly)}
              />
              <div className={`w-10 h-5 ${showToxicOnly ? 'bg-indigo-600' : 'bg-gray-200'} rounded-full shadow-inner transition-colors`}></div>
              <div className={`absolute left-0 top-0 w-5 h-5 bg-white rounded-full shadow transform transition-transform ${showToxicOnly ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
          </label>
        </motion.div>
        
        {loading && comments.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 size={40} className="animate-spin text-indigo-500" />
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-lg text-red-600 text-center">
            {error}
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl text-center">
            <p className="text-gray-500">No {showToxicOnly ? 'toxic ' : ''}comments found</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredComments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className={`mb-4 p-4 rounded-xl backdrop-blur-sm border ${
                  comment.isToxic 
                    ? 'bg-red-50/80 border-red-100' 
                    : 'bg-white/80 border-gray-100'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-gray-800">{comment.author}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(comment.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <p className="text-gray-900 mb-2">{comment.text}</p>
                    
                    {comment.isAnalyzing ? (
                      <div className="flex items-center text-xs text-indigo-500">
                        <Loader2 size={12} className="mr-1 animate-spin" />
                        <span>Analyzing...</span>
                      </div>
                    ) : (
                      <>
                        {/* Display toxicity score */}
                        {comment.toxicityScore !== undefined && (
                          <div className="mt-2">
                            <div className="flex items-center">
                              <div className="flex-grow h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${
                                    comment.toxicityScore > 75 ? 'bg-red-500' :
                                    comment.toxicityScore > 50 ? 'bg-orange-500' :
                                    comment.toxicityScore > 25 ? 'bg-yellow-500' :
                                    'bg-green-500'
                                  }`}
                                  style={{ width: `${comment.toxicityScore}%` }}
                                />
                              </div>
                              <span className="ml-2 text-sm text-gray-600">
                                {Math.round(comment.toxicityScore)}%
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center">
                            {comment.isToxic ? (
                              <ShieldAlert size={16} className="text-red-500 mr-1" />
                            ) : (
                              <Shield size={16} className="text-green-500 mr-1" />
                            )}
                            <span className={`text-sm ${comment.isToxic ? 'text-red-600' : 'text-green-600'}`}>
                              {comment.isToxic ? 'Potentially toxic' : 'Safe content'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {comment.likeCount} likes
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default YouTubeComments; 