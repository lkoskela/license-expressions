import { parseSpdxExpression as parse } from '../src'


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

describe('Deprecated "default" GPL versions are coerced into their non-deprecated, explicit alias', () => {
    describe('LGPL', () => {
        describe('LGPL-2.0', () => {
            expect(parse('LGPL-2.0-only')).toStrictEqual({ license: 'LGPL-2.0-only' })
            expect(parse('LGPL-2.0')).toStrictEqual({ license: 'LGPL-2.0-only' })
            expect(parse('LGPL-2.0-or-later')).toStrictEqual({ license: 'LGPL-2.0-or-later' })
            expect(parse('LGPL-2.0+')).toStrictEqual({ license: 'LGPL-2.0-or-later' })
        })

        describe('LGPL-2.1', () => {
            expect(parse('LGPL-2.1-only')).toStrictEqual({ license: 'LGPL-2.1-only' })
            expect(parse('LGPL-2.1')).toStrictEqual({ license: 'LGPL-2.1-only' })
            expect(parse('LGPL-2.1-or-later')).toStrictEqual({ license: 'LGPL-2.1-or-later' })
            expect(parse('LGPL-2.1+')).toStrictEqual({ license: 'LGPL-2.1-or-later' })
        })

        describe('LGPL-3.0', () => {
            expect(parse('LGPL-3.0-only')).toStrictEqual({ license: 'LGPL-3.0-only' })
            expect(parse('LGPL-3.0')).toStrictEqual({ license: 'LGPL-3.0-only' })
            expect(parse('LGPL-3.0-or-later')).toStrictEqual({ license: 'LGPL-3.0-or-later' })
            expect(parse('LGPL-3.0+')).toStrictEqual({ license: 'LGPL-3.0-or-later' })
        })
    })

    describe('AGPL', () => {
        it('AGPL-1.0', () => {
            expect(parse('AGPL-1.0-only')).toStrictEqual({ license: 'AGPL-1.0-only' })
            expect(parse('AGPL-1.0')).toStrictEqual({ license: 'AGPL-1.0-only' })
            expect(parse('AGPL-1.0-or-later')).toStrictEqual({ license: 'AGPL-1.0-or-later' })
        })

        it('AGPL-3.0', () => {
            expect(parse('AGPL-3.0-only')).toStrictEqual({ license: 'AGPL-3.0-only' })
            expect(parse('AGPL-3.0')).toStrictEqual({ license: 'AGPL-3.0-only' })
            expect(parse('AGPL-3.0-or-later')).toStrictEqual({ license: 'AGPL-3.0-or-later' })
        })
    })

    describe('GPL', () => {
        it('GPL-1.0', () => {
            expect(parse('GPL-1.0-only')).toStrictEqual({ license: 'GPL-1.0-only' })
            expect(parse('GPL-1.0')).toStrictEqual({ license: 'GPL-1.0-only' })
            expect(parse('GPL-1.0-or-later')).toStrictEqual({ license: 'GPL-1.0-or-later' })
            expect(parse('GPL-1.0+')).toStrictEqual({ license: 'GPL-1.0-or-later' })
        })

        it('GPL-2.0', () => {
            expect(parse('GPL-2.0-only')).toStrictEqual({ license: 'GPL-2.0-only' })
            expect(parse('GPL-2.0')).toStrictEqual({ license: 'GPL-2.0-only' })
            expect(parse('GPL-2.0-or-later')).toStrictEqual({ license: 'GPL-2.0-or-later' })
            expect(parse('GPL-2.0+')).toStrictEqual({ license: 'GPL-2.0-or-later' })
        })

        it('GPL-3.0', () => {
            expect(parse('GPL-3.0-only')).toStrictEqual({ license: 'GPL-3.0-only' })
            expect(parse('GPL-3.0')).toStrictEqual({ license: 'GPL-3.0-only' })
            expect(parse('GPL-3.0-or-later')).toStrictEqual({ license: 'GPL-3.0-or-later' })
            expect(parse('GPL-3.0+')).toStrictEqual({ license: 'GPL-3.0-or-later' })
        })
    })

    describe('"LGPL-2.0" is interpreted as "LGPL-2.0-only"', () => {

        it('in a simple expression', () => {
            expect(parse('LGPL-2.0')).toStrictEqual({ license: 'LGPL-2.0-only' })
        })

        it('in a compound expression', () => {
            expect(parse('LGPL-2.0 OR MIT')).toStrictEqual({
                conjunction: 'or',
                left: { license: 'LGPL-2.0-only' },
                right: { license:'MIT' }
            })
        })
    })
})

describe('Common shorthands or forms for Apache-1.1', () => {

    [
        'apache1.1',
        'apache 1.1',
        'apache-1.1',
        'apache software license',
        'apache software license 1.1',
        'apache software license version 1.1',
        'apache software license, version 1.1'
    ].forEach(spelling => {
        it(spelling, () => expect(parse(spelling)).toStrictEqual({ license: 'Apache-1.1' }))
    })
})

describe('Common shorthands or forms for Apache-2.0', () => {

    [
        'Apache2',
        'Apache 2',
        'Apache-2',
        'Apache version 2',
        'Apache version 2.0',
        'Apache license 2',
        'Apache license 2.0',
        'Apache license version 2',
        'Apache License version 2.0',
        'Apache License, version 2',
        'Apache License, version 2.0'
    ].forEach(spelling => {
        it(spelling, () => expect(parse(spelling)).toStrictEqual({ license: 'Apache-2.0' }))
    })

    describe('"Apache 2" is interpreted as "Apache-2.0"', () => {

        it('in a simple expression', () => {
            expect(parse('Apache 2')).toStrictEqual({ license: 'Apache-2.0' })
        })

        it('(first) in a compound expression', () => {
            expect(parse('Apache 2 AND MIT')).toStrictEqual({
                conjunction: 'and',
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
            expect(parse('(MIT AND Apache 2)')).toStrictEqual({
                conjunction: 'and',
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

    it('"GPL" is interpreted as "GPL-3.0-or-later"', () => {
        expect(parse('GPL')).toStrictEqual({ license: 'GPL-3.0-or-later' })
    })

    it('"GPLv3" is interpreted as "GPL-3.0-or-later"', () => {
        expect(parse('GPLv3')).toStrictEqual({ license: 'GPL-3.0-or-later' })
    })

    it('"GPLv2" is interpreted as "GPL-2.0-or-later"', () => {
        expect(parse('GPLv2')).toStrictEqual({ license: 'GPL-2.0-only' })
    })
})

describe('Expressions with nonexistent version numbers', () => {

    it('"GPL-2.1" is interpreted as "GPL-2.0-only"', () => {
        expect(parse('GPL-2.1')).toStrictEqual({ license: 'GPL-2.0-only' })
    })
})

describe('Expressions with slight errors', () => {

    /**
     * @see https://spdx.github.io/spdx-spec/SPDX-license-expressions/#d2-case-sensitivity
     */
    describe('license identifiers are corrected to the official case', () => {

        it('in a simple expression', () => {
            expect(parse('mit')).toStrictEqual({ license: 'MIT' })
            expect(parse('mIt')).toStrictEqual({ license: 'MIT' })
            expect(parse('Mit')).toStrictEqual({ license: 'MIT' })
            expect(parse('apache-2.0')).toStrictEqual({ license: 'Apache-2.0' })
        })

        it('in a compound expression', () => {
            expect(parse('BSD-2-clause OR mit')).toStrictEqual({
                conjunction: 'or',
                left: { license: 'BSD-2-Clause' },
                right: { license:'MIT' }
            })
        })

        it('in a complex compound expression', () => {
            expect(parse('bsd-2-CLAUSE AND (apache-2.0 OR GPL-3.0-OR-LATER)')).toStrictEqual({
                conjunction: 'and',
                left: { license: 'BSD-2-Clause' },
                right: {
                    conjunction: 'or',
                    left: { license:'Apache-2.0' },
                    right: { license:'GPL-3.0-or-later' }
                }
            })
        })
    })

    describe('whitespace instead of dashes', () => {
        it('Apache-2.0 WITH LLVM Exception', () => {
            expect(parse('Apache 2.0 WITH LLVM exception')).toStrictEqual({ license: 'Apache-2.0', exception: 'LLVM-exception' })
            expect(parse('apache 2.0 WITH LLVM Exception')).toStrictEqual({ license: 'Apache-2.0', exception: 'LLVM-exception' })
            expect(parse('apache 2.0 WITH llvm exception')).toStrictEqual({ license: 'Apache-2.0', exception: 'LLVM-exception' })
        })
    })

    describe('misspelling that has no fix', () => {
        it('renders the exception in its original form', () => {
            expect(parse('MIT WITH No Such Exception')).toStrictEqual({ license: 'MIT', exception: 'No Such Exception' })
        })
    })

    describe('common misspellings', () => {

        describe('of license exceptions', () => {

            it('"autoconf exception 2.0" or "autoconf exception version 2" is corrected to Autoconf-exception-2.0', () => {
                expect(parse('GPL-3.0-only WITH autoconf exception 2.0'))
                    .toMatchObject({ exception: 'Autoconf-exception-2.0' })
                expect(parse('GPL-3.0-only WITH autoconf exception 2'))
                    .toMatchObject({ exception: 'Autoconf-exception-2.0' })
                expect(parse('GPL-3.0-only WITH autoconf exception version 2'))
                    .toMatchObject({ exception: 'Autoconf-exception-2.0' })
            })

            it('with an extraneous "the" before the exception name/id', () => {
                expect(parse('GPL-3.0-only WITH the autoconf exception 2'))
                    .toMatchObject({ exception: 'Autoconf-exception-2.0' })
                expect(parse('GPL-3.0-only WITH the autoconf exception version 2.0'))
                    .toMatchObject({ exception: 'Autoconf-exception-2.0' })
                expect(parse('GPL-3.0-only WITH the autoconf-exception-2.0'))
                    .toMatchObject({ exception: 'Autoconf-exception-2.0' })
            })

            it('fail parsing if strictSyntax = true', () => {
                const expression = 'GPL-3.0-only WITH autoconf exception 2.0'
                expect(() => parse(expression, false)).not.toThrowError()
                expect(() => parse(expression, true)).toThrowError()
            })

            it('"Qwt License 1.0" is corrected to "Qwt-exception-1.0"', () => {
                expect(parse('LGPL-2.1 WITH Qwt License 1.0')).toMatchObject({ exception: 'Qwt-exception-1.0' })
                expect(parse('LGPL-2.1 WITH Qwt License Version 1.0')).toMatchObject({ exception: 'Qwt-exception-1.0' })
            })

            it('"UBoot exception 2.0" is corrected to "u-boot-exception-2.0"', () => {
                expect(parse('GPL-2.0+ WITH UBoot exception 2.0')).toMatchObject({ exception: 'u-boot-exception-2.0' })
                expect(parse('GPL-2.0+ WITH UBoot exception 2')).toMatchObject({ exception: 'u-boot-exception-2.0' })
            })
        })

        describe('of licenses', () => {

            it('"BSD" or "BSD license" is corrected to BSD-2-Clause', () => {
                expect(parse('BSD')).toStrictEqual({ license: 'BSD-2-Clause' })
                expect(parse('BSD License')).toStrictEqual({ license: 'BSD-2-Clause' })
            })

            it('"FreeBSD" or "FreeBSD License" is corrected to "BSD-2-Clause"', () => {
                expect(parse('FreeBSD License')).toStrictEqual({ license: 'BSD-2-Clause' })
                expect(parse('freebsd license')).toStrictEqual({ license: 'BSD-2-Clause' })
                expect(parse('frEeBsD')).toStrictEqual({ license: 'BSD-2-Clause' })
            })

            it('"simplified bsd license" or "the simplified bsd license" is corrected to "BSD-2-Clause"', () => {
                expect(parse('Simplified BSD License')).toStrictEqual({ license: 'BSD-2-Clause' })
                expect(parse('the simplified bsd license')).toStrictEqual({ license: 'BSD-2-Clause' })
            })

            it('"simplified bsd license" or "the simplified bsd license" is corrected to "BSD-2-Clause"', () => {
                expect(parse('Simplified BSD License')).toStrictEqual({ license: 'BSD-2-Clause' })
                expect(parse('the simplified bsd license')).toStrictEqual({ license: 'BSD-2-Clause' })
            })

            it('"new bsd license" or "modified bsd license" is corrected to "BSD-3-Clause"', () => {
                expect(parse('New BSD License')).toStrictEqual({ license: 'BSD-3-Clause' })
                expect(parse('the new bsd license')).toStrictEqual({ license: 'BSD-3-Clause' })
                expect(parse('Modified BSD License')).toStrictEqual({ license: 'BSD-3-Clause' })
                expect(parse('the modified bsd license')).toStrictEqual({ license: 'BSD-3-Clause' })
            })

            it('"BSD0" is corrected to 0BSD', () => {
                expect(parse('BSD0')).toStrictEqual({ license: '0BSD' })
            })

            it('"Zero-Clause BSD" is corrected to 0BSD', () => {
                expect(parse('Zero-Clause BSD')).toStrictEqual({ license: '0BSD' })
            })

            it('"Free Public License 1.0.0" or "Free Public License" is corrected to 0BSD', () => {
                expect(parse('Free Public License 1.0.0')).toStrictEqual({ license: '0BSD' })
                expect(parse('Free Public License 1.0')).toStrictEqual({ license: '0BSD' })
                expect(parse('Free Public License')).toStrictEqual({ license: '0BSD' })
            })

            it('"BSD2" is corrected to BSD-2-Clause', () => {
                expect(parse('BSD2')).toStrictEqual({ license: 'BSD-2-Clause' })
            })

            it('"BSD3" is corrected to BSD-3-Clause', () => {
                expect(parse('BSD3')).toStrictEqual({ license: 'BSD-3-Clause' })
            })
        })
    })
})
