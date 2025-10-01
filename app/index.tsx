import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import ApgarScoringCard from './components/ApgarScoringCard';
import Icon from './components/Icon';
import InstructionCard from './components/InstructionCard';
import SpO2GoalDisplay from './components/SpO2GoalDisplay';
import SummaryScreen from './components/SummaryScreen';
import { useTimer } from './hooks/useTimer';
import { LogData, LogEvent, RESUSCITATION_STEPS, StepId } from './lib/constants';
import { formatTime } from './lib/utils';


// --- Main App Component ---
export default function App() {
  // Resuscitation State
  const [currentStepId, setCurrentStepId] = useState<StepId>('START');
  const [eventsLog, setEventsLog] = useState<LogEvent[]>([]);
  const [isResusRunning, setIsResusRunning] = useState<boolean>(false);
  const [finalLog, setFinalLog] = useState<LogData | null>(null);
  const [instructionCardVisible, setInstructionCardVisible] = useState<boolean>(false);
  const [instructionCardText, setInstructionCardText] = useState<string>('');
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState<number>(-1); // -1 means no sequence active

  const ppvInstructions = [
    "Say the rhythm breathe 2-3, breathe 2-3 out loud",
    "Attach SpO2 probe to baby's right hand now",
    "Assess Chest Rise and Heart Rate Now"
  ];

  // Patient Info State
  const [gestationalAge, setGestationalAge] = useState<number | ''>('');
  const [weightKg, setWeightKg] = useState<number | ''>('');

  // NRP State
  const [apgar1, setApgar1] = useState<number | null>(null);
  const [apgar5, setApgar5] = useState<number | null>(null);
  const [apgar10, setApgar10] = useState<number | null>(null);
  const [showApgar1Card, setShowApgar1Card] = useState<boolean>(false);
  const [showApgar5Card, setShowApgar5Card] = useState<boolean>(false);
  const [showApgar10Card, setShowApgar10Card] = useState<boolean>(false);
  const [epiDosesIV, setEpiDosesIV] = useState<number>(0); 
  const [epiDosesIT, setEpiDosesIT] = useState<number>(0); 
  const [expandedApgar, setExpandedApgar] = useState<string | null>(null);

  const { elapsedTime, resetTimer } = useTimer(isResusRunning);
  const currentStep = useMemo(() => RESUSCITATION_STEPS[currentStepId], [currentStepId]);
  const { width } = useWindowDimensions();

  // Calculate dynamic sizes for APGAR cards
  const apgarPanelPadding = 32; // 16px on each side
  const apgarCardMargin = 4; // 4px on each side
  const availableWidth = width - apgarPanelPadding - (apgarCardMargin * 6); // Total margins for 3 cards
  const cardWidth = availableWidth / 3;
  const cardHeight = cardWidth * 1.25; // Maintain a 4:5 aspect ratio
  const dynamicFontSize = Math.max(10, cardWidth / 8); // Scale font size with card width

  // 1. Resuscitation State Management and Logging
  const logEvent = useCallback((description: string, stepId: StepId, actionTime: number) => {
    const newEvent: LogEvent = {
      time: actionTime,
      step: RESUSCITATION_STEPS[stepId].title,
      description: description,
    };
    setEventsLog(prevLog => [...prevLog, newEvent]);
  }, []);

  const finalizeLog = useCallback(() => {
    setIsResusRunning(false); 
    const logData: LogData = {
        totalTimeSeconds: elapsedTime,
        startStep: RESUSCITATION_STEPS['START'].title,
        finalStep: RESUSCITATION_STEPS[currentStepId].title,
        events: eventsLog,
        timestamp: new Date().toISOString(),
        apgar1: apgar1,
        apgar5: apgar5,
        apgar10: apgar10,
        epiDosesIV: epiDosesIV,
        epiDosesIT: epiDosesIT,
        gestationalAge: gestationalAge,
        weightKg: weightKg,
    };
    setFinalLog(logData);
    setCurrentStepId('END');
  }, [elapsedTime, currentStepId, eventsLog, apgar1, apgar5, apgar10, epiDosesIV, epiDosesIT, gestationalAge, weightKg]);


  const handleAction = useCallback((nextStepId: StepId, logDescription: string) => {
    if (currentStepId === 'START' && nextStepId === 'INITIAL_ASSESSMENT' && !isResusRunning) {
        setIsResusRunning(true);
        const initialLog = `Resuscitation initiated at 00:00. ${
            gestationalAge ? `Gestational Age: ${gestationalAge} weeks. ` : ''
        }${
            weightKg ? `Birth Weight: ${weightKg} kg. ` : ''
        } ${logDescription}`;
        logEvent(initialLog, currentStepId, 0);
        const instruction = 'Auscultate and Calculate heart rate';
        setInstructionCardText(instruction);
        setInstructionCardVisible(true);
        Speech.speak(instruction, { language: 'en-US' });
        setTimeout(() => {
            setInstructionCardVisible(false);
            setCurrentStepId('INITIAL_ASSESSMENT');
        }, 5000);
    } else if (nextStepId === 'PPV_START') {
        logEvent(logDescription, currentStepId, elapsedTime);
        setInstructionCardVisible(true);
        setCurrentInstructionIndex(0); // Start the sequence
        // Do NOT set currentStepId here, it will be set after the sequence
    } else if (isResusRunning) {
        logEvent(logDescription, currentStepId, elapsedTime);

        if (nextStepId === 'POST_RESUSCITATION_CARE' && logDescription.includes('HR > 100')) {
            setInstructionCardText("Please Stop chest compressions and continue PPV. Change rhythm to breath-2-3");
            setInstructionCardVisible(true);
            Speech.speak("Please Stop chest compressions and continue PPV. Change rhythm to breath-2-3", { language: 'en-US' });
            // Optionally, hide the instruction card after a delay
            setTimeout(() => {
                setInstructionCardVisible(false);
            }, 8000); // Display for 8 seconds
        }
        setCurrentStepId(nextStepId);
    }

    if (nextStepId === 'END') {
        finalizeLog();
    }
  }, [isResusRunning, logEvent, currentStepId, elapsedTime, finalizeLog, gestationalAge, weightKg, setCurrentInstructionIndex, ppvInstructions, setInstructionCardText, setInstructionCardVisible, Speech]);
  
  const handleEpinephrineDose = useCallback((route: 'IV' | 'IT') => {
    if (!isResusRunning || currentStepId !== 'EPINEPHRINE') return;

    if (route === 'IV') {
        setEpiDosesIV(prev => prev + 1);
        const logMsg = `Epinephrine dose #${epiDosesIV + 1} administered (IV/IO).`;
        logEvent(logMsg, 'EPINEPHRINE', elapsedTime);
    } else {
        setEpiDosesIT(prev => prev + 1);
        const logMsg = `Epinephrine dose #${epiDosesIT + 1} administered (ET Tube).`;
        logEvent(logMsg, 'EPINEPHRINE', elapsedTime);
    }
  }, [isResusRunning, currentStepId, epiDosesIV, epiDosesIT, logEvent, elapsedTime]);

  // 2. Timer-based Logic (Auto-prompts/Reminders)
  useEffect(() => {
    if (!isResusRunning || currentStepId === 'END' || currentStepId === 'ROUTINE' || currentStepId === 'VOLUME_EXPANSION') return;

    const currentTime: number = elapsedTime;
    
    // Reminders for APGAR scores
    const apgarTimes = [60, 300, 600]; 
    const apgarScores = [apgar1, apgar5, apgar10];
    
    apgarTimes.forEach((time, index) => {
        const reminderText = `REMINDER: APGAR ${time/60}-minute score is due now.`;
        const alreadyLogged = eventsLog.some(e => e.time === currentTime && e.description.includes(`APGAR ${time/60}-minute score`));

        if (currentTime === time) {
            if (apgarScores[index] === null && !alreadyLogged) {
                logEvent(reminderText, currentStepId, currentTime);
            }
            // Set visibility for the corresponding APGAR card
            if (index === 0) setShowApgar1Card(true);
            if (index === 1) setShowApgar5Card(true);
            if (index === 2) setShowApgar10Card(true);
        }
    });

    // Auto-transition to Epinephrine after 60s of CC
    if (currentStepId === 'COMPRESSIONS_INITIATION') { 
      const ccStartTime = eventsLog.find(e => e.step === RESUSCITATION_STEPS['COMPRESSIONS_INITIATION'].title)?.time || 0;
      
      if (ccStartTime > 0 && currentTime === ccStartTime + 60) {
        const logMsg = 'Automatic check: 60 seconds of Chest Compressions completed. HR still < 60. Proceeding to Epinephrine.';
        const alreadyTransitioned = eventsLog.some(e => e.time === currentTime && e.description.includes('Automatic check: 60 seconds'));
        
        if (!alreadyTransitioned) {
             logEvent(logMsg, currentStepId, currentTime);
             setCurrentStepId('EPINEPHRINE');
        }
      }
    }

    // Epinephrine Dosing Cycle Check (after 60s of last dose/cc initiation)
    if (currentStepId === 'EPINEPHRINE') {
        const lastMajorActionTime = eventsLog
            .filter(e => e.step === RESUSCITATION_STEPS['COMPRESSIONS_INITIATION'].title || e.description.includes('Epinephrine dose'))
            .pop()?.time || 0;
            
        if (lastMajorActionTime > 0 && currentTime === lastMajorActionTime + 60) {
            const reminderMsg = 'REMINDER: 60 seconds after last Epinephrine dose or major intervention. Assess HR now.';
            const alreadyReminded = eventsLog.some(e => e.time === currentTime && e.description.includes('60 seconds after last Epinephrine dose'));

            if (!alreadyReminded) {
                logEvent(reminderMsg, currentStepId, currentTime);
            }
        }
    }


  }, [elapsedTime, isResusRunning, currentStepId, logEvent, eventsLog, apgar1, apgar5, apgar10, setShowApgar1Card, setShowApgar5Card, setShowApgar10Card]); 

  // Effect for sequential PPV instructions
  useEffect(() => {
    if (currentInstructionIndex !== -1 && currentInstructionIndex < ppvInstructions.length) {
      const instruction = ppvInstructions[currentInstructionIndex];
      setInstructionCardText(instruction);
      Speech.speak(instruction, { language: 'en-US' });

      const timer = setTimeout(() => {
        setCurrentInstructionIndex(prevIndex => prevIndex + 1);
      }, 5000); // Display each instruction for 5 seconds

      return () => clearTimeout(timer);
    } else if (currentInstructionIndex === ppvInstructions.length) {
      // Sequence finished
      setInstructionCardVisible(false);
      setCurrentInstructionIndex(-1); // Reset
      setCurrentStepId('PPV_START'); // Now transition to the actual step
    }
  }, [currentInstructionIndex, ppvInstructions, setInstructionCardText, setInstructionCardVisible, setCurrentInstructionIndex, setCurrentStepId]);

  // 3. Control Functions
  const handleNewResuscitation = useCallback(() => {
    setCurrentStepId('START');
    setEventsLog([]);
    resetTimer();
    setIsResusRunning(false);
    setFinalLog(null);
    setApgar1(null);
    setApgar5(null);
    setApgar10(null);
    setEpiDosesIV(0);
    setEpiDosesIT(0);
    setGestationalAge('');
    setWeightKg('');
    setExpandedApgar(null);
    setShowApgar1Card(false);
    setShowApgar5Card(false);
    setShowApgar10Card(false);
  }, [resetTimer, setShowApgar1Card, setShowApgar5Card, setShowApgar10Card]);

  const handleToggleApgar = (label: string) => {
    setExpandedApgar(prev => (prev === label ? null : label));
  };


  // --- Render logic ---
  if (finalLog) {
      return <SummaryScreen logData={finalLog} onNewResuscitation={handleNewResuscitation} />;
  }


  return (
    <View style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.scrollViewContent} style={styles.scrollView}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>
                    <Icon style={styles.headerIcon}>♥</Icon> NRP Navigator
                </Text>
                <TouchableOpacity
                    onPress={handleNewResuscitation}
                    style={styles.resetButton}
                >
                    <Icon style={styles.resetButtonText}>↻</Icon>
                </TouchableOpacity>
            </View>

            {/* Timer & SpO2 Goal Panel */}
            <View style={styles.timerPanel}>
                <View style={styles.timerDisplay}>
                    <Icon style={styles.timerIcon}>⌚</Icon>
                    <View>
                        <Text style={styles.timerText}>
                            {formatTime(elapsedTime)}
                        </Text>
                        <Text style={styles.timerStatus}>{isResusRunning ? 'RESUSCITATION ACTIVE' : 'PRE-START TIME'}</Text>
                    </View>
                </View>
                <View style={styles.spo2Wrapper}>
                    <SpO2GoalDisplay elapsedTime={elapsedTime} />
                </View>
            </View>
            
            {/* Optional Patient Input Section (Only visible before start) */}
            {currentStepId === 'START' && (
                <View style={styles.patientInputPanel}>
                    <Text style={styles.patientInputTitle}><Icon style={styles.patientInputIcon}>👶</Icon> Patient Information (Optional)</Text>
                    <View style={styles.patientInputGroup}>
                        <View style={styles.patientInputField}>
                            <Text style={styles.inputLabel}>Gestational Age (weeks)</Text>
                            <TextInput
                                style={styles.textInput}
                                value={gestationalAge !== '' ? String(gestationalAge) : ''}
                                onChangeText={(text) => setGestationalAge(parseInt(text) || '')}
                                placeholder="e.g., 37"
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.patientInputField}>
                            <Text style={styles.inputLabel}>Weight (kilograms)</Text>
                            <TextInput
                                style={styles.textInput}
                                value={weightKg !== '' ? String(weightKg) : ''}
                                onChangeText={(text) => setWeightKg(parseFloat(text) || '')}
                                placeholder="e.g., 3.2"
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                </View>
            )}


            {/* APGAR Score Input Card */}
            {currentStepId !== 'START' && (
                <View style={styles.apgarPanel}>
                    <Text style={styles.apgarPanelTitle}>⭐ APGAR Score Tracking</Text>
                    <View style={styles.apgarCardsGrid}>
                        {showApgar1Card && (
                            <ApgarScoringCard
                                label="APGAR 1"
                                time={1}
                                value={apgar1}
                                onChange={setApgar1}
                                currentElapsedTime={elapsedTime}
                                isRunning={isResusRunning}
                                isExpanded={expandedApgar === 'APGAR 1'}
                                onToggleExpand={() => handleToggleApgar('APGAR 1')}
                                cardWidth={expandedApgar === 'APGAR 1' ? cardWidth * 3 + (apgarCardMargin * 4) : cardWidth}
                                cardHeight={expandedApgar === 'APGAR 1' || expandedApgar === 'APGAR 5' || expandedApgar === 'APGAR 10' ? undefined : cardHeight}
                                dynamicFontSize={dynamicFontSize}
                                onSaveAndHide={() => setShowApgar1Card(false)}
                            />
                        )}
                        {showApgar5Card && (
                            <ApgarScoringCard
                                label="APGAR 5"
                                time={5}
                                value={apgar5}
                                onChange={setApgar5}
                                currentElapsedTime={elapsedTime}
                                isRunning={isResusRunning}
                                isExpanded={expandedApgar === 'APGAR 5'}
                                onToggleExpand={() => handleToggleApgar('APGAR 5')}
                                cardWidth={expandedApgar === 'APGAR 5' ? cardWidth * 3 + (apgarCardMargin * 4) : cardWidth}
                                cardHeight={expandedApgar === 'APGAR 1' || expandedApgar === 'APGAR 5' || expandedApgar === 'APGAR 10' ? undefined : cardHeight}
                                dynamicFontSize={dynamicFontSize}
                                onSaveAndHide={() => setShowApgar5Card(false)}
                            />
                        )}
                        {showApgar10Card && (
                            <ApgarScoringCard
                                label="APGAR 10"
                                time={10}
                                value={apgar10}
                                onChange={setApgar10}
                                currentElapsedTime={elapsedTime}
                                isRunning={isResusRunning}
                                isExpanded={expandedApgar === 'APGAR 10'}
                                onToggleExpand={() => handleToggleApgar('APGAR 10')}
                                cardWidth={expandedApgar === 'APGAR 10' ? cardWidth * 3 + (apgarCardMargin * 4) : cardWidth}
                                cardHeight={expandedApgar === 'APGAR 1' || expandedApgar === 'APGAR 5' || expandedApgar === 'APGAR 10' ? undefined : cardHeight}
                                dynamicFontSize={dynamicFontSize}
                                onSaveAndHide={() => setShowApgar10Card(false)}
                            />
                        )}
                    </View>
                </View>
            )}


            {/* Current Step / Instruction Panel */}
            <View style={styles.stepPanel}>
                
                <View style={styles.actionButtonContainer}>
                    {currentStep.actions.map((action, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => handleAction(action.nextStep, action.log)}
                            style={[
                                styles.actionButton,
                                instructionCardVisible ? styles.actionButtonDisabled : styles.actionButtonActive
                            ]}
                            disabled={instructionCardVisible}
                        >
                            <Text style={styles.actionButtonText}>
                                {action.label}
                                {currentStepId === 'START' && action.nextStep === 'INITIAL_ASSESSMENT' && <Text style={styles.actionButtonHighlight}>(Starts Timer)</Text>}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Epinephrine Dosing Control */}
            {currentStepId === 'EPINEPHRINE' && (
                <View style={styles.epiPanel}>
                    <Text style={styles.epiPanelTitle}>💧 Epinephrine Dosing</Text>
                    <View style={styles.epiButtonContainer}>
                        <TouchableOpacity
                            onPress={() => handleEpinephrineDose('IV')}
                            style={[styles.epiButtonIV, !isResusRunning && styles.buttonDisabled]}
                            disabled={!isResusRunning}
                        >
                            <Text style={styles.epiButtonText}>Add IV/IO Epi Dose ({epiDosesIV})</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleEpinephrineDose('IT')}
                            style={[styles.epiButtonIT, !isResusRunning && styles.buttonDisabled]}
                            disabled={!isResusRunning}
                        >
                            <Text style={styles.epiButtonText}>Add ET Tube Epi Dose ({epiDosesIT})</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
            
            {/* Event Log */}
            <View style={styles.logPanel}>
                <Text style={styles.logPanelTitle}>📋 Event Timeline</Text>
                <View style={styles.logContainer}>
                    {eventsLog.length === 0 ? (
                        <Text style={styles.logEmptyText}>No events logged yet.</Text>
                    ) : (
                        eventsLog.slice().reverse().map((event, index) => (
                            <View key={index} style={[styles.logEvent, index === 0 ? styles.logEventLatest : styles.logEventDefault]}>
                                <Text style={styles.logEventTime}>[{formatTime(event.time)}]</Text>
                                <Text style={styles.logEventStep}> {event.step}</Text>
                                <Text style={styles.logEventDescription}>: {event.description}</Text>
                            </View>
                        ))
                    )}
                </View>
            </View>
        </ScrollView>
        <InstructionCard visible={instructionCardVisible} instruction={instructionCardText} />
    </View>
  );
};

// --- React Native Styling with StyleSheet.create ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f3f4f6', // Equivalent to bg-gray-100
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        padding: 16,
        paddingBottom: 40,
        maxWidth: 700,
        alignSelf: 'center',
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 4,
        borderBottomColor: '#ef4444', // Equivalent to border-red-500
        paddingBottom: 8,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800', // ext rabold
        color: '#1f2937', // gray-900
        letterSpacing: -0.5,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        color: '#ef4444', // red-500
        fontSize: 32,
        marginRight: 8,
    },
    resetButton: {
        padding: 8,
        backgroundColor: '#e5e7eb', // gray-200
        borderRadius: 9999, // full rounded
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    resetButtonText: {
        fontSize: 20,
        color: '#4b5563', // gray-700
    },

    // Timer & SpO2
    timerPanel: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
        borderTopWidth: 8,
        borderTopColor: '#4f46e5', // indigo-600
        marginBottom: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
    },
    timerDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
    },
    timerIcon: {
        fontSize: 32,
        color: '#4f46e5', // indigo-600
        marginRight: 12,
    },
    timerText: {
        fontSize: 40,
        fontWeight: 'bold',
        fontFamily: 'monospace', // Using a simple monospace font
        color: '#1f2937', // gray-900
    },
    timerStatus: {
        fontSize: 14,
        color: '#6b7280', // gray-500
    },
    spo2Wrapper: {
        alignItems: 'flex-end',
    },

    // Patient Input
    patientInputPanel: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderTopWidth: 4,
        borderTopColor: '#3b82f6', // blue-500
        marginBottom: 24,
    },
    patientInputTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    patientInputIcon: {
        color: '#3b82f6',
        marginRight: 8,
    },
    patientInputGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    patientInputField: {
        flex: 1,
        marginHorizontal: 4,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 4,
    },
    textInput: {
        backgroundColor: '#fff',
        borderColor: '#d1d5db',
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        color: '#1f2937',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
    },

    // APGAR Panel
    apgarPanel: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderTopWidth: 4,
        borderTopColor: '#f59e0b', // yellow-500
        marginBottom: 24,
    },
    apgarPanelTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    apgarCardsGrid: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    
    // Step Panel
    stepPanel: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
        borderTopWidth: 4,
        borderTopColor: '#ef4444', // red-500
        marginBottom: 24,
    },
    stepTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1f2937',
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepIcon: {
        color: '#ef4444',
        marginRight: 8,
    },
    stepInstruction: {
        fontSize: 16,
        color: '#374151', // gray-700
        borderLeftWidth: 4,
        borderLeftColor: '#fca5a5', // red-300
        paddingLeft: 12,
        fontStyle: 'italic',
        marginBottom: 16,
    },
    actionButtonContainer: {
        marginTop: 8,
        gap: 12,
    },
    actionButton: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    actionButtonActive: {
        backgroundColor: '#4f46e5', // indigo-600
    },
    actionButtonInactive: {
        backgroundColor: '#9ca3af', // gray-400
    },
    actionButtonDisabled: {
        backgroundColor: '#d1d5db', // gray-300
    },
    actionButtonText: {
        fontWeight: '600',
        fontSize: 16,
        color: '#fff',
        textAlign: 'center',
    },
    actionButtonHighlight: {
        fontWeight: 'bold',
        color: '#fcd34d', // yellow-300
    },

    // Epinephrine Panel
    epiPanel: {
        backgroundColor: '#fee2e2', // red-100
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 4,
        borderColor: '#ef4444', // red-500
        marginBottom: 24,
    },
    epiPanelTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#991b1b', // red-800
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    epiButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    epiButtonIV: {
        flex: 1,
        backgroundColor: '#dc2626', // red-600
        padding: 12,
        borderRadius: 8,
    },
    epiButtonIT: {
        flex: 1,
        backgroundColor: '#f87171', // red-400
        padding: 12,
        borderRadius: 8,
    },
    epiButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center',
    },
    buttonDisabled: {
        opacity: 0.5,
    },

    // Log Panel
    logPanel: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderTopWidth: 4,
        borderTopColor: '#9ca3af', // gray-400
        marginBottom: 24,
    },
    logPanelTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    logContainer: {
        height: 180, // Fixed height for log area
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        backgroundColor: '#f9fafb', // gray-50
        padding: 8,
    },
    logEmptyText: {
        color: '#6b7280',
        fontSize: 14,
    },
    logEvent: {
        paddingVertical: 6,
        paddingHorizontal: 8,
        marginBottom: 4,
        borderRadius: 4,
        borderLeftWidth: 4,
    },
    logEventLatest: {
        backgroundColor: '#e0e7ff', // indigo-100
        borderLeftColor: '#4f46e5', // indigo-600
    },
    logEventDefault: {
        backgroundColor: '#fff',
        borderLeftColor: '#d1d5db', // gray-200
    },
    logEventTime: {
        color: '#dc2626', // red-600
        fontWeight: 'bold',
        fontFamily: 'monospace',
    },
    logEventStep: {
        fontWeight: '500',
        color: '#1f2937', // gray-800
        fontFamily: 'monospace',
    },
    logEventDescription: {
        color: '#374151', // gray-700
        fontFamily: 'monospace',
    },
});