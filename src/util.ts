import SteamTotp from 'steam-totp'
import SteamID from 'steamid'

export function getTwoFactorCode(sharedSecret: string): string {
  return SteamTotp.generateAuthCode(sharedSecret)
}

export function getSteamId(steamID: SteamID): string {
  return steamID.getSteamID64()
}