import { crisisTeamGpsHints, crisisTeamOptions, type CrisisTeamOption } from '../data/crisisTeams'

const toRadians = (value: number) => (value * Math.PI) / 180

const distanceInKilometres = (latitude: number, longitude: number, hint: { latitude: number; longitude: number }) => {
  const earthRadius = 6371
  const latitudeDelta = toRadians(hint.latitude - latitude)
  const longitudeDelta = toRadians(hint.longitude - longitude)
  const originLatitude = toRadians(latitude)
  const hintLatitude = toRadians(hint.latitude)
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(originLatitude) * Math.cos(hintLatitude) * Math.sin(longitudeDelta / 2) ** 2

  return earthRadius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

export const nearestCrisisTeam = (latitude: number, longitude: number, maximumDistanceKm = 250): CrisisTeamOption | undefined => {
  let nearest: { option: CrisisTeamOption; distanceKm: number } | undefined

  for (const option of crisisTeamOptions) {
    const hint = crisisTeamGpsHints[option.id]
    if (!hint) {
      continue
    }

    const distanceKm = distanceInKilometres(latitude, longitude, hint)
    if (!nearest || distanceKm < nearest.distanceKm) {
      nearest = { option, distanceKm }
    }
  }

  return nearest && nearest.distanceKm <= maximumDistanceKm ? nearest.option : undefined
}
