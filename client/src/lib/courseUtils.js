export const getSemesterFromCourseCode = (courseCode) => {
    if (!courseCode) return null;
    const match = courseCode.match(/[A-Z]+-(\d{2})\d{2}/);
    if (!match) return null;
    const yearSemester = match[1];
    const mapping = {
        '11': 1,
        '12': 2,
        '21': 3,
        '22': 4,
        '31': 5,
        '32': 6,
        '41': 7,
        '42': 8
    };
    return mapping[yearSemester] || null;
};