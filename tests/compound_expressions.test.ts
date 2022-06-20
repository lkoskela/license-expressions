import {parseSpdxExpression as parse} from '../src'

describe('Compound expressions (e.g. dual licensing scenarios)', () => {

    describe('with leading/trailing whitespace', () => {
        it('are trimmed of leading/trailing whitespace around identifiers', () => {
            expect(parse(' \t \n GPL-3.0 OR  \t Apache-2.0 \n')).toStrictEqual({
                'conjunction': 'or',
                'left': { license: 'GPL-3.0' },
                'right': { license: 'Apache-2.0' }
            })
        })

        it('are trimmed of leading/trailing whitespace inside and outside parenthesis', () => {
            expect(parse(' \t \n( GPL-3.0 OR  \t Apache-2.0 \n)\t ')).toStrictEqual({
                'conjunction': 'or',
                'left': { license: 'GPL-3.0' },
                'right': { license: 'Apache-2.0' }
            })
        })
    })

    describe('with two elements', () => {

        describe('yields an "OR" conjunction with correct left and right expressions', () => {
            [['GPL-3.0', 'MIT'], ['BSD-2-Clause', 'Apache-2.0']].forEach(pairing => {
                const left = pairing[0]
                const right = pairing[1]
                const expression = `${left} OR ${right}`
                it(expression, () => {
                    expect(parse(expression)).toStrictEqual({
                        'conjunction': 'or',
                        'left': { license: left },
                        'right': { license: right }
                    })
                })
            })
        })

        describe('yields an "AND" conjunction with correct left and right expressions', () => {
            [['GPL-3.0', 'MIT'], ['BSD-3-Clause', 'Apache-2.0']].forEach(pairing => {
                const left = pairing[0]
                const right = pairing[1]
                const expression = `${left} AND ${right}`
                it(expression, () => {
                    expect(parse(expression)).toStrictEqual({
                        'conjunction': 'and',
                        'left': { license: left },
                        'right': { license: right }
                    })
                })
            })
        })

        describe('can have parenthesis around', () => {
            it('(MIT OR BSD-2-Clause) equals "MIT OR BSD-2-Clause"', () => {
                expect(parse('MIT OR BSD-2-Clause')).toStrictEqual(parse('(MIT OR BSD-2-Clause)'))
            })
        })
    })

    describe('with multiple elements joined without explicit grouping or implicit precedence', () => {

        it('"MIT OR MPL-2.0 OR Apache-2.0" is treated as "MIT OR (MPL-2.0 OR Apache-2.0)"', () => {
            const actualResult = parse('MIT OR MPL-2.0 OR Apache-2.0')
            const expectedResult = parse('MIT OR (MPL-2.0 OR Apache-2.0)')
            expect(actualResult).toStrictEqual(expectedResult)
        })

        it('"MIT OR MPL-2.0 OR MPL OR GPL" is treated as "MIT OR (MPL-2.0 OR (MPL OR GPL))"', () => {
            const actualResult = parse('MIT OR MPL-2.0 OR MPL OR GPL')
            const expectedResult = parse('MIT OR (MPL-2.0 OR (MPL OR GPL))')
            expect(actualResult).toStrictEqual(expectedResult)
        })

        it('"MIT AND MPL-2.0 AND MPL" is treated as "MIT AND (MPL-2.0 AND MPL)"', () => {
            const actualResult = parse('MIT AND MPL-2.0 AND MPL')
            const expectedResult = parse('MIT AND (MPL-2.0 AND MPL)')
            expect(actualResult).toStrictEqual(expectedResult)
        })

        it('"MIT AND MPL-2.0 AND MPL AND GPL" is treated as "MIT AND (MPL-2.0 AND (MPL AND GPL))"', () => {
            const actualResult = parse('MIT AND MPL-2.0 AND MPL AND GPL')
            const expectedResult = parse('MIT AND (MPL-2.0 AND (MPL AND GPL))')
            expect(actualResult).toStrictEqual(expectedResult)
        })
    })

    describe('with three elements joined with AND and OR', () => {
        describe('with explicit grouping around "AND"', () => {

            const expressionWithExplicitAndGroupingBeforeOr = '(Apache-2.0 AND MIT) OR GPL-3.0'
            it(expressionWithExplicitAndGroupingBeforeOr, () => {
                const expectedResult = {
                    'conjunction': 'or',
                    'left': {
                        'left': { license: 'Apache-2.0' },
                        'conjunction': 'and',
                        'right': { license: 'MIT' }
                    },
                    'right': { license: 'GPL-3.0' }
                }
                const actualResult = parse(expressionWithExplicitAndGroupingBeforeOr)
                expect(actualResult).toStrictEqual(expectedResult)
            })

            const expressionWithExplicitAndGroupingAfterOr = 'GPL-3.0 OR (Apache-2.0 AND MIT)'
            it(expressionWithExplicitAndGroupingAfterOr, () => {
                const expectedResult = {
                    'conjunction': 'or',
                    'left': { license: 'GPL-3.0' },
                    'right': {
                        'left': { license: 'Apache-2.0' },
                        'conjunction': 'and',
                        'right': { license: 'MIT' }
                    },
                }
                expect(parse(expressionWithExplicitAndGroupingAfterOr)).toStrictEqual(expectedResult)
            })
        })

        describe('with explicit grouping around "OR"', () => {

            const expressionWithExplicitOrGroupingBeforeAnd = '(Apache-2.0 OR MIT) AND GPL-3.0'
            it(expressionWithExplicitOrGroupingBeforeAnd, () => {
                const expectedResult = {
                    'conjunction': 'and',
                    'left': {
                        'conjunction': 'or',
                        'left': { license: 'Apache-2.0' },
                        'right': { license: 'MIT' }
                    },
                    'right': { license: 'GPL-3.0' }
                }
                expect(parse(expressionWithExplicitOrGroupingBeforeAnd)).toStrictEqual(expectedResult)
            })

            const expressionWithExplicitAndGroupingAfterOr = 'GPL-3.0 AND (Apache-2.0 OR MIT)'
            it(expressionWithExplicitAndGroupingAfterOr, () => {
                const expectedResult = {
                    'conjunction': 'and',
                    'left': { license: 'GPL-3.0' },
                    'right': {
                        'conjunction': 'or',
                        'left': { license: 'Apache-2.0' },
                        'right': { license: 'MIT' }
                    },
                }
                expect(parse(expressionWithExplicitAndGroupingAfterOr)).toStrictEqual(expectedResult)
            })
        })

        describe('without explicit grouping', () => {

            const andOrExpression = 'Apache-2.0 AND MIT OR GPL-3.0'
            const andOrExplicitEquivalent = 'Apache-2.0 AND (MIT OR GPL-3.0)'
            it(`${JSON.stringify(andOrExpression)} is treated as ${JSON.stringify(andOrExplicitEquivalent)}`, () => {
                const expectedResult = {
                    'left': { license: 'Apache-2.0' },
                    'conjunction': 'and',
                    'right': {
                        'left': { license: 'MIT' },
                        'conjunction': 'or',
                        'right': { license: 'GPL-3.0' }
                    },
                }
                expect(parse(andOrExpression)).toStrictEqual(expectedResult)
            })

            const orAndExpression = 'BSD OR MIT AND GPL-3.0'
            const orAndExplicitEquivalent = 'BSD OR (MIT AND GPL-3.0)'
            it(`${JSON.stringify(orAndExpression)} is treated as ${JSON.stringify(orAndExplicitEquivalent)}`, () => {
                const expectedResult = parse(orAndExplicitEquivalent)
                const actualResult = parse(orAndExpression)
                expect(actualResult).toStrictEqual(expectedResult)
            })
        })
    })

})
