export interface BotConfig {
  login: string
  password: string
  sharedSecret: string
  language?: string
  ownerSteam?: string
  allowedSteamIds?: string[]
  friendList?: string[]
}