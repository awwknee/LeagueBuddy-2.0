interface Account {
    username: string,
    password: string,
    displayName?: string,
    displayTag?: string
    id?: number,
    level?: number,
    profile_image_url?: string,
    puuid?: string,
    solo_queue?: SoloQueue,
    wallet?: Wallet,
    backdrop?: string,
}

interface SoloQueue {
    division: number,
    lp: number,
    tier: string,
    tier_image_url: string
}

interface Wallet {
    blue_essence: number,
    riot_points: number
}

export default Account