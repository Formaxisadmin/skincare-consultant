'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import questions from '@/data/questions';

export default function QuestionnaireFlow({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Get visible questions based on conditional logic
  const getVisibleQuestions = () => {
    return questions.filter((q) => {
      if (!q.conditional) return true;
      
      const dependentValue = responses[q.conditional.dependsOn];
      return q.conditional.showIf(dependentValue);
    });
  };

  const visibleQuestions = getVisibleQuestions();
  const currentQuestion = visibleQuestions[currentStep];
  const totalSteps = visibleQuestions.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Handle answer selection
  const handleAnswer = (value) => {
    if (currentQuestion.type === 'single') {
      setResponses({ ...responses, [currentQuestion.id]: value });
    } else if (currentQuestion.type === 'multiple') {
      const currentValues = responses[currentQuestion.id] || [];
      
      // Handle "none" option
      if (value === 'none') {
        setResponses({ ...responses, [currentQuestion.id]: ['none'] });
        return;
      }

      let newValues;
      if (currentValues.includes(value)) {
        newValues = currentValues.filter((v) => v !== value && v !== 'none');
      } else {
        newValues = [...currentValues.filter((v) => v !== 'none'), value];
        
        // Check max selections
        if (currentQuestion.maxSelections && newValues.length > currentQuestion.maxSelections) {
          return;
        }
      }
      
      setResponses({ ...responses, [currentQuestion.id]: newValues });
    }
  };

  // Check if current question is answered
  const isAnswered = () => {
    const answer = responses[currentQuestion.id];
    if (!currentQuestion.required) return true;
    
    if (currentQuestion.type === 'single') {
      return !!answer;
    } else if (currentQuestion.type === 'multiple') {
      return answer && answer.length > 0;
    }
    return false;
  };

  // Navigate to next question
  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  // Navigate to previous question
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Submit consultation
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/submit-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses }),
      });

      const data = await response.json();

      if (data.success) {
        onComplete(data.consultationId, data.analysis);
      } else {
        setError(data.error || 'Failed to process consultation');
        setIsSubmitting(false);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Check if option is selected
  const isSelected = (value) => {
    const answer = responses[currentQuestion.id];
    if (currentQuestion.type === 'single') {
      return answer === value;
    } else if (currentQuestion.type === 'multiple') {
      return answer && answer.includes(value);
    }
    return false;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Question {currentStep + 1} of {totalSteps}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-pink-500 to-purple-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {currentQuestion.question}
          </h2>
          
          {currentQuestion.description && (
            <p className="text-gray-600 mb-6">
              {currentQuestion.description}
            </p>
          )}

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  isSelected(option.value)
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  {option.icon && (
                    <span className="text-2xl mr-3">{option.icon}</span>
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      {option.label}
                    </div>
                    {option.description && (
                      <div className="text-sm text-gray-600 mt-1">
                        {option.description}
                      </div>
                    )}
                  </div>
                  {isSelected(option.value) && (
                    <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {currentQuestion.type === 'multiple' && currentQuestion.maxSelections && (
            <p className="text-sm text-gray-500 mt-4">
              Select up to {currentQuestion.maxSelections} options
              {responses[currentQuestion.id] && 
                ` (${responses[currentQuestion.id].length}/${currentQuestion.maxSelections} selected)`
              }
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className="flex items-center px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        <button
          onClick={handleNext}
          disabled={!isAnswered() || isSubmitting}
          className="flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : currentStep === totalSteps - 1 ? (
            'Get My Report'
          ) : (
            <>
              Next
              <ChevronRight className="w-5 h-5 ml-2" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}