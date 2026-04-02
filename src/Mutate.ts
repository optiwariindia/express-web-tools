export function Mutate<T>(data: T): T {
    return JSON.parse(JSON.stringify(data));
}