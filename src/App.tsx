/// <reference types="react" />
/// <reference types="@tensorflow/tfjs" />

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Search, Shield, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as tf from '@tensorflow/tfjs';
// Import custom model
import { loadAndPredict } from './model/model.js';

declare global {
  interface Window {
    loadAndPredict: (text: string) => Promise<number>;
  }
}

// Fallback toxic words list for when model is loading
const TOXIC_WORDS = [
  'spam', 'scam', 'hate', 'idiot', 'stupid', 'dumb', 'fool', 
  'jerk', 'racist', 'kill', 'die', 'attack', 'threat', 'abuse',
  'offensive', 'violent', 'nasty', 'horrible', 'terrible'
];

interface SearchEntry {
  id: number;
  text: string;
  isToxic: boolean;
  timestamp: Date;
  toxicityScore?: number;
}

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [searchHistory, setSearchHistory] = useState<SearchEntry[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [model, setModel] = useState<boolean>(false);
  const [modelLoading, setModelLoading] = useState<boolean>(true);
  const [modelError, setModelError] = useState<string | null>(null);
  
  // Load TensorFlow model on component mount
  useEffect(() => {
    const loadModel = async () => {
      try {
        // Wait for TensorFlow to be ready
        await tf.ready();
        // Test the model with a sample text to ensure it's loaded
        await loadAndPredict("test");
        
        console.log('Custom model loaded successfully');
        setModel(true);
        setModelLoading(false);
      } catch (error) {
        console.error('Error loading model:', error);
        setModelError('Failed to load custom TensorFlow model. Using fallback detection.');
        setModelLoading(false);
      }
    };
    
    loadModel();
    
    // Cleanup function
    return () => {
      // Dispose of any tensors if needed
      if (tf.getBackend()) {
        tf.disposeVariables();
      }
    };
  }, []);
  
  // Fallback toxicity check using word list
  const checkToxicityFallback = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    return TOXIC_WORDS.some(word => lowerText.includes(word));
  };
  
  // Check toxicity using custom TensorFlow model
  const checkToxicityWithModel = async (text: string): Promise<{
    isToxic: boolean;
    toxicityScore: number;
  }> => {
    if (!model) {
      return {
        isToxic: checkToxicityFallback(text),
        toxicityScore: 0
      };
    }
    
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (inputText.trim()) {
      setIsAnalyzing(true);
      
      try {
        // Use the custom TensorFlow model for prediction
        const result = await checkToxicityWithModel(inputText);
        
        const newEntry: SearchEntry = {
          id: Date.now(),
          text: inputText,
          isToxic: result.isToxic,
          timestamp: new Date(),
          toxicityScore: result.toxicityScore
        };
        
        setSearchHistory((prev: SearchEntry[]) => [newEntry, ...prev]);
        setInputText('');
      } catch (error) {
        console.error('Error analyzing text:', error);
        // Fallback to simple check if model analysis fails
        const isToxic = checkToxicityFallback(inputText);
        
        const newEntry: SearchEntry = {
          id: Date.now(),
          text: inputText,
          isToxic,
          timestamp: new Date()
        };
        
        setSearchHistory((prev: SearchEntry[]) => [newEntry, ...prev]);
        setInputText('');
      } finally {
        setIsAnalyzing(false);
      }
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-gray-900 p-4 md:p-6 overflow-hidden">
      <div className="max-w-3xl mx-auto relative">
        {/* Background decorative elements */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-100 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-60"></div>
        
        <motion.header 
          className="mb-12 text-center relative z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center mb-3">
            <motion.div
              animate={{ rotate: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles size={28} className="text-indigo-500 mr-2" />
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-light tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Text Analyzer
            </h1>
          </div>
          <p className="text-gray-500 max-w-md mx-auto">
            AI-powered content screening with TensorFlow.js
          </p>
          <div className="w-20 h-0.5 bg-gradient-to-r from-indigo-300 to-purple-300 mx-auto mt-4"></div>
          
          {/* Model status indicator */}
          <motion.div 
            className="mt-3 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {modelLoading ? (
              <div className="flex items-center text-xs text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">
                <Loader2 size={12} className="mr-1 animate-spin" />
                <span>Loading AI model...</span>
              </div>
            ) : modelError ? (
              <div className="flex items-center text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                <AlertTriangle size={12} className="mr-1" />
                <span>Using fallback detection</span>
              </div>
            ) : (
              <div className="flex items-center text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">
                <Shield size={12} className="mr-1" />
                <span>TensorFlow model active</span>
              </div>
            )}
          </motion.div>
        </motion.header>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <form onSubmit={handleSubmit} className="mb-12 relative">
            <div className="flex gap-2 bg-white/80 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-gray-100">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter text to analyze..."
                disabled={isAnalyzing}
                className="flex-grow p-3 bg-transparent border-b-2 border-indigo-100 focus:border-indigo-500 focus:outline-none transition-colors placeholder-gray-400"
              />
              <motion.button 
                type="submit"
                disabled={isAnalyzing || !inputText.trim()}
                className={`p-3 rounded-lg ${isAnalyzing ? 'bg-gray-100 text-gray-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'} transition-colors flex items-center justify-center min-w-16`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isAnalyzing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  </motion.div>
                ) : (
                  <Search size={20} />
                )}
              </motion.button>
            </div>
            
            {/* Floating decorative elements */}
            <motion.div 
              className="absolute -right-8 -top-8 text-indigo-200 opacity-20"
              animate={{ 
                y: [0, 10, 0],
                rotate: [0, 5, 0]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Shield size={60} />
            </motion.div>
          </form>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative z-10"
        >
          {searchHistory.length > 0 && (
            <motion.div 
              className="mb-4 flex items-center justify-between"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-sm uppercase tracking-wider text-indigo-600 font-medium flex items-center">
                <Shield size={14} className="mr-1" /> Analysis History
              </h2>
              <motion.span 
                className="text-xs px-2 py-1 bg-indigo-100 text-indigo-600 rounded-full"
                whileHover={{ scale: 1.05 }}
              >
                {searchHistory.length} {searchHistory.length === 1 ? 'entry' : 'entries'}
              </motion.span>
            </motion.div>
          )}
          
          {searchHistory.length === 0 ? (
            <motion.div 
              className="text-center py-16 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="mx-auto mb-4 w-16 h-16 flex items-center justify-center rounded-full bg-indigo-50"
              >
                <AlertTriangle size={24} className="text-indigo-300" />
              </motion.div>
              <p className="text-gray-400 text-sm">No entries yet</p>
              <p className="text-gray-300 text-xs mt-1">Start by analyzing some text</p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {searchHistory.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className={`mb-4 p-4 rounded-xl backdrop-blur-sm border ${
                    entry.isToxic 
                      ? 'bg-red-50/80 border-red-100' 
                      : 'bg-white/80 border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-grow">
                      <p className="text-gray-900">
                        {entry.text}
                      </p>
                      
                      {/* Display toxicity score */}
                      {entry.toxicityScore !== undefined && (
                        <div className="mt-2">
                          <div className="flex items-center">
                            <div className="flex-grow h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  entry.toxicityScore > 75 ? 'bg-red-500' :
                                  entry.toxicityScore > 50 ? 'bg-orange-500' :
                                  entry.toxicityScore > 25 ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${entry.toxicityScore}%` }}
                              />
                            </div>
                            <span className="ml-2 text-sm text-gray-600">
                              {Math.round(entry.toxicityScore)}%
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center">
                          {entry.isToxic ? (
                            <ShieldAlert size={16} className="text-red-500 mr-1" />
                          ) : (
                            <Shield size={16} className="text-green-500 mr-1" />
                          )}
                          <span className={`text-sm ${entry.isToxic ? 'text-red-600' : 'text-green-600'}`}>
                            {entry.isToxic ? 'Potentially toxic' : 'Safe content'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </motion.div>
        
        {/* Footer */}
        <motion.footer 
          className="mt-12 text-center text-xs text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <p>Text Analyzer • AI-powered content screening with TensorFlow.js</p>
        </motion.footer>
      </div>
    </div>
  );
}

export default App;