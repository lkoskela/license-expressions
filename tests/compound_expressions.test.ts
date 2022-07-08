import {parse} from '../src'


describe('Compound expressions (e.g. dual licensing scenarios)', () => {

    describe('with leading/trailing whitespace', () => {
        it('are trimmed of leading/trailing whitespace around identifiers', () => {
            expect(parse(' \t \n MIT OR  \t Apache-2.0 \n')).toStrictEqual({
                'conjunction': 'or',
                'left': { license: 'MIT' },
                'right': { license: 'Apache-2.0' }
            })
        })

        it('are trimmed of leading/trailing whitespace inside and outside parenthesis', () => {
            expect(parse(' \t \n( MIT OR  \t Apache-2.0 \n)\t ')).toStrictEqual({
                'conjunction': 'or',
                'left': { license: 'MIT' },
                'right': { license: 'Apache-2.0' }
            })
        })
    })

    describe('with two elements', () => {

        describe('yields an "OR" conjunction with correct left and right expressions', () => {
            [['MIT', 'MIT'], ['BSD-2-Clause', 'Apache-2.0']].forEach(pairing => {
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
            [['MPL-2.0', 'MIT'], ['BSD-3-Clause', 'Apache-2.0']].forEach(pairing => {
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

        it('"MIT OR MPL-2.0 OR 0BSD OR curl" is treated as "MIT OR (MPL-2.0 OR (0BSD OR curl))"', () => {
            const actualResult = parse('MIT OR MPL-2.0 OR 0BSD OR curl')
            const expectedResult = parse('MIT OR (MPL-2.0 OR (0BSD OR curl))')
            expect(actualResult).toStrictEqual(expectedResult)
        })

        it('"MIT AND MPL-2.0 AND 0BSD" is treated as "MIT AND (MPL-2.0 AND 0BSD)"', () => {
            const actualResult = parse('MIT AND MPL-2.0 AND 0BSD')
            const expectedResult = parse('MIT AND (MPL-2.0 AND 0BSD)')
            expect(actualResult).toStrictEqual(expectedResult)
        })

        it('"MIT AND MPL-2.0 AND 0BSD AND curl" is treated as "MIT AND (MPL-2.0 AND (0BSD AND curl))"', () => {
            const actualResult = parse('MIT AND MPL-2.0 AND 0BSD AND curl')
            const expectedResult = parse('MIT AND (MPL-2.0 AND (0BSD AND curl))')
            expect(actualResult).toStrictEqual(expectedResult)
        })
    })

    describe('with three elements joined with AND and OR', () => {
        describe('with explicit grouping around "AND"', () => {

            const expressionWithExplicitAndGroupingBeforeOr = '(Apache-2.0 AND MIT) OR BSD-3-Clause'
            it(expressionWithExplicitAndGroupingBeforeOr, () => {
                const expectedResult = {
                    'conjunction': 'or',
                    'left': {
                        'left': { license: 'Apache-2.0' },
                        'conjunction': 'and',
                        'right': { license: 'MIT' }
                    },
                    'right': { license: 'BSD-3-Clause' }
                }
                const actualResult = parse(expressionWithExplicitAndGroupingBeforeOr)
                expect(actualResult).toStrictEqual(expectedResult)
            })

            const expressionWithExplicitAndGroupingAfterOr = 'BSD-3-Clause OR (Apache-2.0 AND MIT)'
            it(expressionWithExplicitAndGroupingAfterOr, () => {
                const expectedResult = {
                    'conjunction': 'or',
                    'left': { license: 'BSD-3-Clause' },
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

            const expressionWithExplicitOrGroupingBeforeAnd = '(Apache-2.0 OR MIT) AND BSD-3-Clause'
            it(expressionWithExplicitOrGroupingBeforeAnd, () => {
                const expectedResult = {
                    'conjunction': 'and',
                    'left': {
                        'conjunction': 'or',
                        'left': { license: 'Apache-2.0' },
                        'right': { license: 'MIT' }
                    },
                    'right': { license: 'BSD-3-Clause' }
                }
                expect(parse(expressionWithExplicitOrGroupingBeforeAnd)).toStrictEqual(expectedResult)
            })

            const expressionWithExplicitAndGroupingAfterOr = 'BSD-3-Clause AND (Apache-2.0 OR MIT)'
            it(expressionWithExplicitAndGroupingAfterOr, () => {
                const expectedResult = {
                    'conjunction': 'and',
                    'left': { license: 'BSD-3-Clause' },
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

            const andOrExpression = 'Apache-2.0 AND MIT OR BSD-3-Clause'
            const andOrExplicitEquivalent = 'Apache-2.0 AND (MIT OR BSD-3-Clause)'
            it(`${JSON.stringify(andOrExpression)} is treated as ${JSON.stringify(andOrExplicitEquivalent)}`, () => {
                const expectedResult = {
                    'left': { license: 'Apache-2.0' },
                    'conjunction': 'and',
                    'right': {
                        'left': { license: 'MIT' },
                        'conjunction': 'or',
                        'right': { license: 'BSD-3-Clause' }
                    },
                }
                expect(parse(andOrExpression)).toStrictEqual(expectedResult)
            })

            const orAndExpression = 'Apache-2.0 OR MIT AND BSD-3-Clause'
            const orAndExplicitEquivalent = 'Apache-2.0 OR (MIT AND BSD-3-Clause)'
            it(`${JSON.stringify(orAndExpression)} is treated as ${JSON.stringify(orAndExplicitEquivalent)}`, () => {
                const expectedResult = parse(orAndExplicitEquivalent)
                const actualResult = parse(orAndExpression)
                expect(actualResult).toStrictEqual(expectedResult)
            })
        })
    })

})
