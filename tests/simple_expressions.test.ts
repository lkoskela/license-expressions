import 'jest-extended'

import {parseSpdxExpression as parse} from '../src'
import licenses from '../src/codegen/licenses.json'
import { LicenseInfo } from '../src/parser/types'


const nonDeprecatedLicenseIds = licenses.licenses.filter(l => !l.isDeprecatedLicenseId).map(l => l.licenseId).sort()
const deprecatedLicenseIds = licenses.licenses.filter(l => l.isDeprecatedLicenseId).map(l => l.licenseId).sort()

describe('Simple expressions', () => {

    describe('without license exception', () => {

        it('do not have to be actual known license identifiers', () => {
            expect(parse('XYZ-1.2')).toStrictEqual({ license: 'XYZ-1.2' })
        })

        it('are trimmed of leading/trailing whitespace', () => {
            expect(parse(' \t \n MIT')).toStrictEqual({ license: 'MIT' })
            expect(parse('MIT \t \n ')).toStrictEqual({ license: 'MIT' })
        })

        it('all non-deprecated licenses should be parsed as-is', () => {
            nonDeprecatedLicenseIds.forEach(id => expect(parse(id)).toStrictEqual({ license: id }))
        })

        it('deprecated licenses might be somewhat altered around the end', () => {
            deprecatedLicenseIds.forEach(id => {
                const expectedPrefix = id.replace(/\+$/, '')
                expect((parse(id) as LicenseInfo).license).toStartWith(expectedPrefix)
            })
        })

        describe('samples (randomized)', () => {
            describe('non-deprecated licenses', () => {
                const randomIds = [...nonDeprecatedLicenseIds].sort(() => .5 - Math.random()).slice(0, 10).sort()
                randomIds.forEach(id => {
                    it(`${id}  =>  ${id}`, () => expect(parse(id)).toStrictEqual({ license: id }))
                })
            })

            describe('deprecated licenses might be somewhat altered', () => {
                const randomIds = [...deprecatedLicenseIds].sort(() => .5 - Math.random()).slice(0, 10).sort()
                randomIds.forEach(id => {
                    const expectedPrefix = id.replace(/\+$/, '')
                    it(`${id} starts with ${JSON.stringify(expectedPrefix)} after alteration`, () => {
                        expect((parse(id) as LicenseInfo).license).toStartWith(expectedPrefix)
                    })
                })
            })
        })
    })

    describe('that are license references', () => {
        it('are identified as licencerefs, not license identifiers', () => {
            expect(parse('LicenseRef-MIT-Style-1')).toStrictEqual({
                documentRef: undefined,
                licenseRef: 'LicenseRef-MIT-Style-1'
            })
            expect(parse('LicenseRef-23')).toStrictEqual({
                documentRef: undefined,
                licenseRef: 'LicenseRef-23'
            })
            expect(parse('DocumentRef-X:LicenseRef-Y')).toStrictEqual({
                documentRef: 'DocumentRef-X',
                licenseRef: 'LicenseRef-Y'
            })
        })

        it('includes a DocumentRef when available', () => {
            const fullResult = parse('DocumentRef-spdx-tool-1.2:LicenseRef-MIT-Style-2')
            expect(fullResult).toMatchObject({
                documentRef: 'DocumentRef-spdx-tool-1.2',
                licenseRef: 'LicenseRef-MIT-Style-2'
            })
        })
    })

    describe('with license exception', () => {
        it('identifies the exception along with the license it belongs to', () => {
            expect(parse('GPL-3.0-only WITH Autoconf-exception-2.0')).toStrictEqual({
                license: 'GPL-3.0-only', exception: 'Autoconf-exception-2.0'
            })
        })

        describe('examples', () => {
            const licenseName = 'GPL-3.0-only'
            const exceptions = ['Bison-exception-2.2', 'Autoconf-exception-3.0']
            exceptions.forEach(exceptionName => {
                it(`${licenseName} WITH ${exceptionName}`, () => {
                    expect(parse(`${licenseName} WITH ${exceptionName}`)).toStrictEqual({
                        license: licenseName, exception: exceptionName
                    })
                })
            })
        })
    })

    describe('with a syntactically correct but unknown exception', () => {
        it('render the identifier in its original form', () => {
            expect(parse('MIT WITH Fake-1.1')).toStrictEqual({ license: 'MIT', exception: 'Fake-1.1' })
        })
    })

    describe('with a syntactically correct but unknown license', () => {
        it('render the identifier in its original form', () => {
            expect(parse('Fake')).toStrictEqual({ license: 'Fake' })
        })
    })
})
