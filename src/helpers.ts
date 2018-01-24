
export const diff: <T>(a: T[], b: T[]) => T[] =
    (a, b) => a.filter((x) => !b.includes(x));

export const head: <T>(e: T[]) => T =
    (e) => e[0];

export const size: <T>(e: T[]) => number =
    (e) => e.length;

// tslint:disable-next-line:no-any
export const allLengthOf: (o: any, p: string[], n: number) => boolean =
    (o, params, length) =>
        size(params.filter((e: string) => o[e] && o[e].toString().length >= length)) === size(params);
