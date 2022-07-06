import { validate } from '../src'

expect.extend({
    toPassValidation(received: string) {
        const result = validate(received)
        try {
            expect(result).toStrictEqual({ valid: true, errors: [] })
            return { pass: true, message: () => '' }
        } catch (e) {
            return {
                pass: false,
                message: () => `${JSON.stringify(received)} should pass validation.\n${e}`
            }
        }
    },
    toFailValidation(received: string) {
        const result = validate(received)
        // fail the matcher if validation passed against our expectation:
        if (result.valid) {
            return {
                message: () => `${JSON.stringify(received)} should fail validation`,
                pass: false
            }
        }
        // fail the matcher if validation failed but no error messages were provided:
        try {
            expect(result.errors).toContainEqual(expect.any(String))
        } catch (e) {
            return {
                message: () => `${JSON.stringify(received)} should fail validation with at least one error message.\n${e}`,
                pass: false
            }
        }
        // pass the matcher if validation failed with at least one error message provided:
        return { message: () => '', pass: true }
    },
    toFailValidationWith(received: string, withErrors: string[]) {
        const result = validate(received)
        // fail the matcher if validation passed against our expectation:
        if (result.valid) {
            return {
                message: () => `${JSON.stringify(received)} should fail validation`,
                pass: false
            }
        }
        // fail the matcher if validation failed but the actual error messages differ from those expected:
        try {
            expect(result.errors).toStrictEqual(withErrors)
        } catch (e) {
            return {
                message: () => `${JSON.stringify(received)} should fail validation with errors ${JSON.stringify(withErrors)}\n${e}`,
                pass: false
            }
        }
        // pass the matcher if validation failed with the expected error messages:
        return { message: () => '', pass: true }
    }
})

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace jest {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        interface Matchers<R> {
            toPassValidation(): R;
            toFailValidation(): R;
            toFailValidationWith(withErrors: string[]): R;
        }
    }
}


const scenario = (name: string, body: (name: string) => void) => it(name, () => {
    body(name)
})

const shouldPassValidation = (expression: string) => {
    scenario(expression, (id) => expect(id).toPassValidation())
}

const shouldFailValidation = (expression: string, errors: string[]) => {
    scenario(expression, (id) => expect(id).toFailValidationWith(errors))
}

describe('Examples passing validation', () => {

    describe('license references', () => {
        shouldPassValidation('LicenseRef-Foo')
        shouldPassValidation('DocumentRef-Foo:LicenseRef-Bar')
    })

    describe('license identifiers', () => {

        describe('without exception', () => {
            shouldPassValidation('Apache-2.0')
            shouldPassValidation('MIT')
            shouldPassValidation('GPL-2.0-or-later')
            shouldPassValidation('LGPL-2.0+')
        })

        describe('with exception', () => {

            describe('intended for the associated license', () => {

                // Autoconf-exception-2.0 is "typically used with GPL-2.0"
                describe('Autoconf-exception-2.0', () => {
                    shouldPassValidation('GPL-2.0 WITH Autoconf-exception-2.0')
                    shouldPassValidation('GPL-2.0-only WITH Autoconf-exception-2.0')
                    shouldPassValidation('GPL-2.0-or-later WITH Autoconf-exception-2.0')
                })

                // Autoconf-exception-3.0 is "typically used with GPL-3.0"
                describe('Autoconf-exception-3.0', () => {
                    shouldPassValidation('GPL-3.0 WITH Autoconf-exception-3.0')
                    shouldPassValidation('GPL-3.0-only WITH Autoconf-exception-3.0')
                    shouldPassValidation('GPL-3.0-or-later WITH Autoconf-exception-3.0')
                })

                // u-boot-exception-2.0 is "typically used with GPL-2.0+"
                describe('u-boot-exception-2.0', () => {
                    // all variations of GPL-2.0 should be fine:
                    shouldPassValidation('GPL-2.0 WITH u-boot-exception-2.0')
                    shouldPassValidation('GPL-2.0-only WITH u-boot-exception-2.0')
                    shouldPassValidation('GPL-2.0-or-later WITH u-boot-exception-2.0')
                    // newer GPL versions should also be fine:
                    shouldPassValidation('GPL-3.0 WITH u-boot-exception-2.0')
                    shouldPassValidation('GPL-3.0-only WITH u-boot-exception-2.0')
                    shouldPassValidation('GPL-3.0-or-later WITH u-boot-exception-2.0')
                })

                // freertos-exception-2.0 has been associated with GPL-2.0 (originally) and
                // then MIT (after Amazon acquired the FreeRTOS project)
                describe('freertos-exception-2.0', () => {
                    shouldPassValidation('GPL-2.0 WITH freertos-exception-2.0')
                    shouldPassValidation('MIT WITH freertos-exception-2.0')
                })
            })
        })
    })

    describe('compound expressions', () => {
        shouldPassValidation('(MIT OR Apache-2.0)')
        shouldPassValidation('(MIT OR Apache-2.0) AND (GPL-2.0-or-later OR LGPL-3.0)')
        shouldPassValidation('((MIT OR Apache-2.0) AND (GPL-2.0-or-later OR LGPL-3.0))')
        shouldPassValidation('MIT OR (Apache-2.0 AND (GPL-2.0-or-later OR LGPL-3.0))')
    })
})

describe('Examples failing validation', () => {

    it('Empty input', () => {
        expect('').toFailValidationWith(['Unknown SPDX identifier: ""'])
    })

    it('Syntactically invalid input', () => {
        expect('License identifiers must not contain "$peciâl" characters').toFailValidation()
    })

    describe('Syntactically valid but unknown license identifier', () => {
        ['No-Such-License', 'Apache-2.4', 'GPL-2.1'].forEach(id => {
            shouldFailValidation(id, [`Unknown SPDX license identifier: ${JSON.stringify(id)}`])
        })
    })

    describe('Syntactically valid but unknown exception identifier', () => {

        shouldFailValidation('MIT WITH No-Such-Exception',
            ['Unknown SPDX exception identifier: "No-Such-Exception"'])

        shouldFailValidation('GPL-2.0 WITH Autoconf-exception-2.1',
            ['Unknown SPDX exception identifier: "Autoconf-exception-2.1"'])
    })

    describe('Syntactically valid but unknown license AND exception identifier', () => {

        shouldFailValidation('No-Such-License WITH No-Such-Exception', [
            'Unknown SPDX license identifier: "No-Such-License"',
            'Unknown SPDX exception identifier: "No-Such-Exception"'
        ])
    })

    describe('Syntactically invalid license identifier', () => {

        shouldFailValidation('NOT A VALID EXPRESSION',
            ['Unknown SPDX license identifier: "NOT A VALID EXPRESSION"'])
    })

    describe('Syntactically invalid exception identifier', () => {

        shouldFailValidation('Apache-2.0 WITH NOT A VALID EXCEPTION',
            [ 'Unknown SPDX exception identifier: "NOT A VALID EXCEPTION"' ])
    })

    describe('Exception associated with unrelated license', () => {

        // FLTK-exception is specified to be associated with LGPL-2.0
        scenario('LGPL-3.0 WITH FLTK-exception', (id) => {
            expect(validate(id)).toStrictEqual({
                valid: false,
                errors: [ expect.stringContaining(`Exception associated with unrelated license: "LGPL-3.0-only WITH FLTK-exception"`) ]
            })
        })

        // u-boot-exception-2.0 is typically used with GPL-2.0+
        scenario('LGPL-2.1 WITH u-boot-exception-2.0', (id) =>
            expect(validate(id)).toStrictEqual({
                valid: false,
                errors: [ expect.stringContaining(`Exception associated with unrelated license: "LGPL-2.1-only WITH u-boot-exception-2.0"`) ]
            })
        )

        // freertos-exception-2.0 has been associated with GPL-2.0 (originally) and then MIT (after Amazon acquired the FreeRTOS project)
        scenario('BSD-2-Clause WITH freertos-exception-2.0', (id) => {
            expect(validate(id)).toStrictEqual({
                valid: false,
                errors: [ expect.stringContaining(`Exception associated with unrelated license: ${JSON.stringify(id)}`) ]
            })
        })
    })
})
