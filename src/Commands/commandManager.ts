import SteamUser from 'steam-user'
import SteamCommunity from 'steamcommunity'
import { LootInterface, UpdateAvatarInterface, AppDrop } from './interfaces'
import { Logger } from '../Logger/loggerManager'

export class CommandManager {
  private readonly client: SteamUser
  private readonly tradeOfferManager: any
  private readonly steamCommunity: SteamCommunity
  private readonly steamAppID: string = '753'
  private readonly steamAppContext: string = '6'

  constructor(client: SteamUser, tradeOfferManager: any, steamCommunity: SteamCommunity) {
    this.client = client
    this.tradeOfferManager = tradeOfferManager
    this.steamCommunity = steamCommunity
    }

  handleCommand(message: string[]) {
    const command = message.shift()
    switch (command) {
      case 'loot':
        if ((message.length !>= 1 && message.length !<= 3) || message?.length == 2) {
          this.handleInvalidArgs(command, message)
          break
        }
        this.loot({
          steamID: message[0]!,
          appid: message[1] ?? this.steamAppID,
          contextId: message[2] ?? this.steamAppContext
        })
        break
      case 'updateAvatar':
        if (message.length !== 2) {
          this.handleInvalidArgs(command, message)
          break
        }
        this.updateAvatar({
          steamID: message[0]!,
          imageUrl: message[1]!
        })
        break
      case 'loadBadges':
        if (message.length !== 0) {
          this.handleInvalidArgs(command, message)
          break
        }
        this.loadBadges()
        break
      default:
        break
    }
  }

  private handleInvalidArgs(command: string, args: string[]) {
    Logger.info('CommandManager', 'handleCommand', `Wrong command arguments. Command received: ${command} - Arguments received: `, args)
  }

  private loot(data: LootInterface) {
    this.tradeOfferManager.loadInventory(data.appid, data.contextId, true, (err: any, inventory: any[]) => {
      if (err) {
        console.log(err)
      } else {
        const offer = this.tradeOfferManager.createOffer(data.steamID)
        inventory.forEach(item => {
          offer.addMyItem(item)
        })
        offer.setMessage(`sending trade via titonciobot`)
        offer.send((err: any, status: any) => {
          if (err) {
            console.log(err)
          } else {
            console.log(`ent offer - ${status}`)
          }
        })
      }
    })
  }

  private updateAvatar(data: UpdateAvatarInterface) {
    this.steamCommunity.uploadAvatar(data.imageUrl, undefined, (error: SteamCommunity.CallbackError, url: string) => {
      if (error) {
        console.log(error)
        return
      }
      this.client.chat.sendFriendMessage(data.steamID, url)
    })
  }

  private loadBadges(page: number = 1, apps: AppDrop[] = [], retry: number = 0) { //Implements pending cards

    Logger.debug('commandManager', 'loadBadges', 'Checking badges page ' + page + '...')

    this.steamCommunity.httpRequest('https://steamcommunity.com/my/badges/?l=english&p=' + page, (err: SteamCommunity.CallbackError, response: any, body: any) => {
        if (err || response.statusCode !== 200) {
            if (retry < 5) {
                Logger.warn('commandManager', 'loadBadges', 'Error updating badges page: ' + (err || 'HTTP' + response.statusCode) + ', retrying...')
                setTimeout(() => {
                    this.loadBadges(page, apps, retry + 1)
                }, (Math.random() * 10 + 5) * 1000)
            } else {
                Logger.warn('commandManager', 'loadBadges', 'Error updating badges page: ' + (err || 'HTTP' + response.statusCode) + ', aborting!')
            }
              return
        }

        const Cheerio = require('cheerio')

        const $ = Cheerio.load(body)

        if ($('#loginForm').length) {
            Logger.warn('commandManager', 'loadBadges', 'Cannot load badges page - not logged in! Requesting new session...')
            return this.client.webLogOn()
        }

        Logger.debug('commandManager', 'loadBadges', 'Badges page ' + page + ' loaded...')

        $('.badge_row').each(() => {
            const row = $(this)

            const overlay = row.find('.badge_row_overlay')
            if (!overlay) {
                return
            }

            const match = overlay.attr('href').match(/\/gamecards\/(\d+)/)
            if (!match) {
                return
            }

            const appid = parseInt(match[1], 10)

            let name = row.find('.badge_title')
            name.find('.badge_view_details').remove()
            name = name.text().replace(/\n/g, '').replace(/\r/g, '').replace(/\t/g, '').trim()

            let drops = row.find('.progress_info_bold').text().match(/(\d+) card drops? remaining/)
            if (!drops) {
                return
            }

            drops = parseInt(drops[1], 10)
            if (isNaN(drops) || drops === 0) {
                Logger.debug('commandManager', 'loadBadges', appid + ': Can\'t parse cards!')
                return
            }

            let playtime = row.find('.badge_title_stats').html().match(/(\d+\.\d+) hrs on record/)
            if (!playtime) {
                playtime = 0.0
            } else {
                playtime = parseFloat(playtime[1]/*, 10*/)
                if (isNaN(playtime)) {
                    playtime = 0.0
                }
            }

            apps.push({
                appid,
                name: name,
                drops: drops,
                playtime: playtime
            })
            console.log('###################')
            console.log(JSON.stringify(apps))
        })

        const pagelinks = $('.pageLinks').first()
        if (pagelinks.html() === null) {
            return
        }

        pagelinks.find('.pagebtn').each(() => {
            const button = $(this)
            if (button.text() === '>') {
                if (button.hasClass('disabled')) {
                    return apps
                } else {
                    return this.loadBadges(page + 1, apps)
                }
            }
        })
    })
  }
}
