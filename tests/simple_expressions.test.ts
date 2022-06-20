import {parseSpdxExpression as parse, parseSpdxExpressionWithDetails} from '../src'

describe('Simple expressions', () => {

    describe('without license exception', () => {
    
        it('do not have to be actual known license identifiers', () => {
            expect(parse('XYZ-1.2')).toStrictEqual({ license: 'XYZ-1.2' })
        })
    
        it('are trimmed of leading/trailing whitespace', () => {
            expect(parse(' \t \n GPL-3.0')).toStrictEqual({ license: 'GPL-3.0' })
            expect(parse('GPL-3.0 \t \n ')).toStrictEqual({ license: 'GPL-3.0' })
        })

        describe('examples', () => {
            ['GPL-1.0', 'GPL-2.0', 'GPL-3.0', 'GPL-3.0+', 'LGPL-3.0-only', 'BSD-3-Clause', 'MIT', 'Apache-2.0'].forEach(licenseString => {
                it(JSON.stringify(licenseString), () => {
                    expect(parse(licenseString)).toStrictEqual({ license: licenseString })
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
            expect(parse('GPL-3.0 WITH AutoConf-exception-2.0')).toStrictEqual({
                license: 'GPL-3.0', exception: 'AutoConf-exception-2.0'
            })
        })

        describe('examples', () => {
            const licenseName = 'GPL-3.0'
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
})
