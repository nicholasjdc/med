
import { SPO2_TARGETS } from './constants';

export const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const getSpO2Target = (elapsedSeconds: number): { range: string, goalValue: number, currentMinute: number } => {
  const currentMinute = Math.floor(elapsedSeconds / 60) + 1;
  
  let targetIndex = Math.min(currentMinute, SPO2_TARGETS.length) - 1; 

  if (targetIndex >= SPO2_TARGETS.length) {
    targetIndex = SPO2_TARGETS.length - 1;
  }
  
  const [min, max] = SPO2_TARGETS[targetIndex] || [85, 95]; 
  const range = `${min}-${max}%`;
  const goalValue = Math.round((min + max) / 2); 
  
  return { range, goalValue, currentMinute };
};
