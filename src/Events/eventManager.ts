import SteamUser, { EFriendRelationship } from 'steam-user'
import SteamCommunity from 'steamcommunity'
import { getSteamId, getTwoFactorCode } from '../util'
import { CommandManager } from '../Commands/commandManager'
import type SteamID = require('steamid')
import { BotConfig } from '../config/botConfig'

export class EventManager {
  private readonly client: SteamUser
  private readonly tradeOfferManager: any
  private readonly steamCommunity: SteamCommunity
  private readonly commandManager: CommandManager
  private readonly botConfig: BotConfig
  private steamID64?: string = undefined

  constructor(client: SteamUser, tradeOfferManager: any, steamCommunity: SteamCommunity, botConfig: BotConfig) {
    this.client = client
    this.tradeOfferManager = tradeOfferManager
    this.steamCommunity = steamCommunity
    this.botConfig = botConfig
    this.commandManager = new CommandManager(this.client, this.tradeOfferManager, this.steamCommunity)
  }

  async run() {
    this.client.on('loggedOn', (details: Record<string, any>) => {
      this._loggedOnClient(details)
    })

    this.client.on('error', (error) => {
      console.log(error)
    })

    this.client.on('webSession', (sessionid: string, cookies: string[]) => {
      this._webSession(sessionid, cookies)
    })

    this.tradeOfferManager.on('newOffer', (offer: any) => {
      this._newOffer(offer)
    })

    this.client.on('friendRelationship', (steamID: SteamID, relationship: EFriendRelationship) => {
      this._friendRelationship(steamID, relationship)
    })

    this.client.on('disconnected', (error: SteamUser.EResult, message?: string) => {
      console.log(`disconnected by error ${error} - message: ${message}`)
      console.log('trying to login again')
      this._clientLogin()
    })

    this.client.on('newItems', (count: number) => {
      console.log(`${count} new items received`)
    })

    this.steamCommunity.on('chatMessage', (user: SteamID, text: string) => {
      this._chatMessage(user, text)
    })

    this._clientLogin()
    await this._communityLogin()
  }

  private _clientLogin() {
    console.log('logging to ', this.botConfig.login)
    this.client.logOn({
      accountName: this.botConfig.login,
      password: this.botConfig.password,
      twoFactorCode: getTwoFactorCode(this.botConfig.sharedSecret)
    })
    console.log('logged to steam client')
  }

  private async _communityLogin() {
    await this.steamCommunity.login({
      accountName: this.botConfig.login,
      password: this.botConfig.password,
      twoFactorCode: getTwoFactorCode(this.botConfig.sharedSecret)
    }, (error: SteamCommunity.CallbackError) => {
      if (error) {
        console.log(error)
      } else {
        console.log('logged to steam community')
      }
    })
  }

  private _loggedOnClient(details: Record<string, any>) {
    this.steamID64 = details?.client_supplied_steamid
    console.log(`Logged on SteamID ${this.steamID64}`)
    this.client.setPersona(SteamUser.EPersonaState.Online)
  }

  private _webSession(sessionId: string, cookies: string[]) {
    console.log('started sessionId: ', sessionId)
    this.tradeOfferManager.setCookies(cookies)
    this.steamCommunity.setCookies(cookies)
    this.steamCommunity.startConfirmationChecker(10000, getTwoFactorCode(this.botConfig.sharedSecret))
  }

  private _newOffer(offer: any) {
    if (offer.itemsToGive.length === 0) {
      offer.accept((err: any, status: any) => {
        if (err) {
          console.log(err)
        } else {
          console.log(`donation accepted - ${status}`)
        }
      })
    } else {
      console.log(`received trade offer ${offer.id} from ${offer.partner.getSteamID64()}`)
      if (this.botConfig.allowedSteamIds?.includes(offer.partner.getSteamID64())) {
        offer.accept((err: any, status: any) => {
          if (err) {
            console.log(err)
          } else {
            console.log(`accpeting offer ${offer.id} - ${status}.`)
          }
        })
      } else {
        console.log(`ignoring offer ${offer.id} from ${offer.partner.getSteamID64()}`)
      }
    }
  }

  private _friendRelationship(steamID: SteamID, relationship: EFriendRelationship) {
    if (relationship === 2) {
      if (this.botConfig.friendList?.includes(String(getSteamId(steamID)))) {
        this.client.addFriend(steamID)
      }
    }
    console.log(`relationship: ${relationship} - steamid: ${getSteamId(steamID)}`)
  }

  private _chatMessage(steamID: SteamID, message: string) {
    if (this.botConfig.allowedSteamIds?.includes(steamID.getSteamID64()) || this.botConfig.ownerSteam === steamID.getSteamID64()) {
      if (message.startsWith('!')) {
        message = message.substring(1)
        const command = message.split(' ')
        this.commandManager.handleCommand(command)
      }
    }
  }

  // private _addFriend() {
  //   this.steamCommunity.addFriend('steamID', (error: SteamCommunity.CallbackError) => {

  //   })
  // }

}
