export const Mutate = <T>(obj: T): T => {
    try {
        return structuredClone(obj);
    } catch (error) {
        // Fallback for objects that structuredClone can't handle (e.g., functions, DOM nodes)
        return JSON.parse(JSON.stringify(obj));
    }
}
