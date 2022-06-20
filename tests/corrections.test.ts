import {parseSpdxExpression as parse, parseSpdxExpressionWithDetails} from '../src'


describe('GPL family of expressions with a "+" suffix', () => {
    describe('"AGPL-3.0+" is interpreted as "AGPL-3.0-or-later"', () => {

        it('in a simple expression', () => {
            expect(parse('AGPL-3.0+')).toStrictEqual({ license: 'AGPL-3.0-or-later' })
        })

        it('in a compound expression', () => {
            expect(parse('AGPL-3.0+ OR MIT')).toStrictEqual({
                conjunction: 'or',
                left: { license: 'AGPL-3.0-or-later' },
                right: { license:'MIT' }
            })
        })
    })
})

describe('Common shorthands or forms for Apache-2.0', () => {
    describe('"Apache2" or "Apache-2" is interpreted as "Apache-2.0"', () => {

        it('in a simple expression', () => {
            expect(parse('Apache2')).toStrictEqual({ license: 'Apache-2.0' })
            expect(parse('Apache-2')).toStrictEqual({ license: 'Apache-2.0' })
        })

        it('in a compound expression', () => {
            const expected = {
                conjunction: 'or',
                left: { license: 'Apache-2.0' },
                right: { license:'MIT' }
            }
            expect(parse('Apache2 OR MIT')).toStrictEqual(expected)
            expect(parse('Apache-2 OR MIT')).toStrictEqual(expected)
        })
    })

    describe('"Apache version 2" is interpreted as "Apache-2.0"', () => {

        it('AV2 alone', () => {
            expect(parse('Apache version 2')).toStrictEqual({ license: 'Apache-2.0' })
        })

        it('AV2 with WITH', () => {
            expect(parse('Apache version 2 WITH Autoconf-exception-2.2')).toStrictEqual({
                license: 'Apache-2.0',
                exception: 'Autoconf-exception-2.2'
            })
        })

        it('AV2 with OR', () => {
            expect(parse('Apache version 2 OR MIT')).toStrictEqual({
                conjunction: 'or',
                left: {license: 'Apache-2.0'},
                right: {license: 'MIT'}
            })
        })

        it('AV2 with AND', () => {
            expect(parse('Apache version 2 AND MIT')).toStrictEqual({
                conjunction: 'and',
                left: {license: 'Apache-2.0'},
                right: {license: 'MIT'}
            })
        })
    })

    describe('"Apache 2" is interpreted as "Apache-2.0"', () => {

        it('in a simple expression', () => {
            expect(parse('Apache 2')).toStrictEqual({ license: 'Apache-2.0' })
        })

        it('(first) in a compound expression', () => {
            expect(parse('Apache 2 OR MIT')).toStrictEqual({
                conjunction: 'or',
                left: { license: 'Apache-2.0' },
                right: { license:'MIT' }
            })
        })

        it('(last) in a compound expression', () => {
            expect(parse('MIT OR Apache 2')).toStrictEqual({
                conjunction: 'or',
                left: { license:'MIT' },
                right: { license: 'Apache-2.0' }
            })
        })

        it('(first) in a wrapped compound expression', () => {
            expect(parse('(Apache 2 OR MIT)')).toStrictEqual({
                conjunction: 'or',
                left: { license: 'Apache-2.0' },
                right: { license:'MIT' }
            })
        })

        it('(last) in a wrapped compound expression', () => {
            expect(parse('(MIT OR Apache 2)')).toStrictEqual({
                conjunction: 'or',
                left: { license:'MIT' },
                right: { license: 'Apache-2.0' }
            })
        })
    })

    describe('"Apache version 2" is interpreted as "Apache-2.0"', () => {

        it('in a simple expression', () => {
            expect(parse('Apache version 2')).toStrictEqual({ license: 'Apache-2.0' })
        })

        it('(first) in a compound expression', () => {
            expect(parse('Apache version 2 OR MIT')).toStrictEqual({
                conjunction: 'or',
                left: { license: 'Apache-2.0' },
                right: { license:'MIT' }
            })
        })

        it('(last) in a compound expression', () => {
            expect(parse('MIT OR Apache version 2')).toStrictEqual({
                conjunction: 'or',
                left: { license:'MIT' },
                right: { license: 'Apache-2.0' }
            })
        })

        it('(first) in a wrapped compound expression', () => {
            expect(parse('(Apache version 2 OR MIT)')).toStrictEqual({
                conjunction: 'or',
                left: { license: 'Apache-2.0' },
                right: { license:'MIT' }
            })
        })

        it('(last) in a wrapped compound expression', () => {
            expect(parse('(MIT OR Apache version 2)')).toStrictEqual({
                conjunction: 'or',
                left: { license:'MIT' },
                right: { license: 'Apache-2.0' }
            })
        })
    })
})

describe('Common shorthands for GPL versions', () => {
    describe('"GPL" is interpreted as "GPL-3.0-or-later"', () => {

        it('in a simple expression', () => {
            expect(parse('GPL')).toStrictEqual({ license: 'GPL-3.0-or-later' })
        })

        it('in a compound expression', () => {
            expect(parse('GPL OR MIT')).toStrictEqual({
                conjunction: 'or',
                left: { license: 'GPL-3.0-or-later' },
                right: { license:'MIT' }
            })
        })
    })

    describe('"GPLv3" is interpreted as "GPL-3.0-or-later"', () => {

        it('in a simple expression', () => {
            expect(parse('GPLv3')).toStrictEqual({ license: 'GPL-3.0-or-later' })
        })

        it('in a compound expression', () => {
            expect(parse('GPLv3 OR MIT')).toStrictEqual({
                conjunction: 'or',
                left: { license: 'GPL-3.0-or-later' },
                right: { license:'MIT' }
            })
        })
    })

    describe('"GPLv2" is interpreted as "GPL-2.0-or-later"', () => {

        it('in a simple expression', () => {
            expect(parse('GPLv2')).toStrictEqual({ license: 'GPL-2.0-only' })
        })

        it('in a compound expression', () => {
            expect(parse('GPLv2 OR MIT')).toStrictEqual({
                conjunction: 'or',
                left: { license: 'GPL-2.0-only' },
                right: { license:'MIT' }
            })
        })
    })
})

describe('Expressions with nonexistent version numbers', () => {

    describe('"GPL-2.1" is interpreted as "GPL-2.0-only"', () => {

        it('in a simple expression', () => {
            expect(parse('GPL-2.1')).toStrictEqual({ license: 'GPL-2.0-only' })
        })

        it('in a compound expression', () => {
            expect(parse('GPL-2.1 OR MIT')).toStrictEqual({
                conjunction: 'or',
                left: { license: 'GPL-2.0-only' },
                right: { license:'MIT' }
            })
        })
    })
})

describe('Expressions with slight errors', () => {

    describe('lowercase "mit" is interpreted as "MIT"', () => {

        it('in a simple expression', () => {
            expect(parse('mit')).toStrictEqual({ license: 'MIT' })
        })

        it('in a compound expression', () => {
            expect(parse('BSD-2-Clause OR mit')).toStrictEqual({
                conjunction: 'or',
                left: { license: 'BSD-2-Clause' },
                right: { license:'MIT' }
            })
        })
    })

    describe('lowercase "apache-2.0" is interpreted as "Apache-2.0"', () => {

        it('in a simple expression', () => {
            expect(parse('apache-2.0')).toStrictEqual({ license: 'Apache-2.0' })
        })

        it('in a compound expression', () => {
            expect(parse('BSD-2-Clause OR apache-2.0')).toStrictEqual({
                conjunction: 'or',
                left: { license: 'BSD-2-Clause' },
                right: { license:'Apache-2.0' }
            })
        })
    })

    describe('"BSD0" is interpreted as "0BSD"', () => {

        it('in a simple expression', () => {
            expect(parse('BSD0')).toStrictEqual({ license: '0BSD' })
        })

        it('(first) in a compound expression', () => {
            const expected = {
                conjunction: 'or',
                left: { license: '0BSD' },
                right: { license:'MIT' }
            }
            expect(parse('BSD0 OR MIT')).toStrictEqual(expected)
            expect(parse('bsd0 OR MIT')).toStrictEqual(expected)
        })

        it('(last) in a compound expression', () => {
            const expected = {
                conjunction: 'or',
                left: { license:'MIT' },
                right: { license: '0BSD' }
            }
            expect(parse('MIT OR BSD0')).toStrictEqual(expected)
            expect(parse('MIT OR bsd0')).toStrictEqual(expected)
        })
    })
})
