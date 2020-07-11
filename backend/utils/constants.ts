export const FIVE_MINUTES = 5 * 1000; 
export const FIFTEEN_MINUTES = FIVE_MINUTES * 3;
export const DAY = 24 * 60 * 60 * 1000;

export const stringToTimeframe = {
    "5m": FIVE_MINUTES,
    "15m": FIFTEEN_MINUTES, 
    "1d": DAY,
};