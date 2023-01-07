import SteamUser from 'steam-user'
import { EventManager } from '../Events/eventManager'
import SteamCommunity from 'steamcommunity'
const TradeOfferManager = require('steam-tradeoffer-manager')
import { BotConfig } from '../config/botConfig'

export class Bot {
  private readonly client: SteamUser
  private readonly eventManager: EventManager
  private readonly steamCommunity: SteamCommunity
  private readonly tradeOfferManager: any

  constructor(botConfig: BotConfig) {
    this.client = new SteamUser()
    this.steamCommunity = new SteamCommunity()
    this.tradeOfferManager = new TradeOfferManager({
      steam: this.client,
      community: this.steamCommunity,
      language: botConfig.language || 'pt-BR'
    })
    this.eventManager = new EventManager(this.client, this.tradeOfferManager, this.steamCommunity, botConfig)
  }

  async run() {
    await this.eventManager.run()
  }

}
