export const EDUCATION_LEVEL_BY_GRADE = {
    "grade-1": "primary",
    "grade-2": "primary",
    "grade-3": "primary",
    "grade-4": "primary",
    "grade-5": "primary",
    "grade-6": "primary",
    "grade-7": "junior-secondary",
    "grade-8": "junior-secondary",
    "grade-9": "secondary",
    "grade-10": "secondary",
    "grade-11": "secondary",
    "grade-12": "secondary",
    "grade-12-plus-1-cert": "cert-tech-voc",
    "teacher-training-cert": "cert-tech-voc",
    "cert-10-plus-1": "cert-tech-voc",
    "level-2-voc": "cert-tech-voc",
    "cert-10-plus-2": "cert-tech-voc",
    "level-3-1yr": "cert-tech-voc",
    "level-3-2yr": "cert-tech-voc",
    "diploma": "cert-tech-voc",
    "college-1": "higher",
    "college-2": "higher",
    "college-3": "higher",
    "bachelor": "higher",
    "above-bachelor": "higher",
    "informal-read-write": "informal",
    "informal-nonregular": "informal",
    "adult-literacy": "informal",
};
export const deriveEducationLevel = (highestGrade) => {
    if (typeof highestGrade !== "string" || highestGrade === "")
        return undefined;
    return EDUCATION_LEVEL_BY_GRADE[highestGrade];
};
