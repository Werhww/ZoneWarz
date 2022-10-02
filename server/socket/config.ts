export default {
    ZoneEliminationTime: 20000,
    PositionTimeout: 10000,
    ZoneShrinkInterval: 2000,
    ZoneShrinkAmount: 0.1,
    MinZoneRadius: 10,
    MaxZoneRadius: 1000,

    // One Hour
    MaxGameDuration: 3_600_000 * 1,

    GameTickRate: 1000,
    PlayerTickRate: 1000,
    
    messages: {
        UsernameTaken: "Username is taken.",
        KickTimeout: "U have beed kicked due to timeout.",
        KickByHost: "U have been kicked by the host.",

        //! Match radius with config
        GameZoneToLarge: "Max zone radius is 1000M",

        GameEnded: "Game has ended. If there is any hiders left thay won.",
        GameNotFoud: "Game not found."
    }
}