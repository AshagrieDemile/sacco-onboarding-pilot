const isDigit = (c) => c >= "0" && c <= "9";
export const digitsBefore = (value, idx) => {
    const stop = Math.min(idx, value.length);
    let n = 0;
    for (let i = 0; i < stop; i += 1)
        if (isDigit(value[i]))
            n += 1;
    return n;
};
export const caretAfterDigits = (value, n) => {
    if (n <= 0) {
        let i = 0;
        while (i < value.length && !isDigit(value[i]))
            i += 1;
        return i;
    }
    let seen = 0;
    for (let i = 0; i < value.length; i += 1) {
        if (isDigit(value[i])) {
            seen += 1;
            if (seen === n)
                return i + 1;
        }
    }
    return value.length;
};
export const regroupCaret = (oldValue, oldCaret, newValue) => caretAfterDigits(newValue, digitsBefore(oldValue, oldCaret));
