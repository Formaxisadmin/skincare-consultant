'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Loader2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import questions from '@/data/questions';

export default function QuestionnaireFlow({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [shakeAnimation, setShakeAnimation] = useState(false);
  const autoAdvanceTimeoutRef = useRef(null);
  const shakeTimeoutRef = useRef(null);
  const multipleChoiceAutoAdvanceRef = useRef(null);

  // Conditional modal state
  const [showConditionalDialog, setShowConditionalDialog] = useState(false);
  const [conditionalQueue, setConditionalQueue] = useState([]); // array of conditional question ids
  const [activeConditional, setActiveConditional] = useState(null); // conditional question object
  
  // Disclaimer dialog state
  const [showDisclaimerDialog, setShowDisclaimerDialog] = useState(false);
  
  // Exit confirmation dialog state
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Clear saved progress (only when explicitly starting a new consultation)
  const clearSavedProgress = () => {
    localStorage.removeItem('questionnaire-progress');
    localStorage.removeItem('questionnaire-consultation-id');
  };

  // Get visible questions for main flow (exclude conditional; they will open in modal)
  const getVisibleQuestions = (responsesToCheck) => {
    return questions.filter((q) => !q.conditional);
  };

  // Load saved progress from localStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem('questionnaire-progress');
    const savedConsultationId = localStorage.getItem('questionnaire-consultation-id');
    
    if (savedProgress) {
      try {
        const { step, responses: savedResponses } = JSON.parse(savedProgress);
        
        // Restore responses first
        if (savedResponses && Object.keys(savedResponses).length > 0) {
          // Calculate visible questions based on saved responses
          const visibleQuestionsWithSavedResponses = getVisibleQuestions(savedResponses);
          
          let targetStep;
          // If there's a saved consultation ID, it means the user completed the questionnaire
          // and is coming back from the report. In this case, always restore to the LAST question
          // so they can review their answers or go back one question at a time using the Back button
          if (savedConsultationId && visibleQuestionsWithSavedResponses.length > 0) {
            // Always restore to the last question when coming back from a completed consultation
            targetStep = visibleQuestionsWithSavedResponses.length - 1;
          } else if (step !== undefined && step >= 0) {
            // For in-progress consultations, restore to the saved step
            // Clamp step to valid range (0 to totalQuestions - 1)
            targetStep = Math.min(step, Math.max(0, visibleQuestionsWithSavedResponses.length - 1));
          } else {
            targetStep = 0;
          }
          
          // Only restore responses for questions up to and including the target step
          // This ensures that when user presses back, they don't see answers for questions after the current step
          const questionsToKeep = visibleQuestionsWithSavedResponses.slice(0, targetStep + 1);
          const questionIdsToKeep = new Set(questionsToKeep.map(q => q.id));
          
          const filteredResponses = {};
          Object.keys(savedResponses).forEach((questionId) => {
            if (questionIdsToKeep.has(questionId)) {
              filteredResponses[questionId] = savedResponses[questionId];
            }
          });
          
          setResponses(filteredResponses);
          setCurrentStep(targetStep);
        } else if (step !== undefined && step >= 0) {
          // If no responses but step is defined, restore step (shouldn't happen, but safety check)
          setCurrentStep(Math.max(0, step));
        }
      } catch (error) {
        console.error('Error loading saved progress:', error);
        localStorage.removeItem('questionnaire-progress');
        localStorage.removeItem('questionnaire-consultation-id');
      }
    }
  }, []);

  // Prevent browser popup on tab close/navigation (but don't show dialog proactively)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Check if quiz is in progress (has responses but no saved consultation ID)
      const savedConsultationId = localStorage.getItem('questionnaire-consultation-id');
      const hasResponses = responses && Object.keys(responses).length > 0;
      const isQuizInProgress = hasResponses && !savedConsultationId;
      
      if (isQuizInProgress) {
        // Prevent browser's default popup - we show custom dialog instead
        // Note: We can't show custom dialog in beforeunload, but this prevents browser popup
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [responses]);
  
  // Detect if user is starting a new consultation (modifying answers from the beginning)
  // If user goes back to step 0 and changes the first question, clear old consultation ID
  useEffect(() => {
    const savedConsultationId = localStorage.getItem('questionnaire-consultation-id');
    // If user is on the first question and starts changing answers,
    // and there was a saved consultation ID, they're likely starting fresh
    if (currentStep === 0 && savedConsultationId && Object.keys(responses).length > 0) {
      // Check if the first question response has changed from what was saved
      const savedProgress = localStorage.getItem('questionnaire-progress');
      if (savedProgress) {
        try {
          const { responses: savedResponses } = JSON.parse(savedProgress);
          const firstQuestionId = Object.keys(responses)[0];
          // If first question answer is different, user is starting new consultation
          if (firstQuestionId && savedResponses[firstQuestionId] && 
              responses[firstQuestionId] !== savedResponses[firstQuestionId]) {
            // Clear the old consultation ID - this is a new consultation
            localStorage.removeItem('questionnaire-consultation-id');
          }
        } catch (error) {
          // Ignore parsing errors
        }
      }
    }
  }, [currentStep, responses]);

  // Save progress to localStorage whenever step or responses change
  useEffect(() => {
    if (currentStep > 0 || Object.keys(responses).length > 0) {
      localStorage.setItem('questionnaire-progress', JSON.stringify({
        step: currentStep,
        responses: responses,
      }));
    }
  }, [currentStep, responses]);

  // Cleanup auto-advance timeout on unmount or step change
  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
        autoAdvanceTimeoutRef.current = null;
      }
      if (multipleChoiceAutoAdvanceRef.current) {
        clearTimeout(multipleChoiceAutoAdvanceRef.current);
        multipleChoiceAutoAdvanceRef.current = null;
      }
    };
  }, [currentStep]);

  // Get visible questions based on current responses
  const visibleQuestions = getVisibleQuestions(responses);
  // Safety check: ensure currentStep is within valid range
  const validStep = Math.min(Math.max(0, currentStep), Math.max(0, visibleQuestions.length - 1));
  const currentQuestion = visibleQuestions[validStep];
  const totalSteps = visibleQuestions.length;
  const progress = totalSteps > 0 ? ((validStep + 1) / totalSteps) * 100 : 0;
  
  // If step was adjusted, update it (but don't create infinite loop)
  useEffect(() => {
    if (currentStep !== validStep && visibleQuestions.length > 0) {
      setCurrentStep(validStep);
    }
  }, [visibleQuestions.length]); // Only check when visible questions count changes

  // Calculate reading time based on question text and options
  const calculateReadingTime = (question) => {
    if (!question) return 8000; // Default 8 seconds
    
    // Average reading speed: ~200 words per minute = ~3.3 words per second
    const wordsPerSecond = 3.3;
    
    // Count words in question
    const questionWords = (question.question || '').split(/\s+/).length;
    const descriptionWords = (question.description || '').split(/\s+/).length;
    
    // Count words in all options
    const optionWords = (question.options || []).reduce((total, opt) => {
      const labelWords = (opt.label || '').split(/\s+/).length;
      const descWords = (opt.description || '').split(/\s+/).length;
      return total + labelWords + descWords;
    }, 0);
    
    const totalWords = questionWords + descriptionWords + optionWords;
    const readingTimeSeconds = (totalWords / wordsPerSecond) * 1000; // Convert to milliseconds
    
    // Add extra time for decision making (reduced for faster trigger)
    const decisionTime = 1500;
    
    // Minimum 2 seconds, maximum 15 seconds (faster trigger)
    return Math.min(Math.max(readingTimeSeconds + decisionTime, 2000), 15000);
  };

  // Helper function to check if current question is answered
  const isQuestionAnswered = () => {
    if (!currentQuestion) return true;
    
    return currentQuestion.type === 'single' 
      ? !!responses[currentQuestion.id]
      : currentQuestion.type === 'multiple'
      ? responses[currentQuestion.id] && responses[currentQuestion.id].length > 0
      : true;
  };

  // Recursive function to schedule shake animation at intervals
  const scheduleShakeAnimation = (question, readingTime) => {
    // Clear any existing shake timer
    if (shakeTimeoutRef.current) {
      clearTimeout(shakeTimeoutRef.current);
      shakeTimeoutRef.current = null;
    }
    
    // Check if question is still current and not answered
    if (!currentQuestion || currentQuestion.id !== question.id || isQuestionAnswered()) {
      return; // Stop if question changed or is answered
    }
    
    // Schedule the shake animation
    shakeTimeoutRef.current = setTimeout(() => {
      // Double-check if still on same question and still not answered
      if (currentQuestion && currentQuestion.id === question.id && !isQuestionAnswered()) {
        // Trigger shake animation
        setShakeAnimation(true);
        setTimeout(() => setShakeAnimation(false), 500);
        
        // After shake completes, schedule the next one (recursive)
        setTimeout(() => {
          scheduleShakeAnimation(question, readingTime);
        }, 500); // Wait for shake animation to complete before scheduling next
      }
    }, readingTime);
  };

  // Stop shake cycle if question becomes answered
  useEffect(() => {
    if (currentQuestion && isQuestionAnswered()) {
      // Clear shake timer if question is now answered
      if (shakeTimeoutRef.current) {
        clearTimeout(shakeTimeoutRef.current);
        shakeTimeoutRef.current = null;
      }
      setShakeAnimation(false);
    }
  }, [responses[currentQuestion?.id]]); // Watch for changes to current question's response

  // Start shake timer when question changes (if not answered)
  useEffect(() => {
    // Clear any existing shake timer
    if (shakeTimeoutRef.current) {
      clearTimeout(shakeTimeoutRef.current);
      shakeTimeoutRef.current = null;
    }
    
    // Reset shake animation
    setShakeAnimation(false);
    
    // Only start timer if question exists and is not answered
    if (currentQuestion && !isQuestionAnswered()) {
      const readingTime = calculateReadingTime(currentQuestion);
      // Start the recursive shake animation cycle
      scheduleShakeAnimation(currentQuestion, readingTime);
    }
    
    // Cleanup on unmount or question change
    return () => {
      if (shakeTimeoutRef.current) {
        clearTimeout(shakeTimeoutRef.current);
        shakeTimeoutRef.current = null;
      }
    };
  }, [validStep, currentQuestion?.id]); // Re-run when question changes

  // Helpers for conditionals
  const getTriggeredConditionals = (dependencyId, dependencyValue, currentResponses) => {
    const conditionals = questions.filter((q) => q.conditional && q.conditional.dependsOn === dependencyId);
    const triggered = conditionals.filter((q) => q.conditional.showIf(dependencyValue));
    return triggered.filter((q) => currentResponses[q.id] === undefined || currentResponses[q.id] === null || (Array.isArray(currentResponses[q.id]) && currentResponses[q.id].length === 0));
  };

  const clearInvalidConditionalAnswers = (updatedResponses) => {
    const result = { ...updatedResponses };
    questions.forEach((q) => {
      if (q.conditional) {
        const depId = q.conditional.dependsOn;
        const depVal = result[depId];
        const shouldShow = q.conditional.showIf(depVal);
        if (!shouldShow && result[q.id] !== undefined) {
          delete result[q.id];
        }
      }
    });
    return result;
  };

  // Handle answer selection
  const handleAnswer = (value) => {
    if (!currentQuestion) return;
    
    // Clear shake timer since user has selected an option
    if (shakeTimeoutRef.current) {
      clearTimeout(shakeTimeoutRef.current);
      shakeTimeoutRef.current = null;
    }
    setShakeAnimation(false);
    
    // Clear any existing auto-advance timeout
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
    
    // Clear multiple-choice auto-advance timer (will restart after conditionals if needed)
    if (multipleChoiceAutoAdvanceRef.current) {
      clearTimeout(multipleChoiceAutoAdvanceRef.current);
      multipleChoiceAutoAdvanceRef.current = null;
    }
    
    if (currentQuestion.type === 'single') {
      const updated = clearInvalidConditionalAnswers({ ...responses, [currentQuestion.id]: value });
      setResponses(updated);

      const triggered = getTriggeredConditionals(currentQuestion.id, value, updated);
      if (triggered.length > 0) {
        // If conditionals are triggered, show them first (don't auto-advance yet)
        setConditionalQueue(triggered.map((q) => q.id));
        setActiveConditional(triggered[0]);
        setShowConditionalDialog(true);
      } else {
        // Auto-advance for single-choice questions after 800ms delay
        // This gives visual confirmation that the selection was registered
        autoAdvanceTimeoutRef.current = setTimeout(() => {
          handleNext();
          autoAdvanceTimeoutRef.current = null;
        }, 800);
      }
    } else if (currentQuestion.type === 'multiple') {
      const currentValues = responses[currentQuestion.id] || [];
      
      // Handle "none" option
      if (value === 'none') {
        const updated = clearInvalidConditionalAnswers({ ...responses, [currentQuestion.id]: ['none'] });
        setResponses(updated);
        const triggered = getTriggeredConditionals(currentQuestion.id, updated[currentQuestion.id], updated);
        if (triggered.length > 0) {
          setConditionalQueue(triggered.map((q) => q.id));
          setActiveConditional(triggered[0]);
          setShowConditionalDialog(true);
        } else {
          // No conditionals triggered - start auto-advance timer for multiple-choice
          if (isAnswered()) {
            multipleChoiceAutoAdvanceRef.current = setTimeout(() => {
              if (currentQuestion && isAnswered()) {
                handleNext();
              }
              multipleChoiceAutoAdvanceRef.current = null;
            }, 8000); // 8 second pause - gives user more time to read and select options
          }
        }
        return;
      }

      let newValues;
      if (currentValues.includes(value)) {
        // Deselecting: remove only the clicked value
        newValues = currentValues.filter((v) => v !== value);
      } else {
        newValues = [...currentValues.filter((v) => v !== 'none'), value];
        
        // Check max selections
        if (currentQuestion.maxSelections && newValues.length > currentQuestion.maxSelections) {
          return;
        }
        
        // Handle scentPreference contradictions: unscented + scented options
        if (currentQuestion.id === 'scentPreference') {
          const scentedOptions = ['citrus', 'floral', 'woody-spicy', 'fresh'];
          const isUnscented = value === 'unscented';
          const isScented = scentedOptions.includes(value);
          
          if (isUnscented) {
            // If selecting "unscented", remove all scented options (contradiction)
            newValues = newValues.filter(v => !scentedOptions.includes(v));
          } else if (isScented) {
            // If selecting a scented option, remove "unscented" (contradiction)
            newValues = newValues.filter(v => v !== 'unscented');
          }
          // "no-preference" can coexist with other options (means "open to these and others")
        }
        
        // Handle allergies contradictions: "none" vs specific allergies
        if (currentQuestion.id === 'allergies') {
          const allergyOptions = ['fragrance', 'alcohol', 'retinol', 'vitamin-c', 'salicylic-acid', 
                                  'glycolic-acid', 'benzoyl-peroxide', 'parabens', 'sulfates', 
                                  'nuts', 'soy', 'wheat', 'dairy', 'niacinamide', 'lactic-acid', 'hydroquinone'];
          const isNone = value === 'none';
          const isAllergy = allergyOptions.includes(value);
          
          if (isNone) {
            // If selecting "none", remove all specific allergies (contradiction)
            newValues = newValues.filter(v => !allergyOptions.includes(v));
          } else if (isAllergy) {
            // If selecting a specific allergy, remove "none" (contradiction)
            newValues = newValues.filter(v => v !== 'none');
          }
        }
        
        // Handle preferences contradictions: "none" vs specific preferences
        if (currentQuestion.id === 'preferences') {
          const preferenceOptions = ['fragrance-free', 'vegan', 'cruelty-free', 'paraben-free', 
                                     'sulfate-free', 'alcohol-free', 'oil-free', 'non-comedogenic', 
                                     'natural', 'hypoallergenic'];
          const isNone = value === 'none';
          const isPreference = preferenceOptions.includes(value);
          
          if (isNone) {
            // If selecting "none", remove all specific preferences (contradiction)
            newValues = newValues.filter(v => !preferenceOptions.includes(v));
          } else if (isPreference) {
            // If selecting a specific preference, remove "none" (contradiction)
            newValues = newValues.filter(v => v !== 'none');
          }
        }
        
        // Handle lifestyleFactors contradictions: "none" vs other factors
        if (currentQuestion.id === 'lifestyleFactors') {
          const lifestyleOptions = ['stress', 'makeup', 'sleep', 'facial-hair-removal', 
                                    'exercise', 'travel', 'smoker'];
          const isNone = value === 'none';
          const isLifestyle = lifestyleOptions.includes(value);
          
          if (isNone) {
            // If selecting "none", remove all other lifestyle factors (contradiction)
            newValues = newValues.filter(v => !lifestyleOptions.includes(v));
          } else if (isLifestyle) {
            // If selecting a lifestyle factor, remove "none" (contradiction)
            newValues = newValues.filter(v => v !== 'none');
          }
        }
        
        // Handle stressEffects contradictions: "none" vs specific effects
        if (currentQuestion.id === 'stressEffects') {
          const effectOptions = ['breakouts', 'inflammation', 'dryness'];
          const isNone = value === 'none';
          const isEffect = effectOptions.includes(value);
          
          if (isNone) {
            // If selecting "none", remove all specific effects (contradiction)
            newValues = newValues.filter(v => !effectOptions.includes(v));
          } else if (isEffect) {
            // If selecting a specific effect, remove "none" (contradiction)
            newValues = newValues.filter(v => v !== 'none');
          }
        }
      }
      
      const updated = clearInvalidConditionalAnswers({ ...responses, [currentQuestion.id]: newValues });
      setResponses(updated);

      const triggered = getTriggeredConditionals(currentQuestion.id, newValues, updated);
      if (triggered.length > 0) {
        setConditionalQueue(triggered.map((q) => q.id));
        setActiveConditional(triggered[0]);
        setShowConditionalDialog(true);
      } else {
        // No conditionals triggered - start auto-advance timer for multiple-choice
        // Give user time to select more options (4.2 seconds)
        if (isAnswered()) {
          multipleChoiceAutoAdvanceRef.current = setTimeout(() => {
            // Only auto-advance if still on same question and still answered
            if (currentQuestion && isAnswered()) {
              handleNext();
            }
            multipleChoiceAutoAdvanceRef.current = null;
          }, 8000); // 8 second pause - gives user more time to plan next action
        }
      }
    }
  };

  const handleConditionalAnswer = (questionId, value) => {
    // Save this conditional's answer
    const updated = { ...responses, [questionId]: value };
    setResponses(updated);

    // Check if this answer triggers further conditional questions (chained conditionals)
    const newlyTriggered = getTriggeredConditionals(questionId, value, updated);

    // Build next queue: any new ones first, then remaining queued items
    const remainingIds = conditionalQueue.slice(1);
    const nextIds = [...newlyTriggered.map((q) => q.id), ...remainingIds];

    if (nextIds.length > 0) {
      setConditionalQueue(nextIds);
      const nextQ = questions.find((q) => q.id === nextIds[0]);
      setActiveConditional(nextQ || null);
      if (!nextQ) {
        setShowConditionalDialog(false);
        setConditionalQueue([]);
        setActiveConditional(null);
      }
    } else {
      // No more conditionals to show
      setShowConditionalDialog(false);
      setConditionalQueue([]);
      setActiveConditional(null);
      
      // Auto-advance after conditionals are complete
      if (currentQuestion && isAnswered()) {
        if (currentQuestion.type === 'single') {
          // Single-choice: quick auto-advance (800ms)
          autoAdvanceTimeoutRef.current = setTimeout(() => {
            handleNext();
            autoAdvanceTimeoutRef.current = null;
          }, 800);
        } else if (currentQuestion.type === 'multiple') {
          // Multiple-choice: longer pause (4.2 seconds) to allow user to select more options
          // Clear any existing multiple-choice auto-advance timer
          if (multipleChoiceAutoAdvanceRef.current) {
            clearTimeout(multipleChoiceAutoAdvanceRef.current);
            multipleChoiceAutoAdvanceRef.current = null;
          }
          
          // Start timer for auto-advance after pause
          multipleChoiceAutoAdvanceRef.current = setTimeout(() => {
            // Only auto-advance if still on same question and still answered
            if (currentQuestion && isAnswered()) {
              handleNext();
            }
            multipleChoiceAutoAdvanceRef.current = null;
          }, 8000); // 8 second pause - gives user more time to plan next action
        }
      }
    }
  };

  // Check if current question is answered
  const isAnswered = () => {
    if (!currentQuestion) return false;
    
    const answer = responses[currentQuestion.id];
    
    // For multiple-choice questions, always require at least one selection
    // Even if the question is not required, we still need a selection to proceed
    if (currentQuestion.type === 'multiple') {
      return answer && answer.length > 0;
    }
    
    // For single-choice questions, check based on required status
    if (currentQuestion.type === 'single') {
      // If required, must have an answer
      if (currentQuestion.required) {
        return !!answer;
      }
      // If not required but has an answer, it's answered
      return !!answer;
    }
    
    return false;
  };

  // Navigate to next question
  const handleNext = () => {
    // Validate that current question is answered before proceeding
    if (!isAnswered()) {
      return; // Prevent navigation if question is not answered
    }
    
    // Clear any pending auto-advance timeout
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
    
    // Clear multiple-choice auto-advance timer
    if (multipleChoiceAutoAdvanceRef.current) {
      clearTimeout(multipleChoiceAutoAdvanceRef.current);
      multipleChoiceAutoAdvanceRef.current = null;
    }
    
    // Clear shake timer
    if (shakeTimeoutRef.current) {
      clearTimeout(shakeTimeoutRef.current);
      shakeTimeoutRef.current = null;
    }
    setShakeAnimation(false);
    
    if (validStep < totalSteps - 1) {
      // Only proceed if current question is answered
      if (isAnswered()) {
        setCurrentStep(validStep + 1);
      }
    } else {
      // Show disclaimer dialog before submitting
      setShowDisclaimerDialog(true);
    }
  };

  // Navigate to previous question
  const handleBack = () => {
    // Clear any pending auto-advance timeout
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
    
    // Clear multiple-choice auto-advance timer
    if (multipleChoiceAutoAdvanceRef.current) {
      clearTimeout(multipleChoiceAutoAdvanceRef.current);
      multipleChoiceAutoAdvanceRef.current = null;
    }
    
    // Clear shake timer
    if (shakeTimeoutRef.current) {
      clearTimeout(shakeTimeoutRef.current);
      shakeTimeoutRef.current = null;
    }
    setShakeAnimation(false);
    
    if (validStep > 0) {
      const newStep = validStep - 1;
      
      // Get current visible questions based on current responses
      const currentVisibleQuestions = getVisibleQuestions(responses);
      
      // Determine which questions should be kept (up to and including the new step)
      // Questions that come after the new step should have their responses cleared
      const questionsToKeep = currentVisibleQuestions.slice(0, newStep + 1);
      const questionIdsToKeep = new Set(questionsToKeep.map(q => q.id));
      
      // Note: We don't need to explicitly handle conditional dependencies here because:
      // - If a question depends on an earlier question, that earlier question is already
      //   in questionsToKeep (since we slice from 0 to newStep + 1)
      // - If a question depends on a later question, we don't want to keep the later
      //   question's response when going back, so we correctly exclude it
      
      // Filter responses to only keep answers for questions we want to keep
      // This clears answers for questions that come after the new step
      const filteredResponses = {};
      Object.keys(responses).forEach((questionId) => {
        if (questionIdsToKeep.has(questionId)) {
          filteredResponses[questionId] = responses[questionId];
        }
      });
      
      // Update responses first, then step
      // This ensures the UI reflects the cleared responses immediately
      setResponses(filteredResponses);
      setCurrentStep(newStep);
    }
  };

  // Clear response for current question
  const handleClearResponse = () => {
    if (!currentQuestion) return;
    
    // Clear any pending auto-advance timeout
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
    
    // Clear multiple-choice auto-advance timer
    if (multipleChoiceAutoAdvanceRef.current) {
      clearTimeout(multipleChoiceAutoAdvanceRef.current);
      multipleChoiceAutoAdvanceRef.current = null;
    }
    
    // Clear shake timer - will restart automatically if question becomes unanswered
    if (shakeTimeoutRef.current) {
      clearTimeout(shakeTimeoutRef.current);
      shakeTimeoutRef.current = null;
    }
    setShakeAnimation(false);
    
    // Clear the response for the current question
    const updated = { ...responses };
    delete updated[currentQuestion.id];
    
    // Clear any conditional questions that depend on this question
    const cleared = clearInvalidConditionalAnswers(updated);
    setResponses(cleared);
  };

  // Submit consultation
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    // Save progress one more time before submitting to ensure last step is saved
    // This ensures that if user goes back, they see the last question
    // Use validStep to ensure we're saving the correct step index
    if (validStep >= 0 && visibleQuestions.length > 0) {
      localStorage.setItem('questionnaire-progress', JSON.stringify({
        step: validStep,
        responses: responses,
      }));
    }

    try {
      const response = await fetch('/api/submit-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses }),
      });

      const data = await response.json();

      if (data.success) {
        // Save the consultation ID with the progress so we can restore if user goes back
        // Don't clear progress - keep it so user can go back to the last question
        localStorage.setItem('questionnaire-consultation-id', data.consultationId);
        // Ensure progress is saved with the valid step (last question)
        // This ensures that when user presses back, they see the last question they were on
        if (visibleQuestions.length > 0) {
          localStorage.setItem('questionnaire-progress', JSON.stringify({
            step: validStep,
            responses: responses,
          }));
        }
        // Keep the progress saved so if user presses back, they see the last question
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
    if (!currentQuestion) return false;
    
    const answer = responses[currentQuestion.id];
    if (currentQuestion.type === 'single') {
      return answer === value;
    } else if (currentQuestion.type === 'multiple') {
      return answer && answer.includes(value);
    }
    return false;
  };

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-10 flex flex-col gap-4 sm:gap-6 md:gap-8">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs sm:text-sm text-gray-600">
          <span>Question {totalSteps > 0 ? validStep + 1 : 0} of {totalSteps}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[var(--color-action-primary)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <AnimatePresence mode="wait">
          <motion.div
            key={validStep}
            initial={{ opacity: 0, x: 50 }}
            animate={shakeAnimation 
              ? { 
                  x: [0, -12, 12, -12, 12, -8, 8, 0],
                  opacity: 1
                }
              : { 
                  opacity: 1, 
                  x: 0 
                }
            }
            exit={{ opacity: 0, x: -50 }}
            transition={shakeAnimation 
              ? { 
                  duration: 0.5,
                  ease: "easeInOut"
                }
              : { 
                  duration: 0.3 
                }
            }
            className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8"
          >
            <div className="flex flex-col gap-4 sm:gap-5 md:gap-6">
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                  {currentQuestion.question}
                </h2>
                {currentQuestion.description && (
                  <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                    {currentQuestion.description}
                  </p>
                )}
              </div>

              {/* Options - Use 2-column layout if specified or if many options */}
              <div className={currentQuestion.useTwoColumns || currentQuestion.options.length >= 6 
                ? "grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-[10.8px]" 
                : "space-y-2 sm:space-y-[10.8px]"}>
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(option.value)}
                    className={`w-full text-left p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all touch-manipulation ${
                      isSelected(option.value)
                        ? 'border-[var(--color-action-primary)] bg-[rgba(0,128,128,0.06)]'
                        : 'border-gray-200 hover:border-[var(--color-action-primary)] hover:bg-[rgba(0,128,128,0.03)] active:bg-[rgba(0,128,128,0.05)]'
                    }`}
                    style={{ minHeight: '44px' }}
                  >
                    <div className="flex items-center">
                      {option.icon && (
                        <span className="text-xl sm:text-2xl mr-2 sm:mr-3 flex-shrink-0">{option.icon}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm sm:text-base font-semibold text-gray-900">
                          {option.label}
                        </div>
                        {option.description && (
                          <div className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                            {option.description}
                          </div>
                        )}
                      </div>
                      {isSelected(option.value) && (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[var(--color-action-primary)] flex items-center justify-center flex-shrink-0 ml-2 sm:ml-[7px]">
                          <svg
                            className="w-3 h-3 sm:w-4 sm:h-4 text-white"
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

              {/* Show tips and warnings for multiple choice questions */}
              {currentQuestion.type === 'multiple' && responses[currentQuestion.id] && responses[currentQuestion.id].length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {/* Show tip only for primaryConcerns, not for allergies */}
                  {currentQuestion.id === 'primaryConcerns' && !currentQuestion.maxSelections && responses[currentQuestion.id].length > 5 && (
                    <p className="text-sm text-amber-600">
                      💡 Tip: Focus on your top 3-5 for best results
                    </p>
                  )}
                  {/* Show warning for preferences if too many selected */}
                  {currentQuestion.id === 'preferences' && responses[currentQuestion.id].length > 5 && (
                    <p className="text-sm text-amber-600">
                      ⚠️ Too many preferences may limit product options and affect recommendations
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Clear Response Button - Bottom Left, slightly closer to options */}
            {isAnswered() && (
              <button
                onClick={handleClearResponse}
                className="mt-2 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors py-1"
              >
                <X className="w-3.5 h-3.5" />
                {currentQuestion.type === 'single' ? 'Clear response' : 'Clear responses'}
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex flex-col-reverse gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <button
          onClick={handleBack}
          disabled={validStep === 0 || !currentQuestion}
          className="w-full md:w-auto flex items-center justify-center px-4 sm:px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation text-sm sm:text-base"
          style={{ minHeight: '44px' }}
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Back
        </button>

        {currentQuestion && (
          <button
            onClick={handleNext}
            disabled={!isAnswered() || isSubmitting}
            className="w-full md:w-auto flex items-center justify-center px-4 sm:px-6 py-3 rounded-lg bg-[var(--color-action-primary)] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg active:opacity-90 transition-all touch-manipulation text-sm sm:text-base"
            style={{ minHeight: '44px' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" style={{ color: 'var(--color-action-primary)' }} />
                Processing...
              </>
            ) : validStep === totalSteps - 1 ? (
              'Get My Report'
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Disclaimer Dialog */}
      <Dialog open={showDisclaimerDialog} onOpenChange={setShowDisclaimerDialog}>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 mb-2">
              Important Disclaimer
            </DialogTitle>
            <DialogDescription className="text-gray-700">
              Please read and acknowledge before viewing your report.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
              <p className="text-sm text-gray-800 leading-relaxed">
                <strong className="font-semibold text-amber-900">Medical Disclaimer:</strong>
              </p>
              <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                The skincare recommendations and analysis provided in this report are <strong>not a medical prescription</strong> and should not be considered as such. These suggestions are based solely on the answers you provided to our questionnaire and are intended for informational purposes only.
              </p>
              <p className="text-sm text-gray-700 mt-3 leading-relaxed">
                This consultation does not replace professional medical advice, diagnosis, or treatment. If you have specific skin concerns, medical conditions, or are experiencing severe symptoms, please consult with a qualified dermatologist or healthcare provider.
              </p>
            </div>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <p className="text-sm text-gray-700 leading-relaxed">
                By continuing, you acknowledge that you understand this disclaimer and agree that the recommendations provided are suggestions based on your responses, not medical advice.
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={() => setShowDisclaimerDialog(false)}
              className="w-full sm:w-auto px-4 py-3 sm:py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors touch-manipulation font-medium"
              style={{ minHeight: '44px' }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowDisclaimerDialog(false);
                handleSubmit();
              }}
              className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-[var(--color-action-primary)] text-white rounded-lg hover:bg-[var(--color-action-hover)] active:opacity-90 transition-colors font-semibold touch-manipulation"
              style={{ minHeight: '44px' }}
            >
              I Understand, Continue
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conditional Question Dialog */}
      <Dialog 
        open={showConditionalDialog} 
        onOpenChange={(open) => {
          if (!open) {
            // Clear any pending auto-advance timeout when dialog is closed
            if (autoAdvanceTimeoutRef.current) {
              clearTimeout(autoAdvanceTimeoutRef.current);
              autoAdvanceTimeoutRef.current = null;
            }
            if (multipleChoiceAutoAdvanceRef.current) {
              clearTimeout(multipleChoiceAutoAdvanceRef.current);
              multipleChoiceAutoAdvanceRef.current = null;
            }
          }
          setShowConditionalDialog(open);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          {activeConditional && (
            <>
              <DialogHeader>
                <DialogTitle>{activeConditional.question}</DialogTitle>
                {activeConditional.description && (
                  <DialogDescription>{activeConditional.description}</DialogDescription>
                )}
              </DialogHeader>
              <div className={activeConditional.useTwoColumns || (activeConditional.options?.length || 0) >= 6
                ? "grid grid-cols-1 md:grid-cols-2 gap-3"
                : "space-y-3"}>
                {activeConditional.options?.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleConditionalAnswer(activeConditional.id, opt.value)}
                    className="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-center">
                      {opt.icon && <span className="text-2xl mr-3 flex-shrink-0">{opt.icon}</span>}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900">{opt.label}</div>
                        {opt.description && (
                          <div className="text-sm text-gray-600 mt-1">{opt.description}</div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <DialogFooter>
                <button
                  onClick={() => {
                    // Clear any pending auto-advance timeout when manually closing
                    if (autoAdvanceTimeoutRef.current) {
                      clearTimeout(autoAdvanceTimeoutRef.current);
                      autoAdvanceTimeoutRef.current = null;
                    }
                    if (multipleChoiceAutoAdvanceRef.current) {
                      clearTimeout(multipleChoiceAutoAdvanceRef.current);
                      multipleChoiceAutoAdvanceRef.current = null;
                    }
                    setShowConditionalDialog(false);
                    setConditionalQueue([]);
                    setActiveConditional(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Exit Confirmation Dialog - When leaving quiz in progress */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold">Complete now and don't lose your progress</DialogTitle>
            <DialogDescription className="text-base pt-2">
              You're making great progress! Finish the consultation to get your personalized skincare recommendations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 sm:justify-end">
            <button
              onClick={() => {
                setShowExitDialog(false);
                // Allow navigation/close - progress is saved in localStorage
              }}
              className="w-full sm:w-auto px-4 py-3 sm:py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation font-medium"
              style={{ minHeight: '44px' }}
            >
              Continue Later
            </button>
            <button
              onClick={() => {
                setShowExitDialog(false);
                // User wants to continue - dialog closes and they stay on page
              }}
              className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-[var(--color-action-primary)] text-white rounded-lg hover:bg-[var(--color-action-hover)] active:opacity-90 transition-colors font-semibold touch-manipulation"
              style={{ minHeight: '44px' }}
            >
              Continue Quiz
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}