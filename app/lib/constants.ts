
// --- Type Definitions ---
export type StepId = 'START' | 'INITIAL_ASSESSMENT' | 'PPV_START' | 'PPV_EFFECTIVE_HR_ASSESSMENT' | 'CORRECTIVE_MR' | 'CORRECTIVE_SO' | 'CORRECTIVE_P' | 'CORRECTIVE_A' | 'COMPRESSIONS_INITIATION' | 'EPINEPHRINE' | 'VOLUME_EXPANSION' | 'ROUTINE' | 'POST_RESUSCITATION_CARE' | 'END';

export interface StepAction {
    label: string;
    nextStep: StepId;
    log: string;
}

export interface ResuscitationStep {
    title: string;
    timeRequired: number;
    instruction: string;
    actions: StepAction[];
}

export interface LogEvent {
    time: number;
    step: string;
    description: string;
}

export interface LogData {
    totalTimeSeconds: number;
    startStep: string;
    finalStep: string;
    events: LogEvent[];
    timestamp: string;
    apgar1: number | null;
    apgar5: number | null;
    apgar10: number | null;
    epiDosesIV: number;
    epiDosesIT: number;
    gestationalAge: number | '';
    weightKg: number | '';
}

// --- APGAR Scoring Constants ---
export const APGAR_CRITERIA = [
    { key: 'Appearance', label: 'Color', options: ['Blue, pale', 'Body pink, extremities blue', 'Completely pink'] },
    { key: 'Pulse', label: 'Heart Rate', options: ['Absent', '< 100/min', '> 100/min'] },
    { key: 'Grimace', label: 'Reflex', options: ['No response', 'Grimace or weak cry', 'Sneeze, cough, vigorous cry'] },
    { key: 'Activity', label: 'Muscle Tone', options: ['Limp', 'Some flexion', 'Active movement'] },
    { key: 'Respiration', label: 'Breathing', options: ['Absent', 'Slow, irregular', 'Vigorous cry'] },
];
export type ApgarCriterionScores = { [key: string]: number; };
export const INITIAL_CRITERIA_SCORES: ApgarCriterionScores = APGAR_CRITERIA.reduce((acc, c) => ({ ...acc, [c.key]: 0 }), {});

// --- Algorithm Data Structure (Using the latest logic) ---
export const RESUSCITATION_STEPS: Record<StepId, ResuscitationStep> = {
  START: {
    title: "Begin NRP Resuscitation Log",
    timeRequired: 0,
    instruction: "Click the button below to start the timer (Time 0) when the baby is born. Enter optional patient data first.",
    actions: [
      { label: "Start Resuscitation Log", nextStep: 'INITIAL_ASSESSMENT', log: 'Resuscitation Log Initiated.' },
    ]
  },
  
  INITIAL_ASSESSMENT: {
    title: "Initial Assessment (Time 0)",
    timeRequired: 0,
    instruction: "Term? Good Tone? Breathing or Crying? Assess the baby's condition and choose the appropriate pathway. (Routine steps assumed if PPV is chosen.)",
    actions: [
      { label: "Routine Care (HR > 100, Good Tone)", nextStep: 'ROUTINE', log: 'Routine care indicated based on initial assessment.' },
      { label: "PPV Required (HR < 100 or Apneic)", nextStep: 'PPV_START', log: 'Initial steps performed and failed; proceeding directly to PPV.' },
    ]
  },
  
  PPV_START: {
    title: "PPV Initiation: Check Chest Rise",
    timeRequired: 30,
    instruction: "Start PPV (40-60 breaths/min). Apply SpO2 monitor. **Assess for chest rise after 15 seconds.**",
    actions: [
      { label: "Chest Rise Present", nextStep: 'PPV_EFFECTIVE_HR_ASSESSMENT', log: 'Effective ventilation confirmed by chest rise.' },
      { label: "No Chest Rise", nextStep: 'CORRECTIVE_MR', log: 'No chest rise observed. Initiating M.R. S.O.P.A corrective steps (Mask/Reposition).' },
    ]
  },
  
  CORRECTIVE_MR: {
    title: "Corrective Step 1: Mask Adjustment & Repositioning (M.R.)",
    timeRequired: 15,
    instruction: "Perform **M**ask adjustment and **R**epositioning. Reassess for chest rise. If HR is critically low (<60), bypass to compressions.",
    actions: [
        { label: "Effective PPV Started (Chest Rise Present)", nextStep: 'PPV_EFFECTIVE_HR_ASSESSMENT', log: 'M.R. successful, chest rise confirmed.' },
        { label: "Still No Chest Rise (Proceed to S.O.)", nextStep: 'CORRECTIVE_SO', log: 'M.R. attempted, proceeding to S.O. (Suction/Open Airway).' },
        { label: "HR < 60 (Bypass to Compressions)", nextStep: 'COMPRESSIONS_INITIATION', log: 'HR critical during M.R. attempt, proceeding to compressions/airway management.' },
    ]
  },

  CORRECTIVE_SO: {
    title: "Corrective Step 2: Suction & Open Airway (S.O.)",
    timeRequired: 15,
    instruction: "Perform **S**uction and **O**pen Airway (jaw thrust). Reassess for chest rise. If HR is critically low (<60), bypass to compressions.",
    actions: [
        { label: "Effective PPV Started (Chest Rise Present)", nextStep: 'PPV_EFFECTIVE_HR_ASSESSMENT', log: 'S.O. successful, chest rise confirmed.' },
        { label: "Still No Chest Rise (Proceed to P)", nextStep: 'CORRECTIVE_P', log: 'S.O. attempted, proceeding to P (Pressure Increase).' },
        { label: "HR < 60 (Bypass to Compressions)", nextStep: 'COMPRESSIONS_INITIATION', log: 'HR critical during S.O. attempt, proceeding to compressions/airway management.' },
    ]
  },

  CORRECTIVE_P: {
    title: "Corrective Step 3: Pressure Increase (P)",
    timeRequired: 15,
    instruction: "Increase **P**ressure. Reassess for chest rise. If HR is critically low (<60), bypass to compressions.",
    actions: [
        { label: "Effective PPV Started (Chest Rise Present)", nextStep: 'PPV_EFFECTIVE_HR_ASSESSMENT', log: 'P successful, chest rise confirmed.' },
        { label: "Still No Chest Rise (Proceed to A)", nextStep: 'CORRECTIVE_A', log: 'P attempted, proceeding to A (Alternate Airway).' },
        { label: "HR < 60 (Bypass to Compressions)", nextStep: 'COMPRESSIONS_INITIATION', log: 'HR critical during P attempt, proceeding to compressions/airway management.' },
    ]
  },

  CORRECTIVE_A: {
    title: "Corrective Step 4: Alternate Airway (A)",
    timeRequired: 15,
    instruction: "Secure **A**lternate Airway (LMA or ETT). Reassess for chest rise. If still ineffective, proceed immediately to compressions.",
    actions: [
        { label: "Effective PPV Started (Chest Rise Present)", nextStep: 'PPV_EFFECTIVE_HR_ASSESSMENT', log: 'A successful, chest rise confirmed with Alternate Airway.' },
        // Updated label
        { label: "Alternate Airway Failed (Initiate Compressions)", nextStep: 'COMPRESSIONS_INITIATION', log: 'Alternate Airway failed; proceeding directly to Chest Compressions.' },
    ]
  },
  
  PPV_EFFECTIVE_HR_ASSESSMENT: {
    title: "PPV Assessment: Physiological Response",
    timeRequired: 30,
    instruction: "Continue effective PPV. Assess **Heart Rate** after 30 seconds of PPV (from start or successful correction).",
    actions: [
      { label: "HR > 100 (Stop PPV, Monitor)", nextStep: 'POST_RESUSCITATION_CARE', log: 'HR > 100, successful response to PPV.' },
      { label: "HR 60-99 (Continue PPV)", nextStep: 'PPV_START', log: 'HR 60-99, continuing PPV and reassessment cycle.' },
      { label: "HR < 60 (Proceed to Compressions)", nextStep: 'COMPRESSIONS_INITIATION', log: 'HR < 60 despite effective ventilation, proceeding to compressions.' },
    ]
  },
  
  COMPRESSIONS_INITIATION: {
    title: "Chest Compressions (3:1 Ratio)",
    timeRequired: 60,
    instruction: "Intubate/Alternate Airway if not done. Start Chest Compressions (3:1 ratio). Increase O₂ to 100%. (60s window)",
    actions: [
      { label: "HR > 60", nextStep: 'POST_RESUSCITATION_CARE', log: 'HR > 60 after initiating compressions.' },
      { label: "HR < 60 (60s done)", nextStep: 'EPINEPHRINE', log: 'HR < 60 after 60s of compressions, prepare for Epinephrine.' },
    ]
  },
  EPINEPHRINE: {
    title: "Epinephrine Administration & Assessment",
    timeRequired: 60,
    instruction: "Administer Epinephrine. Continue PPV/Compressions. Assess HR after 60s. (Separate buttons below for dosing)",
    actions: [
      { label: "HR > 60", nextStep: 'POST_RESUSCITATION_CARE', log: 'HR > 60 after Epinephrine dose/cycle.' },
      { label: "Proceed to Volume Expansion/Other Causes", nextStep: 'VOLUME_EXPANSION', log: 'Considering Volume Expansion or other causes.' },
    ]
  },
  VOLUME_EXPANSION: {
    title: "Volume Expansion / Other Causes",
    timeRequired: 0,
    instruction: "Administer Volume Expander (10 mL/kg). Continue compressions and ventilation while treating other reversible causes (Pneumothorax).",
    actions: [
      { label: "HR > 60", nextStep: 'POST_RESUSCITATION_CARE', log: 'HR > 60 after volume expansion.' },
      { label: "HR < 60 (Return to Epinephrine)", nextStep: 'EPINEPHRINE', log: 'HR < 60, return to Epinephrine cycle/consider high-dose.' },
    ]
  },
  ROUTINE: {
    title: "Routine Care / Stabilization",
    timeRequired: 0,
    instruction: "Infant stays with mother. Warmth, monitor breathing, tone, and color.",
    actions: [{ label: "Finalize Log and View Report", nextStep: 'END', log: 'Routine care continued, Resuscitation Log ended.' }]
  },
  POST_RESUSCITATION_CARE: {
    title: "Post-Resuscitation Care",
    timeRequired: 0,
    instruction: "The baby is stabilized. Monitor closely. Prepare for transport/admission.",
    actions: [{ label: "Finalize Log and View Report", nextStep: 'END', log: 'Post-resuscitation care initiated, Resuscitation Log ended.' }]
  },
  END: {
    title: "Resuscitation Log View",
    timeRequired: 0,
    instruction: "The procedure is complete. Review and Print/Save PDF Log.",
    actions: [] as StepAction[]
  }
};

export const SPO2_TARGETS: [number, number][] = [
  [60, 65], // 1 minute
  [65, 70], // 2 minutes
  [70, 75], // 3 minutes
  [75, 80], // 4 minutes
  [80, 85], // 5 minutes
  [85, 95], // 10 minutes and beyond
];
