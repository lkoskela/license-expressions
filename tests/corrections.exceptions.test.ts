import { parse } from '../src'
import { correctExceptionId, expandLicenses } from '../src/licenses'


describe('correcting exception IDs through parse()', () => {

    describe('Exact matches of known exception names', () => {

        it('are accepted/corrected in liberal mode', () => {
            expect(parse('GPL-2.0-only WITH Classpath exception 2.0', { strictSyntax: false })).toStrictEqual({ license: 'GPL-2.0-only', exception: 'Classpath-exception-2.0' })
            expect(parse('GPL-2.0-or-later WITH Bison exception 2.2', { strictSyntax: false })).toStrictEqual({ license: 'GPL-2.0-or-later', exception: 'Bison-exception-2.2' })
        })

        /**
         * @see https://spdx.github.io/spdx-spec/SPDX-license-expressions/#d2-case-sensitivity
         */
        it('are accepted/corrected in liberal mode ignoring case', () => {
            expect(parse('GPL-2.0-only WITH ClasSpAth eXcepTion 2.0', { strictSyntax: false })).toStrictEqual({ license: 'GPL-2.0-only', exception: 'Classpath-exception-2.0' })
            expect(parse('GPL-2.0-or-later WITH biSoN excEPTion 2.2', { strictSyntax: false })).toStrictEqual({ license: 'GPL-2.0-or-later', exception: 'Bison-exception-2.2' })
        })

        it('are accepted/corrected in liberal mode ignoring extra whitespace', () => {
            expect(parse('GPL-2.0-only WITH   ClasSpAth   eXcepTion   2.0   ', { strictSyntax: false })).toStrictEqual({ license: 'GPL-2.0-only', exception: 'Classpath-exception-2.0' })
            expect(parse('GPL-2.0-or-later WITH\t biSoN\texcEPTion\t\t\t2.2', { strictSyntax: false })).toStrictEqual({ license: 'GPL-2.0-or-later', exception: 'Bison-exception-2.2' })
            expect(parse('Apache 2.0 WITH LLVM exception')).toStrictEqual({ license: 'Apache-2.0', exception: 'LLVM-exception' })
            expect(parse('apache 2.0 WITH  LLVM  Exception  ')).toStrictEqual({ license: 'Apache-2.0', exception: 'LLVM-exception' })
            expect(parse('apache 2.0 WITH llvm exception')).toStrictEqual({ license: 'Apache-2.0', exception: 'LLVM-exception' })
        })

        it('are not accepted/corrected in strict mode', () => {
            expect(() => parse('GPL-2.0-only WITH the classpath exception 2.0', { strictSyntax: true })).toThrow()
            expect(() => parse('GPL-2.0-or-later WITH the bison exception 2.2', { strictSyntax: true })).toThrow()
        })
    })

    it('misspelled exception that has no fix is left as-is', () => {
        expect(parse('MIT WITH No Such Exception')).toStrictEqual({ license: 'MIT', exception: 'No Such Exception' })
    })

    describe('Expressions with nonexistent version numbers', () => {

        describe('Are not corrected', () => {
            it('GPL-2.0-only WITH Classpath-exception-4.5.6', () => {
                expect(parse('GPL-2.0-only WITH Classpath-exception-4.5.6')).toStrictEqual({ license: 'GPL-2.0-only', exception: 'Classpath-exception-4.5.6' })
            })
        })
    })
})

describe('correcting exception IDs through correctExceptionId()', () => {

    describe('misspelling that has no fix', () => {
        it('renders the exception in its original form', () => {
            expect(correctExceptionId('No Such Exception')).toStrictEqual('No Such Exception')
        })
    })

    describe('common misspellings', () => {

        describe('of Autoconf-exception-2.0', () => {
            const misspellings =
                ['autoconf exception 2.0', 'autoconf exception 2', 'autoconf exception version 2']
                .flatMap((misspelling) => [misspelling, `the ${misspelling}`])
            misspellings.forEach((misspelling) => {
                it(JSON.stringify(misspelling), () => {
                    expect(correctExceptionId(misspelling)).toStrictEqual('Autoconf-exception-2.0')
                })
            })
        })

        describe('of Classpath-exception-2.0', () => {
            const misspellings =
                ['classpath exception 2.0', 'classpath exception 2', 'classpath exception version 2', 'classpath exception version 2.0', 'CPE']
                .flatMap((misspelling) => [misspelling, `GNU ${misspelling}`])
                .flatMap((misspelling) => [misspelling, `the ${misspelling}`])
            misspellings.forEach((misspelling) => {
                it(JSON.stringify(misspelling), () => {
                    expect(correctExceptionId(misspelling)).toStrictEqual('Classpath-exception-2.0')
                })
            })
        })

        describe('of Qwt-exception-1.0', () => {
            const misspellings =
                ['qwt exception 1.0', 'QWT exception 1', 'Qwt exception version 1.0']
                .flatMap((misspelling) => [misspelling, misspelling.replace('exception', 'license')])
                .flatMap((misspelling) => [misspelling, `the ${misspelling}`])
            misspellings.forEach((misspelling) => {
                it(JSON.stringify(misspelling), () => {
                    expect(correctExceptionId(misspelling)).toStrictEqual('Qwt-exception-1.0')
                })
            })
        })

        describe('of u-boot-exception-2.0', () => {
            const misspellings =
                ['UBoot exception 2.0', 'UBoot exception 2']
                .flatMap((misspelling) => [misspelling, `the ${misspelling}`])
            misspellings.forEach((misspelling) => {
                it(JSON.stringify(misspelling), () => {
                    expect(correctExceptionId(misspelling)).toStrictEqual('u-boot-exception-2.0')
                })
            })
        })

    })

    describe('ambiguity around omitted version', () => {

        describe('is resolved based on associated license', () => {
            const misspellings = ['Autoconf exception', 'autoconf-exception']
            misspellings.forEach((misspelling) => {
                ['GPL-2.0', 'GPL-2.0-only', 'GPL-2.0-or-later'].forEach((license) => {
                    it(`"${license} WITH ${misspelling}" yields "Autoconf-exception-2.0"`, () => {
                        expect(correctExceptionId(misspelling, license)).toStrictEqual('Autoconf-exception-2.0')
                    })
                });
                ['GPL-3.0', 'GPL-3.0-only', 'GPL-3.0-or-later'].forEach((license) => {
                    it(`"${license} WITH ${misspelling}" yields "Autoconf-exception-3.0"`, () => {
                        expect(correctExceptionId(misspelling, license)).toStrictEqual('Autoconf-exception-3.0')
                    })
                });
            })
        })
    })
})

describe('expandLicenses()', () => {
    describe('GPL-2.0', () => {
        it('with expandScope=true', () => {
            expect(expandLicenses(['GPL-2.0'], { expandScope: true })).toStrictEqual(['GPL-2.0', 'GPL-2.0-and-later', 'GPL-2.0-only', 'GPL-2.0-or-later'])
        })
        it('with expandScope=false', () => {
            expect(expandLicenses(['GPL-2.0'])).toStrictEqual(['GPL-2.0', 'GPL-2.0-and-later', 'GPL-2.0-only', 'GPL-2.0-or-later'])
            expect(expandLicenses(['GPL-2.0'], {})).toStrictEqual(['GPL-2.0', 'GPL-2.0-and-later', 'GPL-2.0-only', 'GPL-2.0-or-later'])
            expect(expandLicenses(['GPL-2.0'], { expandScope: undefined })).toStrictEqual(['GPL-2.0', 'GPL-2.0-and-later', 'GPL-2.0-only', 'GPL-2.0-or-later'])
            expect(expandLicenses(['GPL-2.0'], { expandScope: false })).toStrictEqual(['GPL-2.0', 'GPL-2.0-and-later', 'GPL-2.0-only', 'GPL-2.0-or-later'])
        })
    })

    describe('GPL-2.0+', () => {
        it('with {expandScope:true}', () => {
            expect(expandLicenses(['GPL-2.0+'], { expandScope: true })).toStrictEqual(['GPL-2.0', 'GPL-2.0+', 'GPL-2.0-and-later', 'GPL-2.0-or-later'])
        })
        it('with omitted options', () => {
            expect(expandLicenses(['GPL-2.0+'])).toStrictEqual(['GPL-2.0', 'GPL-2.0+', 'GPL-2.0-and-later', 'GPL-2.0-or-later'])
        })
        it('with empty options', () => {
            expect(expandLicenses(['GPL-2.0+'], {})).toStrictEqual(['GPL-2.0', 'GPL-2.0+', 'GPL-2.0-and-later', 'GPL-2.0-or-later'])
        })
        it('with {expandScope:undefined}', () => {
            expect(expandLicenses(['GPL-2.0+'], { expandScope: undefined })).toStrictEqual(['GPL-2.0', 'GPL-2.0+', 'GPL-2.0-and-later', 'GPL-2.0-or-later'])
        })
        it('with {expandScope:false}', () => {
            expect(expandLicenses(['GPL-2.0+'], { expandScope: false })).toStrictEqual(['GPL-2.0', 'GPL-2.0+', 'GPL-2.0-and-later', 'GPL-2.0-or-later'])
        })
    })

    describe('GPL-2.0-or-later', () => {
        it('with expandScope=true', () => {
            expect(expandLicenses(['GPL-2.0-or-later'], { expandScope: true })).toStrictEqual(['GPL-2.0', 'GPL-2.0-and-later', 'GPL-2.0-or-later'])
        })
        it('with expandScope=false', () => {
            expect(expandLicenses(['GPL-2.0-or-later'])).toStrictEqual(['GPL-2.0', 'GPL-2.0-and-later', 'GPL-2.0-or-later'])
            expect(expandLicenses(['GPL-2.0-or-later'], {})).toStrictEqual(['GPL-2.0', 'GPL-2.0-and-later', 'GPL-2.0-or-later'])
            expect(expandLicenses(['GPL-2.0-or-later'], { expandScope: undefined })).toStrictEqual(['GPL-2.0', 'GPL-2.0-and-later', 'GPL-2.0-or-later'])
            expect(expandLicenses(['GPL-2.0-or-later'], { expandScope: false })).toStrictEqual(['GPL-2.0', 'GPL-2.0-and-later', 'GPL-2.0-or-later'])
        })
    })
})

describe('of "WITH" as "w/"', () => {

    it('"w/" is corrected when strictSyntax = false', () => {
        const expression = 'GPL-3.0-only w/ Autoconf-exception-2.0'
        expect(() => parse(expression, { strictSyntax: true })).toThrow()
        expect(parse(expression, { strictSyntax: false })).toMatchObject({
            license: 'GPL-3.0-only',
            exception: 'Autoconf-exception-2.0'
        })
    })

    it('"W/" is corrected when strictSyntax = false', () => {
        const expression = 'GPLv3+ W/ autoconf-exception-2.0'
        expect(() => parse(expression, { strictSyntax: true })).toThrow()
        expect(parse(expression, { strictSyntax: false })).toMatchObject({
            license: 'GPL-3.0-or-later',
            exception: 'Autoconf-exception-2.0'
        })
    })

    it('"w/" is corrected even when there is no whitespace before a valid exception', () => {
        const expression = 'GPL-3.0-only w/autoconf-exception-2.0'
        expect(() => parse(expression, { strictSyntax: true })).toThrow()
        expect(parse(expression, { strictSyntax: false })).toMatchObject({
            license: 'GPL-3.0-only',
            exception: 'Autoconf-exception-2.0'
        })
    })

    it('"w/" is corrected even when there is no whitespace before an unknown exception', () => {
        const expression = 'GPL-3.0-only w/not an exception'
        expect(() => parse(expression, { strictSyntax: true })).toThrow()
        expect(parse(expression, { strictSyntax: false })).toMatchObject({
            license: 'GPL-3.0-only',
            exception: 'not an exception'
        })
    })

    it("BSD 3-clause License w/nuclear disclaimer", () => {
        const expression = "BSD 3-clause License w/nuclear disclaimer"
        expect(() => parse(expression, { strictSyntax: true })).toThrow()
        expect(parse(expression, { strictSyntax: false })).toMatchObject({
            license: 'BSD-3-Clause',
            exception: 'nuclear disclaimer'
        })
    })

    it('"w/" is not corrected even in liberal mode when there is no license identifier before it', () => {
        expect(() => parse('w/whatever', { strictSyntax: true })).toThrow()
        expect(() => parse('w/whatever', { strictSyntax: false })).toThrow()
        expect(() => parse(' w/ whatever', { strictSyntax: true })).toThrow()
        expect(() => parse(' w/ whatever', { strictSyntax: false })).toThrow()
        expect(() => parse('XXXw/whatever', { strictSyntax: true })).toThrow()
        expect(() => parse('XXXw/whatever', { strictSyntax: false })).toThrow()
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
            expect(() => parse(expression, { strictSyntax: false })).not.toThrow()
            expect(() => parse(expression, { strictSyntax: true })).toThrow()
        })

        it('"Qwt License 1.0" is corrected to "Qwt-exception-1.0"', () => {
            expect(parse('LGPL-2.1 WITH Qwt License 1.0')).toMatchObject({ exception: 'Qwt-exception-1.0' })
            expect(parse('LGPL-2.1 WITH Qwt License Version 1.0')).toMatchObject({ exception: 'Qwt-exception-1.0' })
        })

        it('"UBoot exception 2.0" is corrected to "u-boot-exception-2.0"', () => {
            expect(parse('GPL-2.0+ WITH UBoot exception 2.0')).toMatchObject({ exception: 'u-boot-exception-2.0' })
            expect(parse('GPL-2.0+ WITH UBoot exception 2')).toMatchObject({ exception: 'u-boot-exception-2.0' })
        })

        it('"GNU Classpath Exception 2.0" is corrected to "Classpath-exception-2.0"', () => {
            expect(parse('GPL-2.0-only WITH GNU Classpath Exception 2.0')).toStrictEqual({ license: 'GPL-2.0-only', exception: 'Classpath-exception-2.0' })
        })

        it('"GNU Classpath Exception" is corrected to "Classpath-exception-2.0"', () => {
            expect(parse('GPL-2.0-only WITH GNU Classpath Exception')).toStrictEqual({ license: 'GPL-2.0-only', exception: 'Classpath-exception-2.0' })
        })

        it('"GNU Classpath Exception 2.0" is corrected to "Classpath-exception-2.0"', () => {
            expect(parse('GPL-2.0-only WITH GNU Classpath Exception 2.0')).toStrictEqual({ license: 'GPL-2.0-only', exception: 'Classpath-exception-2.0' })
        })

        it('"classpath exception" is corrected to "Classpath-exception-2.0"', () => {
            expect(parse('GPL-2.0-only WITH classpath exception')).toStrictEqual({ license: 'GPL-2.0-only', exception: 'Classpath-exception-2.0' })
        })

        it('"the classpath exception" is corrected to "Classpath-exception-2.0"', () => {
            expect(parse('GPL-2.0-only WITH the classpath exception')).toStrictEqual({ license: 'GPL-2.0-only', exception: 'Classpath-exception-2.0' })
        })

        it('"CPE" is corrected to "Classpath-exception-2.0"', () => {
            expect(parse('GPL-2.0-only WITH CPE')).toStrictEqual({ license: 'GPL-2.0-only', exception: 'Classpath-exception-2.0' })
        })
    })
})
