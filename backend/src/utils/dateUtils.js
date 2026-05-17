export const startOfUtcDay = (date = new Date()) => {
    return new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate()
    ));
};

export const isSameUtcDay = (firstDate, secondDate) => {
    return startOfUtcDay(firstDate).getTime() === startOfUtcDay(secondDate).getTime();
};

export const daysBetweenInclusive = (startDate, endDate = new Date()) => {
    const start = startOfUtcDay(startDate);
    const end = startOfUtcDay(endDate);
    const diffInMs = end.getTime() - start.getTime();

    return Math.max(Math.floor(diffInMs / 86400000) + 1, 1);
};

export const weeksBetweenInclusive = (startDate, endDate = new Date()) => {
    return Math.max(Math.ceil(daysBetweenInclusive(startDate, endDate) / 7), 1);
};
