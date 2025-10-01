import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from './Icon';

interface InstructionCardProps {
    visible: boolean;
    instruction: string;
}

const InstructionCard: React.FC<InstructionCardProps> = ({ visible, instruction }) => {
    if (!visible) {
        return null;
    }

    return (
        <View style={styles.overlay}>
            <View style={styles.card}>
                <Icon style={styles.icon}>🩺</Icon>
                <Text style={styles.instructionText}>{instruction}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'flex-end',
        alignItems: 'center',
        zIndex: 1000,
    },
    card: {
        backgroundColor: '#2E7D32', // A deep green color
        borderRadius: 12,
        padding: 24,
        margin: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 10,
        width: '90%',
    },
    icon: {
        fontSize: 48,
        color: '#fff',
        marginBottom: 16,
    },
    instructionText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
});

export default InstructionCard;