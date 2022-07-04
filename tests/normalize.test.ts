import { normalize } from '../src'


describe('invalid expression', () => {
    it('is rendered as-is', () => {
        expect(normalize('NOT A VALID EXPRESSION')).toStrictEqual('NOT A VALID EXPRESSION')
        expect(normalize('NOT; A \nVALID\', EXPRESSION')).toStrictEqual('NOT; A \nVALID\', EXPRESSION')
        expect(normalize('')).toStrictEqual('')
    })
})

describe('Remove outermost parenthesis', () => {
    describe('from a simple expression', () => {

        it('(no-op) when there are no outermost parenthesis', () => {
            expect(normalize('MIT')).toStrictEqual('MIT')
        })

        it('in a simple expression', () => {
            expect(normalize('(MIT)')).toStrictEqual('MIT')
            expect(normalize('(GPL-3.0-only WITH Autoconf-exception-2.0)')).toStrictEqual('GPL-3.0-only WITH Autoconf-exception-2.0')
        })

        it('in a compound expression', () => {
            expect(normalize('(Apache-2.0 OR MIT)')).toStrictEqual('Apache-2.0 OR MIT')
        })
    })

    describe('but leave inner parenthesis', () => {

        it('in a compound expression', () => {
            expect(normalize('(Apache-2.0 OR (BSD-2-Clause AND MIT))')).toStrictEqual('Apache-2.0 OR (BSD-2-Clause AND MIT)')
            expect(normalize('(Apache-2.0 OR (MIT AND (BSD-2-Clause OR BSD-3-Clause)))')).toStrictEqual('Apache-2.0 OR (MIT AND (BSD-2-Clause OR BSD-3-Clause))')
        })
    })
})

describe('Sort elements of a compound expression', () => {

    describe('alphabetically', () => {

        describe('when already in order', () => {
            it('Apache-2.0 OR MIT', () => expect(normalize('Apache-2.0 OR MIT')).toStrictEqual('Apache-2.0 OR MIT'))
        })

        describe('when not yet in order', () => {
            it('MIT OR Apache-2.0', () => expect(normalize('MIT OR Apache-2.0')).toStrictEqual('Apache-2.0 OR MIT'))
        })

        describe('also within inner compounds', () => {
            it('alf AND (charlie OR bob)', () => expect(normalize('alf AND (charlie OR bob)')).toStrictEqual('alf AND (bob OR charlie)'))
        })
    })

    describe('simple expressions before compound expressions', () => {

        describe('when already in order', () => {
            it('a AND (b OR c)', () => expect(normalize('a AND (b OR c)')).toStrictEqual('a AND (b OR c)'))
            it('c AND (a OR b)', () => expect(normalize('c AND (a OR b)')).toStrictEqual('c AND (a OR b)'))
        })

        describe('when not yet in order', () => {
            it('(a OR b) AND c', () => expect(normalize('(a OR b) AND c')).toStartWith('c AND '))
            it('(c OR b) AND a', () => expect(normalize('(c OR b) AND a')).toStartWith('a AND'))
        })
    })

    describe('license IDs before licenseRefs', () => {

        describe('when already in order', () => {

            it('SomeLicense AND DocumentRef-X:LicenseRef-Y', () => {
                expect(normalize('SomeLicense AND DocumentRef-X:LicenseRef-Y')).toStrictEqual('SomeLicense AND DocumentRef-X:LicenseRef-Y')
            })

            it('SomeLicense AND LicenseRef-Z', () => {
                expect(normalize('SomeLicense AND LicenseRef-Z')).toStrictEqual('SomeLicense AND LicenseRef-Z')
            })
        })

        describe('when not yet in order', () => {

            it('DocumentRef-X:LicenseRef-Y AND SomeLicense', () => {
                expect(normalize('DocumentRef-X:LicenseRef-Y AND SomeLicense')).toStrictEqual('SomeLicense AND DocumentRef-X:LicenseRef-Y')
            })

            it('LicenseRef-Z AND SomeLicense', () => {
                expect(normalize('LicenseRef-Z AND SomeLicense')).toStrictEqual('SomeLicense AND LicenseRef-Z')
            })
        })
    })
})
