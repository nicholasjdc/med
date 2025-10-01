
import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LogData } from '../lib/constants';
import { formatTime } from '../lib/utils';
import Icon from './Icon';

interface SummaryScreenProps {
    logData: LogData;
    onNewResuscitation: () => void;
}

const SummaryScreen: React.FC<SummaryScreenProps> = ({ logData, onNewResuscitation }) => {
    const apgarDisplay = (score: number | null) => score !== null ? score.toString() : 'N/A';

    return (
        <ScrollView >
            <View style={styles.summaryContainer}>
                <View style={styles.summaryHeader}>
                    <Text style={styles.summaryTitle}>Neonatal Resuscitation Event Log</Text>
                    <Text style={styles.summarySubtitle}>
                        Log Time: {new Date().toLocaleString()}
                    </Text>
                </View>

                {/* Key Metrics Section */}
                <View style={styles.metricsPanel}>
                    <Text style={styles.metricsTitle}>★ Key Resuscitation Metrics</Text>
                    <View style={styles.metricsGrid}>
                        {/* Patient Info */}
                        <View style={styles.metricBlock}>
                            <Text style={styles.metricBlockTitle}>Patient Details</Text>
                            <Text style={styles.metricText}>Gest. Age: <Text style={styles.metricValue}>{logData.gestationalAge || 'N/A'}</Text> wks</Text>
                            <Text style={styles.metricText}>Birth Weight: <Text style={styles.metricValue}>{logData.weightKg || 'N/A'}</Text> kg</Text>
                        </View>
                        
                        {/* APGAR Scores */}
                        <View style={styles.metricBlock}>
                            <Text style={styles.metricBlockTitle}>APGAR Scores</Text>
                            <Text style={styles.metricText}>1 Min: <Text style={styles.metricValueRed}>{apgarDisplay(logData.apgar1)}</Text></Text>
                            <Text style={styles.metricText}>5 Min: <Text style={styles.metricValueRed}>{apgarDisplay(logData.apgar5)}</Text></Text>
                            <Text style={styles.metricText}>10 Min: <Text style={styles.metricValueRed}>{apgarDisplay(logData.apgar10)}</Text></Text>
                        </View>

                        {/* Epinephrine Doses */}
                        <View style={styles.metricBlock}>
                            <Text style={styles.metricBlockTitle}>Summary</Text>
                            <Text style={styles.metricText}>Time: <Text style={styles.metricValueRed}>{formatTime(logData.totalTimeSeconds)}</Text></Text>
                            <Text style={styles.metricText}>IV/IO Epi: <Text style={styles.metricValueGreen}>{logData.epiDosesIV}</Text></Text>
                            <Text style={styles.metricText}>ET Tube Epi: <Text style={styles.metricValueGreen}>{logData.epiDosesIT}</Text></Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.timelineTitle}>Timeline of Events</Text>
                <View style={styles.timelineLogContainer}>
                    {logData.events.map((event, index) => (
                        <View key={index} style={[styles.timelineEvent, index === 0 ? styles.timelineEventInitial : styles.timelineEventDefault]}>
                            <Text>
                                <Text style={styles.timelineTime}>[{formatTime(event.time)}]</Text>
                                <Text style={styles.timelineStep}> {event.step}</Text>: {event.description}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>

            <TouchableOpacity
                onPress={onNewResuscitation}
                style={styles.newResusButton}
            >
                <Icon style={styles.newResusButtonText}>↻</Icon>
                <Text style={styles.newResusButtonText}>Start New Resuscitation</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    summaryContainer: {
        backgroundColor: '#fff',
        padding: 32,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
        borderTopWidth: 8,
        borderTopColor: '#4f46e5',
        marginBottom: 24,
    },
    summaryHeader: {
        alignItems: 'center',
        marginBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 16,
    },
    summaryTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#374151',
    },
    summarySubtitle: {
        fontSize: 16,
        color: '#6b7280',
        marginTop: 8,
        fontWeight: '600',
    },
    metricsPanel: {
        marginBottom: 32,
        padding: 16,
        backgroundColor: '#e0e7ff', // indigo-100
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#c7d2fe',
    },
    metricsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 16,
    },
    metricsGrid: {
        flexDirection: 'column',
        gap: 16,
    },
    metricBlock: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#c7d2fe',
    },
    metricBlockTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
    },
    metricText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    metricValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#4f46e5',
    },
    metricValueRed: {
        fontSize: 20,
        fontWeight: '900',
        color: '#dc2626',
    },
    metricValueGreen: {
        fontSize: 20,
        fontWeight: '900',
        color: '#047857',
    },
    timelineTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 12,
        borderBottomWidth: 2,
        borderBottomColor: '#ccc',
        paddingBottom: 4,
    },
    timelineLogContainer: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        backgroundColor: '#f9fafb',
        padding: 12,
        maxHeight: 300,
    },
    timelineEvent: {
        marginBottom: 8,
        padding: 8,
        borderRadius: 4,
        borderLeftWidth: 4,
    },
    timelineEventInitial: {
        borderLeftColor: '#4f46e5',
        backgroundColor: '#e0e7ff',
    },
    timelineEventDefault: {
        borderLeftColor: '#d1d5db',
        backgroundColor: '#fff',
    },
    timelineTime: {
        color: '#dc2626',
        fontWeight: 'bold',
    },
    timelineStep: {
        fontWeight: '500',
        color: '#1f2937',
    },
    timelineEventDescription: {
        color: '#374151',
    },
    newResusButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#4f46e5',
        padding: 16,
        borderRadius: 9999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
        marginVertical: 16,
    },
    newResusButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
        marginLeft: 8,
    }
});

export default SummaryScreen;
