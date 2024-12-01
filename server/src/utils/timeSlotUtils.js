const { TIME_SLOTS, WORKING_DAYS } = require('../constants/timeSlots');

const isValidTimeSlot = (slotId) => {
    return TIME_SLOTS.some(slot => slot.id === slotId);
};

const isValidDay = (day) => {
    return WORKING_DAYS.includes(day);
};

const getTimeSlotDetails = (slotId) => {
    return TIME_SLOTS.find(slot => slot.id === slotId);
};

module.exports = {
    isValidTimeSlot,
    isValidDay,
    getTimeSlotDetails
};