import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  score: number;
  grade: string;
}

export const DealScoreGauge: React.FC<Props> = ({ score, grade }) => {
  const getBadgeStyle = () => {
    switch (grade) {
      case 'SUPER_DEAL':
        return { bg: '#ecfdf5', text: '#059669', label: 'SUPER DEAL' };
      case 'GREAT_DEAL':
        return { bg: '#eff6ff', text: '#2563eb', label: 'GRAN DEAL' };
      case 'GOOD_DEAL':
        return { bg: '#fffbeb', text: '#d97706', label: 'BUEN DEAL' };
      default:
        return { bg: '#f1f5f9', text: '#475569', label: 'REGULAR' };
    }
  };

  const style = getBadgeStyle();

  return (
    <View style={[styles.container, { backgroundColor: style.bg }]}>
      <Text style={[styles.scoreText, { color: style.text }]}>{score}</Text>
      <Text style={[styles.gradeText, { color: style.text }]}>{style.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '800',
  },
  gradeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
