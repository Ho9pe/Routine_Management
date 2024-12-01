const TIME_SLOTS = [
    { id: '1', period: '1st', time: '8:00-8:50 AM' },
    { id: '2', period: '2nd', time: '8:50-9:40 AM' },
    { id: '3', period: '3rd', time: '9:40-10:30 AM' },
    // Break
    { id: '4', period: '4th', time: '10:50-11:40 AM' },
    { id: '5', period: '5th', time: '11:40-12:30 PM' },
    { id: '6', period: '6th', time: '12:30-1:20 PM' },
    // Break
    { id: '7', period: '7th', time: '2:30-3:20 PM' },
    { id: '8', period: '8th', time: '3:20-4:10 PM' },
    { id: '9', period: '9th', time: '4:10-5:00 PM' }
];

const WORKING_DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];

module.exports = { TIME_SLOTS, WORKING_DAYS };