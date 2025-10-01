
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getSpO2Target } from '../lib/utils';

interface SpO2GoalDisplayProps {
    elapsedTime: number;
}

const SpO2GoalDisplay: React.FC<SpO2GoalDisplayProps> = ({ elapsedTime }) => {
    const { range, goalValue, currentMinute } = useMemo(() => getSpO2Target(elapsedTime), [elapsedTime]);

    // Simplified visualization for native (no complex SVG)
    return (
        <View style={styles.spo2Container}>
            <View style={styles.spo2GoalCircle}>
                <Text style={styles.spo2GoalValue}>{goalValue}%</Text>
                <Text style={styles.spo2GoalLabel}>GOAL</Text>
            </View>
            <View style={styles.spo2TextWrapper}>
                <Text style={styles.spo2TargetLabel}>Target SpO₂ (Min {currentMinute}+)</Text>
                <Text style={styles.spo2TargetRange}>{range}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    spo2Container: {
        padding: 12,
        borderColor: '#e0e7ff', // indigo-200
        borderWidth: 1,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        backgroundColor: '#f5f5ff', // indigo-50 light
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 180,
    },
    spo2GoalCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#4f46e5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    spo2GoalValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#fff',
    },
    spo2GoalLabel: {
        fontSize: 10,
        color: '#e0e7ff',
        fontWeight: '600',
    },
    spo2TextWrapper: {
        flexDirection: 'column',
    },
    spo2TargetLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4b5563',
    },
    spo2TargetRange: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#dc2626', // red-600
    },
});

export default SpO2GoalDisplay;
