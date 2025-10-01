
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { APGAR_CRITERIA, ApgarCriterionScores, INITIAL_CRITERIA_SCORES } from '../lib/constants';
import Icon from './Icon';

interface ApgarScoringCardProps {
    label: string;
    time: number;
    value: number | null;
    onChange: (value: number | null) => void;
    currentElapsedTime: number;
    isRunning: boolean;
    isExpanded: boolean;
    onToggleExpand: () => void;
    cardWidth: number;
    cardHeight: number | undefined;
    dynamicFontSize: number;
    onSaveAndHide: () => void;
}

const ApgarScoringCard: React.FC<ApgarScoringCardProps> = ({ label, time, value, onChange, currentElapsedTime, isRunning, isExpanded, onToggleExpand, cardWidth, cardHeight, dynamicFontSize, onSaveAndHide }) => {
    const [currentScores, setCurrentScores] = useState<ApgarCriterionScores>(INITIAL_CRITERIA_SCORES);
    
    const isReady = (time === 1 && currentElapsedTime >= 60) || (time > 1 && currentElapsedTime >= time * 60);
    const isEntered = value !== null;
    const isDisabled = !isRunning;

    useEffect(() => {
        if (value === null) {
            setCurrentScores({...INITIAL_CRITERIA_SCORES}); 
        }
    }, [value]);


    const totalScore = useMemo(() => {
        return Object.values(currentScores).reduce((sum, score) => sum + score, 0);
    }, [currentScores]);

    const handleScoreChange = (criterionKey: string, score: number) => {
        setCurrentScores(prevScores => ({
            ...prevScores,
            [criterionKey]: score
        }));
    };

    const handleSave = () => {
        onChange(totalScore); 
        onSaveAndHide();
    };

    

    // Determine card style based on state
    let cardStyle = styles.apgarCardWaiting;
    if (isEntered) {
        cardStyle = styles.apgarCardEntered;
    } else if (isReady) {
        cardStyle = styles.apgarCardReady;
    }

    const dynamicCardStyle = {
        width: cardWidth,
        height: cardHeight,
    };

    

    return (
        <View style={
                isExpanded
                    ? styles.apgarCardExpandedFull
                    : [styles.apgarCardBase, cardStyle, styles.apgarCard, dynamicCardStyle]
            }>
            <View style={styles.apgarHeader}>
                <Text style={styles.apgarTitle}>
                    {label} Score ({time} min)
                </Text>
                <View style={[styles.apgarTotalScoreBadge, totalScore < 7 ? styles.apgarTotalScoreBadgeBad : styles.apgarTotalScoreBadgeGood]}>
                    <Text style={styles.apgarTotalScoreText}>
                        {totalScore}
                    </Text>
                </View>
            </View>

            <View style={styles.apgarCriteriaList}>
                {APGAR_CRITERIA.map(criterion => (
                    <View key={criterion.key} style={styles.apgarCriterionRow}>
                            <Text style={styles.apgarCriterionKey}>{criterion.key}:</Text>
                            <View style={styles.apgarCriterionOptions}>
                                {[0, 1, 2].map(score => {
                                    const isSelected = currentScores[criterion.key] === score;
                                    return (
                                    <TouchableOpacity
                                        key={score}
                                        onPress={() => handleScoreChange(criterion.key, score)}
                                        style={[
                                            styles.apgarCriterionButton,
                                            isSelected 
                                                ? styles.apgarCriterionButtonSelected 
                                                : styles.apgarCriterionButtonDefault
                                        ]}
                                        disabled={isDisabled}
                                    >
                                        <Text style={[styles.apgarCriterionScoreText, isSelected && { color: '#fff' }]}>{score}</Text> 
                                    </TouchableOpacity>
                                )})}
                            </View>
                        </View>
                    ))}
                </View>

                <TouchableOpacity
                    onPress={handleSave}
                    style={[styles.saveButton, isDisabled && styles.buttonDisabled]}
                    disabled={isDisabled}
                >
                    <Icon style={styles.saveButtonText}>✓</Icon> 
                    <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
            </View>
        );
    }

const styles = StyleSheet.create({
    apgarCardBase: { // New base style
        marginHorizontal: 2,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    apgarCard: { // This will be used when not expanded
        justifyContent: 'center',
    },
    apgarCardWaiting: {
        backgroundColor: '#f9fafb', // gray-50
        borderWidth: 1,
        borderColor: '#e5e7eb', // gray-200
    },
    apgarCardReady: {
        backgroundColor: '#fffbeb', // yellow-50
        borderWidth: 2,
        borderColor: '#fcd34d', // yellow-300
    },
    apgarCardEntered: {
        backgroundColor: '#f0fff4', // green-50
        borderWidth: 2,
        borderColor: '#4ade80', // green-400
    },
    apgarCardExpandedFull: {
        marginHorizontal: 2,
        padding: 16,
        borderRadius: 12,
        // Removed alignItems: 'center' from here
        height: 'auto', // Allow height to be determined by content
        width: '100%', // Ensure it fills horizontally
        zIndex: 1000,
        flexDirection: 'column', // Explicitly set to column to ensure vertical flow
    },


    // APGAR Text Styles
    apgarLabel: {
        fontWeight: '600',
        color: '#4b5563',
        marginBottom: 4,
    },
    apgarScoreWaiting: {
        fontWeight: '900',
        color: '#9ca3af', // gray-400
        marginVertical: 4,
    },
    apgarDueTime: {
        color: '#6b7280',
    },
    apgarLabelEntered: {
        fontWeight: '600',
        color: '#374151',
    },
    apgarScoreEntered: {
        fontWeight: '900',
        color: '#047857', // green-700
        marginVertical: 4,
    },
    apgarEditButton: {
        marginTop: 8,
    },
    apgarEditButtonText: {
        color: '#4f46e5',
        fontWeight: '600',
    },

    // APGAR Expanded View
    apgarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    apgarTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    apgarTotalScoreBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    apgarTotalScoreBadgeGood: {
        backgroundColor: '#d1fae5', // green-100
    },
    apgarTotalScoreBadgeBad: {
        backgroundColor: '#fee2e2', // red-100
    },
    apgarTotalScoreText: {
        fontSize: 24,
        fontWeight: '900',
        color: '#047857', // green-700
    },
    apgarCriteriaList: {
        marginBottom: 16,
    },
    apgarCriterionRow: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    apgarCriterionKey: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4f46e5', // indigo-700
        marginBottom: 4,
    },
    apgarCriterionOptions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 4,
        flexWrap: 'wrap',
    },
    apgarCriterionButton: {
        width: 40, // Fixed width
        height: 40, // Fixed height to make it square
        borderRadius: 20, // Half of width/height to make it circular
        marginHorizontal: 2,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center', // Center content vertically
    },
    apgarCriterionButtonDefault: {
        backgroundColor: '#fff',
        borderColor: '#d1d5db',
    },
    apgarCriterionButtonSelected: {
        backgroundColor: '#4f46e5', // indigo-600
        borderColor: '#4f46e5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },
    apgarCriterionScoreText: { // Base text style, no descendant selector needed
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    apgarCriterionOptionText: { // Base text style, no descendant selector needed
        fontSize: 10,
        textAlign: 'center',
        marginTop: 2,
        color: '#1f2937', // Ensuring default color is set
    },
    saveButton: {
        backgroundColor: '#4f46e5',
        padding: 12,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 6,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});

export default ApgarScoringCard;
