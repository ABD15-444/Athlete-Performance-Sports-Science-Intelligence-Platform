// Sports Science AI Intelligence Engine
// Implements sports science readiness algorithms, acute fatigue risk prediction,
// overtraining detection, and natural language recommendations.

/**
 * Computes AI readiness score based on sports science weightings.
 * Research foundations:
 * - Sleep quality (30%): nocturnal hormonal restoration and glycogen resynthesis
 * - Heart Rate Variability (25%): vagal autonomic tone (parasympathetic vs sympathetic)
 * - Fatigue index inverted (25%): self-reported neuromuscular perception
 * - Hydration level (20%): cardiovascular drift attenuation and cellular blood volume
 */
export function calculateReadinessScore({
  sleep_score,
  hrv_ms,
  fatigue_score,
  hydration_pct,
  active_injury_penalty = 0,
}) {
  const sleep = Math.max(0, Math.min(100, Number(sleep_score) || 0));
  const hrv = Math.min(100, Math.max(0, Number(hrv_ms) || 0));
  const fatigue = Math.max(0, Math.min(10, Number(fatigue_score) || 0));
  const hydration = Math.max(0, Math.min(100, Number(hydration_pct) || 0));

  // Weighted base score
  const baseScore =
    sleep * 0.3 +
    hrv * 0.25 +
    (10 - fatigue) * 10 * 0.25 +
    hydration * 0.2;

  // Apply injury penalty and clamp to [0, 100]
  const finalScore = Math.max(0, Math.min(100, baseScore - active_injury_penalty));
  return Math.round(finalScore * 100) / 100;
}

/**
 * Predicts injury vulnerability and flags early-warning overtraining indicators
 * using Acute-to-Chronic workload concepts and biometric divergence.
 */
export function generateSportsScienceInsights(athlete, recentLogs = []) {
  const readiness = athlete.readiness?.readiness_score
    ? parseFloat(athlete.readiness.readiness_score)
    : 0;
  const hrv = athlete.readiness?.hrv_ms ? parseFloat(athlete.readiness.hrv_ms) : 0;
  const fatigue = athlete.readiness?.fatigue_score ? parseFloat(athlete.readiness.fatigue_score) : 0;
  const sleep = athlete.readiness?.sleep_score ? parseFloat(athlete.readiness.sleep_score) : 0;
  const activeInjuries = athlete.injury_records?.filter((i) => i.status === 'Active') || [];

  const insights = [];

  // 1. Injury Status
  if (activeInjuries.length > 0) {
    const worst = activeInjuries[0];
    insights.push({
      type: 'critical',
      tag: 'INJURY PENALTY APPLIED',
      title: `Active ${worst.severity} ${worst.injury_type}`,
      message: `Automatic database penalty of ${
        worst.severity === 'Severe' ? '-40' : worst.severity === 'Moderate' ? '-20' : '-10'
      } points applied to AI readiness score. Full contact drills prohibited.`,
    });
  }

  // 2. Autonomic Nervous System & HRV Analysis
  if (hrv < 55) {
    insights.push({
      type: 'warning',
      tag: 'PARASYMPATHETIC SUPPRESSION',
      title: 'Suppressed Autonomic Tone (HRV < 55ms)',
      message: 'Vagal tone is significantly depressed, suggesting incomplete central nervous system recovery. High-velocity sprinting or plyometrics should be rescheduled.',
    });
  } else if (hrv > 85) {
    insights.push({
      type: 'positive',
      tag: 'SUPERCOMPENSATION DETECTED',
      title: 'Elevated HRV Reserve (> 85ms)',
      message: 'Cardiac parasympathetic nervous system is primed. Athlete is capable of absorbing maximum training loads and speed outputs today.',
    });
  }

  // 3. Sleep & Fatigue Divergence
  if (fatigue > 7.0 && sleep < 60) {
    insights.push({
      type: 'critical',
      tag: 'ACUTE OVERTRAINING RISK',
      title: 'Neuroendocrine Fatigue Warning',
      message: `Fatigue is elevated (${fatigue}/10) coupled with deficient restorative sleep (${sleep}%). Cellular muscle recovery is compromised. Recommend active recovery or mobility session.`,
    });
  }

  // 4. Trend Analysis across last 7 days
  if (recentLogs.length >= 3) {
    const firstThreeAvgFatigue =
      recentLogs.slice(0, 3).reduce((acc, l) => acc + (parseFloat(l.fatigue_score) || 0), 0) / 3;
    if (firstThreeAvgFatigue > 6.5) {
      insights.push({
        type: 'warning',
        tag: 'CHRONIC FATIGUE ACCUMULATION',
        title: '3-Day Rolling Fatigue Trend',
        message: 'Athlete has maintained elevated fatigue (>6.5) over multiple consecutive days. Micro-cycle deload recommended to prevent non-functional overreaching.',
      });
    }
  }

  // 5. Training Prescription Recommendation
  let trainingPrescription = '';
  if (readiness >= 75) {
    trainingPrescription = 'Prescription: FULL CLEARANCE. Cleared for high-intensity intervals, max strength, and full team scrimmages.';
  } else if (readiness >= 50) {
    trainingPrescription = 'Prescription: MODIFIED LOAD. Limit explosive plyometrics. Focus on technical skill work and aerobic zone 2 volume.';
  } else {
    trainingPrescription = 'Prescription: ACTIVE REST / REHAB. Low-impact mobility, hydrotherapy, and physical therapy evaluation required.';
  }

  return {
    readiness,
    insights,
    trainingPrescription,
  };
}
