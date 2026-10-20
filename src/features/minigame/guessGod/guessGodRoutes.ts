export const GUESS_GOD_PATH = '/minigame/guess-god'
export const GUESS_GOD_PLAY_PATH = `${GUESS_GOD_PATH}/play`

/** Only the score goes in the link - no answers, ids or other saved data. */
export const guessGodResultPath = (score: number) => `${GUESS_GOD_PATH}/result/${score}`
