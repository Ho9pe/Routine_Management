const determineCourseType = (courseCode, courseName) => {
    const codeNumber = courseCode.split('-')[1];
    const lastDigit = parseInt(codeNumber[3]);
    const isEven = lastDigit % 2 === 0;
    const endsWithZero = lastDigit === 0;
    const nameIncludes = (str) => courseName.toLowerCase().includes(str.toLowerCase());

    if (endsWithZero) {
        if (nameIncludes('thesis')) {
            return 'thesis';
        } else if (nameIncludes('project')) {
            return 'project';
        }
    }
    
    return isEven ? 'sessional' : 'theory';
};

module.exports = {
    determineCourseType
};