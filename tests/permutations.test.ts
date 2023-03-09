import { permutationsOf } from '../src/utils/permutations'

describe('Generating permutations from an array of unique values', () => {

    describe('permutations of one value', () => {
        const values = [1, 2, 3, 4]
        const perms = permutationsOf<number>(values, 1)

        it('is the right size', () => expect(perms.length).toBe(4))

        it('contains the right values', () => {
            expect(perms).toContainEqual([1])
            expect(perms).toContainEqual([2])
            expect(perms).toContainEqual([3])
            expect(perms).toContainEqual([4])
        })
    })

    describe('permutations of up to two values', () => {
        const values = [1, 2, 3, 4]
        const perms = permutationsOf<number>(values, 2)

        it('is the right size', () => expect(perms.length).toBe(16))

        it('contains the right values', () => {
            // 4 permutations of size 1:
            expect(perms).toContainEqual([1])
            expect(perms).toContainEqual([2])
            expect(perms).toContainEqual([3])
            expect(perms).toContainEqual([4])
            // plus 12 permutations of size 2:
            expect(perms).toContainEqual([1, 2])
            expect(perms).toContainEqual([1, 3])
            expect(perms).toContainEqual([1, 4])
            expect(perms).toContainEqual([2, 1])
            expect(perms).toContainEqual([2, 3])
            expect(perms).toContainEqual([2, 4])
            expect(perms).toContainEqual([3, 1])
            expect(perms).toContainEqual([3, 2])
            expect(perms).toContainEqual([3, 4])
            expect(perms).toContainEqual([4, 1])
            expect(perms).toContainEqual([4, 2])
            expect(perms).toContainEqual([4, 3])
        })

        it('does not contain duplicates', () => {
            expect(perms).not.toContainEqual([1, 1])
            expect(perms).not.toContainEqual([2, 2])
            expect(perms).not.toContainEqual([3, 3])
            expect(perms).not.toContainEqual([4, 4])
        })
    })

    describe('permutations without explicit size limit', () => {
        const values = [1, 2, 3]
        const perms = permutationsOf<number>(values)

        it('defaults to the number of unique values available', () => {
            expect(perms.length).toBe(15)
            // 3 permutations of size 1:
            expect(perms).toContainEqual([1])
            expect(perms).toContainEqual([2])
            expect(perms).toContainEqual([3])
            // plus 6 permutations of size 2:
            expect(perms).toContainEqual([1, 2])
            expect(perms).toContainEqual([1, 3])
            expect(perms).toContainEqual([2, 1])
            expect(perms).toContainEqual([2, 3])
            expect(perms).toContainEqual([3, 1])
            expect(perms).toContainEqual([3, 2])
            // plus 6 permutations of size 3:
            expect(perms).toContainEqual([1, 2, 3])
            expect(perms).toContainEqual([1, 3, 2])
            expect(perms).toContainEqual([2, 1, 3])
            expect(perms).toContainEqual([2, 3, 1])
            expect(perms).toContainEqual([3, 1, 2])
            expect(perms).toContainEqual([3, 2, 1])
        })
    })

    describe('permutations with an explicit size limit higher than number of unique items', () => {
        const values = [1, 2]
        const perms = permutationsOf<number>(values, 3)

        it('is coerced to the number of unique values available', () => {
            expect(perms.length).toBe(4)
            // 2 permutations of size 1:
            expect(perms).toContainEqual([1])
            expect(perms).toContainEqual([2])
            // plus 6 permutations of size 2:
            expect(perms).toContainEqual([1, 2])
            expect(perms).toContainEqual([2, 1])
        })
    })

    describe('permutations with a large explicit size limit', () => {
        const generateNumbers = (count: number): number[] => {
            let array: number[] = []
            for (let i = 1; i <= count; i++) {
                array.push(i)
            }
            return array
        }

        it('are coerced to a built-in maximum of 5 (for performance reasons)', () => {
            const values = generateNumbers(5)
            const permsOf3 = permutationsOf<number>(values, 3)
            const permsOf4 = permutationsOf<number>(values, 4)
            const permsOf5 = permutationsOf<number>(values, 5)
            const permsOf6 = permutationsOf<number>(values, 6)
            const permsOf7 = permutationsOf<number>(values, 7)
            expect(permsOf4.length).not.toBe(permsOf3.length)
            expect(permsOf5.length).not.toBe(permsOf4.length)
            expect(permsOf6.length).toBe(permsOf5.length)
            expect(permsOf7.length).toBe(permsOf5.length)
        })
    })
})
