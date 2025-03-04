export const semesterToYear = (semester) => {
    const mapping = {
        1: '1st Year Odd (1-1)',
        2: '1st Year Even (1-2)',
        3: '2nd Year Odd (2-1)',
        4: '2nd Year Even (2-2)',
        5: '3rd Year Odd (3-1)',
        6: '3rd Year Even (3-2)',
        7: '4th Year Odd (4-1)',
        8: '4th Year Even (4-2)'
    };
    return mapping[semester] || semester;
};
export const yearToSemester = (year) => {
    const mapping = {
        '1st Year Odd (1-1)': 1,
        '1st Year Even (1-2)': 2,
        '2nd Year Odd (2-1)': 3,
        '2nd Year Even (2-2)': 4,
        '3rd Year Odd (3-1)': 5,
        '3rd Year Even (3-2)': 6,
        '4th Year Odd (4-1)': 7,
        '4th Year Even (4-2)': 8
    };
    return mapping[year] || year;
};
export const semesterOptions = [
    { value: 1, label: '1st Year Odd (1-1)' },
    { value: 2, label: '1st Year Even (1-2)' },
    { value: 3, label: '2nd Year Odd (2-1)' },
    { value: 4, label: '2nd Year Even (2-2)' },
    { value: 5, label: '3rd Year Odd (3-1)' },
    { value: 6, label: '3rd Year Even (3-2)' },
    { value: 7, label: '4th Year Odd (4-1)' },
    { value: 8, label: '4th Year Even (4-2)' }
];