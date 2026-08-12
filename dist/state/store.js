export const createStore = (initial) => {
    let state = initial;
    const listeners = new Set();
    const emit = () => {
        for (const fn of listeners)
            fn(state);
    };
    return {
        get: () => state,
        set: (patch) => {
            state = { ...state, ...patch };
            emit();
        },
        setDraft: (fieldId, value, rerender = false) => {
            const draft = { ...state.draft };
            if (value === undefined)
                delete draft[fieldId];
            else
                draft[fieldId] = value;
            state = { ...state, draft };
            if (rerender)
                emit();
        },
        resetStage: () => {
            state = { ...state, draft: {}, errors: [] };
            emit();
        },
        subscribe: (fn) => {
            listeners.add(fn);
            return () => listeners.delete(fn);
        },
    };
};
