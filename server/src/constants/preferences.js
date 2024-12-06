const PREFERENCE_WEIGHTS = {
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
    UNAVAILABLE: 0
};

const TIME_OF_DAY_WEIGHTS = {
    MORNING: 3,    // Slots 1-3
    MIDDAY: 2,     // Slots 4-6
    AFTERNOON: 1   // Slots 7-9
};

module.exports = {
    PREFERENCE_WEIGHTS,
    TIME_OF_DAY_WEIGHTS
};