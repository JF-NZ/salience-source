// Release builds keep these sensitive pathways out of the shipped experience by default.
// Development and review builds retain access, and a release can opt in explicitly.
const explicitlyEnabled = (value: string | undefined) => value === 'true'

export const featureFlagsFor = ({
  isDevelopment,
  enableTreatment,
  enableSubstanceTracking,
  enableMedication,
}: {
  isDevelopment: boolean
  enableTreatment?: string
  enableSubstanceTracking?: string
  enableMedication?: string
}) => ({
  treatment: isDevelopment || explicitlyEnabled(enableTreatment),
  substanceTracking: isDevelopment || explicitlyEnabled(enableSubstanceTracking),
  medication: isDevelopment || explicitlyEnabled(enableMedication),
})

export const featureFlags = featureFlagsFor({
  isDevelopment: import.meta.env.DEV,
  enableTreatment: import.meta.env.VITE_ENABLE_TREATMENT,
  enableSubstanceTracking: import.meta.env.VITE_ENABLE_SUBSTANCE_TRACKING,
  enableMedication: import.meta.env.VITE_ENABLE_MEDICATION,
})
