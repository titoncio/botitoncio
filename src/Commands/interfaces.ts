export interface LootInterface {
  steamID: string
  appid: string
  contextId: string
}

export interface UpdateAvatarInterface {
  steamID: string
  imageUrl: string
}

export interface AppDrop {
  appid: number,
  name: string,
  drops: number,
  playtime: number
}
