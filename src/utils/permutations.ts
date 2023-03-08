
export function permutationsOf<T>(items: T[], size?: number): T[][] {
    function * generatePermutations<T>(items: T[], count: number) {
        for (let i = 0; i < items.length; i++) {
            let firstItem = items[i]
            if (count === 1) {
                yield [firstItem];
            } else {
                let otherItems = items.slice(i+1, items.length).concat(items.slice(0, i))
                let otherPermutations: any = generatePermutations<T>(otherItems, count - 1)
                for (let perms of otherPermutations) {
                    yield [ firstItem, ...perms ]
                }
            }
        }
    }
    const result: T[][] = []
    const maxPermutations = size || items.length  // Math.min(4, size || items.length)
    for (let i = 1; i <= maxPermutations && i <= items.length; i++) {
        for (const combo of generatePermutations(items, i)) {
            result.push(combo)
        }
    }
    return result
}
