import assert from 'assert'

import { ConjunctionInfo, parse } from '../src'
import { licenses, correctLicenseId } from '../src/licenses'

const scenario = (name: string, body: (name: string) => void) => it(name, () => {
    body(name)
})

const and = (left: string|ConjunctionInfo, right: string|ConjunctionInfo) => conjunction('and', left, right)
const or = (left: string|ConjunctionInfo, right: string|ConjunctionInfo) => conjunction('or', left, right)

const conjunction = (type: 'and'|'or', left: string|ConjunctionInfo, right: string|ConjunctionInfo): ConjunctionInfo => {
    const leftValue = typeof(left) === 'string' ? { license: left } : left
    const rightValue = typeof(right) === 'string' ? { license: right } : right
    return { conjunction: type, left: leftValue, right: rightValue }
}

describe('correctLicenseId', () => {
    it('handles the GPL family okay', () => {
        expect(correctLicenseId('Lesser General Public License v3.0', true)).toBe('LGPL-3.0-or-later')
        expect(correctLicenseId('General Public License v3.0', true)).toBe('General Public License v3.0')
        expect(correctLicenseId('Affero General Public License v3.0', true)).toBe('AGPL-3.0-or-later')
        expect(correctLicenseId('GNU Affero General Public License v3.0', true)).toBe('AGPL-3.0-or-later')
        expect(correctLicenseId('GNU General Public License v3.0', true)).toBe('GPL-3.0-or-later')
        expect(correctLicenseId('GNU Lesser General Public License v3.0', true)).toBe('LGPL-3.0-or-later')
    })
})

describe('Exact matches of license names', () => {

    it('are accepted/corrected in liberal mode', () => {
        expect(parse('Mozilla Public License 2.0', { strictSyntax: false })).toStrictEqual({ license: 'MPL-2.0' })
        expect(parse('The Unlicense', { strictSyntax: false })).toStrictEqual({ license: 'Unlicense' })
    })

    it('are not accepted/corrected in strict mode', () => {
        expect(() => parse('Mozilla Public License 2.0', { strictSyntax: true })).toThrow()
        expect(() => parse('The Unlicense', { strictSyntax: true })).toThrow()
    })
})

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

describe('Deprecated "default" GPL versions are coerced into their non-deprecated, explicit alias when {upgradeGPLVariants: true}', () => {
    describe('LGPL', () => {
        it('LGPL-2.0 with upgrade option enabled', () => {
            expect(parse('LGPL-2.0-only', { upgradeGPLVariants: true })).toStrictEqual({ license: 'LGPL-2.0-only' })
            expect(parse('LGPL-2.0', { upgradeGPLVariants: true })).toStrictEqual({ license: 'LGPL-2.0-only' })
            expect(parse('LGPL-2.0-or-later', { upgradeGPLVariants: true })).toStrictEqual({ license: 'LGPL-2.0-or-later' })
            expect(parse('LGPL-2.0+', { upgradeGPLVariants: true })).toStrictEqual({ license: 'LGPL-2.0-or-later' })
        })

        it('LGPL-2.0 with upgrade option implicitly disabled', () => {
            expect(parse('LGPL-2.0-only')).toStrictEqual({ license: 'LGPL-2.0-only' })
            expect(parse('LGPL-2.0')).toStrictEqual({ license: 'LGPL-2.0' })
            expect(parse('LGPL-2.0-or-later')).toStrictEqual({ license: 'LGPL-2.0-or-later' })
            expect(parse('LGPL-2.0+')).toStrictEqual({ license: 'LGPL-2.0-or-later' })
        })

        it('LGPL-2.0 with upgrade option explicitly disabled', () => {
            expect(parse('LGPL-2.0-only', { upgradeGPLVariants: false })).toStrictEqual({ license: 'LGPL-2.0-only' })
            expect(parse('LGPL-2.0', { upgradeGPLVariants: false })).toStrictEqual({ license: 'LGPL-2.0' })
            expect(parse('LGPL-2.0-or-later', { upgradeGPLVariants: false })).toStrictEqual({ license: 'LGPL-2.0-or-later' })
            expect(parse('LGPL-2.0+', { upgradeGPLVariants: false })).toStrictEqual({ license: 'LGPL-2.0-or-later' })
        })

        it('LGPL-2.1', () => {
            expect(parse('LGPL-2.1', { upgradeGPLVariants: false })).toStrictEqual({ license: 'LGPL-2.1' })
            expect(parse('LGPL-2.1-only', { upgradeGPLVariants: false })).toStrictEqual({ license: 'LGPL-2.1-only' })
            expect(parse('LGPL-2.1-or-later', { upgradeGPLVariants: false })).toStrictEqual({ license: 'LGPL-2.1-or-later' })
            expect(parse('LGPL-2.1+', { upgradeGPLVariants: false })).toStrictEqual({ license: 'LGPL-2.1-or-later' })
            expect(parse('LGPL-2.1', { upgradeGPLVariants: true })).toStrictEqual({ license: 'LGPL-2.1-only' })
            expect(parse('LGPL-2.1-only', { upgradeGPLVariants: true })).toStrictEqual({ license: 'LGPL-2.1-only' })
            expect(parse('LGPL-2.1-or-later', { upgradeGPLVariants: true })).toStrictEqual({ license: 'LGPL-2.1-or-later' })
            expect(parse('LGPL-2.1+', { upgradeGPLVariants: true })).toStrictEqual({ license: 'LGPL-2.1-or-later' })
        })

        it('LGPL-3.0', () => {
            expect(parse('LGPL-3.0', { upgradeGPLVariants: false })).toStrictEqual({ license: 'LGPL-3.0' })
            expect(parse('LGPL-3.0', { upgradeGPLVariants: true })).toStrictEqual({ license: 'LGPL-3.0-only' })
            expect(parse('LGPL-3.0-only', { upgradeGPLVariants: false })).toStrictEqual({ license: 'LGPL-3.0-only' })
            expect(parse('LGPL-3.0-only', { upgradeGPLVariants: true })).toStrictEqual({ license: 'LGPL-3.0-only' })
            expect(parse('LGPL-3.0-or-later', { upgradeGPLVariants: false })).toStrictEqual({ license: 'LGPL-3.0-or-later' })
            expect(parse('LGPL-3.0-or-later', { upgradeGPLVariants: true })).toStrictEqual({ license: 'LGPL-3.0-or-later' })
            expect(parse('LGPL-3.0+', { upgradeGPLVariants: false })).toStrictEqual({ license: 'LGPL-3.0-or-later' })
            expect(parse('LGPL-3.0+', { upgradeGPLVariants: true })).toStrictEqual({ license: 'LGPL-3.0-or-later' })
            expect(parse('LGPLv3+', { upgradeGPLVariants: false })).toStrictEqual({ license: 'LGPL-3.0-or-later' })
            expect(parse('LGPLv3+', { upgradeGPLVariants: true })).toStrictEqual({ license: 'LGPL-3.0-or-later' })
        })
    })

    describe('AGPL', () => {
        it('AGPL-1.0', () => {
            expect(parse('AGPL-1.0-only')).toStrictEqual({ license: 'AGPL-1.0-only' })
            expect(parse('AGPL-1.0-or-later')).toStrictEqual({ license: 'AGPL-1.0-or-later' })
            expect(parse('AGPL-1.0')).toStrictEqual({ license: 'AGPL-1.0' })
            expect(parse('AGPL-1.0', { upgradeGPLVariants: false })).toStrictEqual({ license: 'AGPL-1.0' })
            expect(parse('AGPL-1.0', { upgradeGPLVariants: true })).toStrictEqual({ license: 'AGPL-1.0-only' })
        })

        it('AGPL-3.0', () => {
            expect(parse('AGPL-3.0-only')).toStrictEqual({ license: 'AGPL-3.0-only' })
            expect(parse('AGPL-3.0-or-later')).toStrictEqual({ license: 'AGPL-3.0-or-later' })
            expect(parse('AGPL-3.0')).toStrictEqual({ license: 'AGPL-3.0' })
            expect(parse('AGPL-3.0', { upgradeGPLVariants: false })).toStrictEqual({ license: 'AGPL-3.0' })
            expect(parse('AGPL-3.0', { upgradeGPLVariants: true })).toStrictEqual({ license: 'AGPL-3.0-only' })
        })
    })

    describe('GPL', () => {
        it('GPL-1.0', () => {
            expect(parse('GPL-1.0-only')).toStrictEqual({ license: 'GPL-1.0-only' })
            expect(parse('GPL-1.0-or-later')).toStrictEqual({ license: 'GPL-1.0-or-later' })
            expect(parse('GPL-1.0+')).toStrictEqual({ license: 'GPL-1.0-or-later' })
            expect(parse('GPL-1.0')).toStrictEqual({ license: 'GPL-1.0' })
            expect(parse('GPL-1.0', { upgradeGPLVariants: false })).toStrictEqual({ license: 'GPL-1.0' })
            expect(parse('GPL-1.0', { upgradeGPLVariants: true })).toStrictEqual({ license: 'GPL-1.0-only' })
        })

        it('GPL-2.0', () => {
            expect(parse('GPL-2.0-only')).toStrictEqual({ license: 'GPL-2.0-only' })
            expect(parse('GPL-2.0-or-later')).toStrictEqual({ license: 'GPL-2.0-or-later' })
            expect(parse('GPL-2.0+')).toStrictEqual({ license: 'GPL-2.0-or-later' })
            expect(parse('GPL-2.0')).toStrictEqual({ license: 'GPL-2.0' })
            expect(parse('GPL-2.0', { upgradeGPLVariants: false })).toStrictEqual({ license: 'GPL-2.0' })
            expect(parse('GPL-2.0', { upgradeGPLVariants: true })).toStrictEqual({ license: 'GPL-2.0-only' })
        })

        it('GPL-3.0', () => {
            expect(parse('GPL-3.0-only')).toStrictEqual({ license: 'GPL-3.0-only' })
            expect(parse('GPL-3.0-or-later')).toStrictEqual({ license: 'GPL-3.0-or-later' })
            expect(parse('GPL-3.0+')).toStrictEqual({ license: 'GPL-3.0-or-later' })
            expect(parse('GPL-3.0')).toStrictEqual({ license: 'GPL-3.0' })
            expect(parse('GPL-3.0', { upgradeGPLVariants: false })).toStrictEqual({ license: 'GPL-3.0' })
            expect(parse('GPL-3.0', { upgradeGPLVariants: true })).toStrictEqual({ license: 'GPL-3.0-only' })
        })
    })

    describe('"LGPL-2.0" is interpreted as "LGPL-2.0-only"', () => {

        it('in a simple expression', () => {
            expect(parse('LGPL-2.0')).toStrictEqual({ license: 'LGPL-2.0' })
            expect(parse('LGPL-2.0', { upgradeGPLVariants: false })).toStrictEqual({ license: 'LGPL-2.0' })
            expect(parse('LGPL-2.0', { upgradeGPLVariants: true })).toStrictEqual({ license: 'LGPL-2.0-only' })
        })

        it('in a compound expression', () => {
            expect(parse('LGPL-2.0 OR MIT', { upgradeGPLVariants: true })).toStrictEqual({
                conjunction: 'or', left: { license: 'LGPL-2.0-only' }, right: { license:'MIT' }
            })
            expect(parse('LGPL-2.0 OR MIT', { upgradeGPLVariants: false })).toStrictEqual({
                conjunction: 'or', left: { license: 'LGPL-2.0' }, right: { license:'MIT' }
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

describe('Imaginary versions of Apache aren\'t accepted', () => {

    it('Apache-2.6', () => {
        expect(parse('Apache-2.6')).toStrictEqual({ license: 'Apache-2.6' })
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

    const testForVariationsOf = (options: { upgradeGPLVariants?: boolean }, expectedLicenseId: string, variations: string[]) => {
        variations.forEach(id => {
            it(`"${id}" is interpreted as ${expectedLicenseId}`, () => {
                expect(parse(id, options)).toStrictEqual({ license: expectedLicenseId })
            })
        })
    }

    testForVariationsOf({ upgradeGPLVariants: true }, 'GPL-2.0-only', ["GPLv2", "GPL2", "GPL-2"])
    testForVariationsOf({ upgradeGPLVariants: true }, 'GPL-3.0-only', ["GPL", "GPL3", "GPL-3", "GPLv3"])
    testForVariationsOf({}, 'GPL-2.0', ["GPLv2", "GPL2", "GPL-2"])
    testForVariationsOf({}, 'GPL-3.0', ["GPL", "GPL3", "GPL-3", "GPLv3"])
    testForVariationsOf({}, 'GPL-2.0-or-later', ["GPLv2+", "GPL2+", "GPL-2+", "GPL-2.0-and-later", "GPLv2-and-later"])
    testForVariationsOf({}, 'GPL-3.0-or-later', ["GPLv3+", "GPL3+", "GPL-3+", "GPL-3.0-and-later", "GPL3-and-later"])

    it('"LGPL-3" is interpreted as "LGPL-3.0" unless upgrading is enabled', () => {
        expect(parse('LGPL-3')).toStrictEqual({ license: 'LGPL-3.0' })
    })

    it('"LGPL-3" is interpreted as "LGPL-3.0-only when upgrading is enabled"', () => {
        expect(parse('LGPL-3', { upgradeGPLVariants: true })).toStrictEqual({ license: 'LGPL-3.0-only' })
    })

    it('"LGPL-2+" is interpreted as "LGPL-2.0-or-later"', () => {
        expect(parse('LGPL-2+')).toStrictEqual({ license: 'LGPL-2.0-or-later' })
    })
})

describe('Expressions with nonexistent version numbers', () => {

    describe('Are not corrected', () => {
        it('GPL-2.1', () => expect(parse('GPL-2.1')).toStrictEqual({ license: 'GPL-2.1' }))
    })
})

describe('Expressions with slight errors', () => {

    describe('lowercase "or", "and" and "with"', () => {

        it('foo and bar', () => expect(parse('foo and bar')).toStrictEqual({
            conjunction: 'and',
            left: { license: 'foo' },
            right: { license: 'bar'}
        }))

        it('Mit Or Gpl', () => expect(parse('Mit Or Gpl')).toStrictEqual({
            conjunction: 'or',
            left: { license: 'MIT' },
            right: { license: 'GPL-3.0'}
        }))

        it('Mit Or Gpl', () => expect(parse('Mit Or Gpl', { upgradeGPLVariants: false })).toStrictEqual({
            conjunction: 'or',
            left: { license: 'MIT' },
            right: { license: 'GPL-3.0'}
        }))

        it('Mit Or Gpl', () => expect(parse('Mit Or Gpl', { upgradeGPLVariants: true })).toStrictEqual({
            conjunction: 'or',
            left: { license: 'MIT' },
            right: { license: 'GPL-3.0-only'}
        }))
    })

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

    it('misspelled license identifier that has no fix is left as-is', () => {
        expect(parse('No Such License')).toStrictEqual({ license: 'No Such License' })
        expect(parse('No Such License WITH Classpath-exception-2.0')).toStrictEqual({ license: 'No Such License', exception: 'Classpath-exception-2.0' })
    })

    describe('keyword in the license name', () => {

        const scenario = (expected: string|any, input: string) => {
            const expectedValue = typeof(expected) === 'string' ? { license: expected } : expected as any
            it(JSON.stringify(input), () => expect(parse(input)).toStrictEqual(expectedValue))
        }

        describe('AND', () => {

            describe('alone', () => {
                describe('CDDL', () => {
                    scenario('CDDL-1.1', 'Common Development and Distribution License')
                    scenario('CDDL-1.0', 'Common Development and Distribution License 1.0')
                    scenario('CDDL-1.1', 'Common Development and Distribution License 1.1')
                    scenario('CDDL-1.0', 'Common Development and Distribution License v1.0')
                    scenario('CDDL-1.1', 'Common Development and Distribution License v1.1')
                    scenario('CDDL-1.0', 'Common Development and Distribution License version 1.0')
                    scenario('CDDL-1.1', 'Common Development and Distribution License version 1.1')
                })
            })

            describe('in a (semantic) AND conjunction', () => {
                scenario(and('CDDL-1.1', 'MIT'), 'Common Development and Distribution License AND MIT')
                scenario(and('CDDL-1.0', 'Apache-2.0'), 'Common Development and Distribution License 1.0 AND Apache-2.0')
                scenario(and('MIT', 'CDDL-1.1'), 'MIT AND Common Development and Distribution License')
                scenario(and('0BSD', 'CDDL-1.0'), '0BSD AND Common Development and Distribution License 1.0')
            })

            describe('in a (semantic) OR conjunction', () => {
                scenario(or('CDDL-1.1', 'MIT'), 'Common Development and Distribution License OR MIT')
                scenario(or('CDDL-1.0', 'Apache-2.0'), 'Common Development and Distribution License 1.0 OR Apache-2.0')
                scenario(or('MIT', 'CDDL-1.1'), 'MIT OR Common Development and Distribution License')
                scenario(or('0BSD', 'CDDL-1.0'), '0BSD OR Common Development and Distribution License 1.0')
            })
        })

        describe('OR', () => {

            describe('alone', () => {
                // baseline: the "only" versions that don't have the OR keyword in them:
                scenario('GFDL-1.1', 'GNU Free Documentation License v1.1')
                scenario('GFDL-1.2', 'GNU Free Documentation License v1.2')
                scenario('GFDL-1.3', 'GNU Free Documentation License v1.3')
                // test set 1: the "or later" versions without additional text afterwards
                scenario('GFDL-1.1-or-later', 'GNU Free Documentation License v1.1 or later')
                scenario('GFDL-1.2-or-later', 'GNU Free Documentation License v1.2 or later')
                scenario('GFDL-1.3-or-later', 'GNU Free Documentation License v1.3 or later')
                // test set 2: the "or later" versions with additional text afterwards
                scenario('GFDL-1.1-no-invariants-or-later', 'GNU Free Documentation License v1.1 or later - no invariants')
                scenario('GFDL-1.1-invariants-or-later', 'GNU Free Documentation License v1.1 or later - invariants')
                scenario('GFDL-1.2-no-invariants-or-later', 'GNU Free Documentation License v1.2 or later - no invariants')
                scenario('GFDL-1.2-invariants-or-later', 'GNU Free Documentation License v1.2 or later - invariants')
                scenario('GFDL-1.3-no-invariants-or-later', 'GNU Free Documentation License v1.3 or later - no invariants')
                scenario('GFDL-1.3-invariants-or-later', 'GNU Free Documentation License v1.3 or later - invariants')
            })

            describe('in a (semantic) AND conjunction', () => {
                scenario(and('CDDL-1.1', 'MIT'), 'Common Development and Distribution License AND MIT')
                scenario(and('MIT', 'CDDL-1.1'), 'MIT AND Common Development and Distribution License')
            })

            describe('in a (semantic) OR conjunction', () => {
                scenario(or('CDDL-1.1', 'MIT'), 'Common Development and Distribution License OR MIT')
                scenario(or('MIT', 'CDDL-1.1'), 'MIT OR Common Development and Distribution License')
            })
        })
    })

    describe('common misspellings', () => {

        describe('of an extraneous word "version" or "v" before the version number', () => {
            expect(parse('Common Public License 1.0')).toStrictEqual({ license: 'CPL-1.0' })
            expect(parse('Common Public License Version 1.0')).toStrictEqual({ license: 'CPL-1.0' })
            expect(parse('Common Public License v1.0')).toStrictEqual({ license: 'CPL-1.0' })
        })

        describe('of "or later"', () => {

            const scenario = (expectedId: string, text: string) => {
                it(JSON.stringify(text), () => expect(parse(text, { strictSyntax: false })).toMatchObject({license: expectedId}))
            }

            describe('Variations of GNU Lesser General Public License', () => {
                scenario('LGPL-3.0-or-later', 'GNU Lesser General Public License, version 3 or later')
                scenario('LGPL-3.0-or-later', 'GNU Lesser General Public License version 3 or later')
                scenario('LGPL-3.0-or-later', 'GNU Lesser General Public License version 3.0 or later')
                scenario('LGPL-3.0-or-later', 'GNU Lesser General Public License v3.0 or later')
                scenario('LGPL-3.0-or-later', 'GNU Lesser General Public License, version 3 or greater')
                scenario('LGPL-3.0-or-later', 'GNU Lesser General Public License, version 3 or newer')
                scenario('LGPL-3.0-or-later', 'Lesser General Public License, version 3.0 or later')
                scenario('LGPL-3.0-or-later', 'Lesser General Public License version 3.0 or later')
                scenario('LGPL-3.0-or-later', 'Lesser General Public License v3 or newer')
                scenario('LGPL-3.0-or-later', 'Lesser General Public License v3.0 or newer')
                scenario('LGPL-3.0-or-later', 'Lesser General Public License, version 3 or newer')
                scenario('LGPL-3.0-or-later', 'Lesser General Public License version 3 or greater')
                scenario('LGPL-3.0-or-later', 'Lesser General Public License, version 3 or newer')
            })

            describe('Variations of GNU General Public License', () => {

                it('GNU General Public License v3.0 or greater', () => {
                    const expression = 'GNU General Public License, version 3 or greater'
                    expect(parse(expression, { strictSyntax: false })).toMatchObject({license: 'GPL-3.0-or-later'})
                })

                it('GNU General Public License, v3.0 or newer', () => {
                    const expression = 'GNU General Public License, version 3 or newer'
                    expect(parse(expression, { strictSyntax: false })).toMatchObject({license: 'GPL-3.0-or-later'})
                })

                it('General Public License v3.0 or greater', () => {
                    const expression = 'General Public License, version 3 or greater'
                    expect(parse(expression, { strictSyntax: false })).toMatchObject({license: 'GPL-3.0-or-later'})
                })

                it('General Public License v3.0 or newer', () => {
                    const expression = 'General Public License, version 3 or newer'
                    expect(parse(expression, { strictSyntax: false })).toMatchObject({license: 'GPL-3.0-or-later'})
                })
            })

            describe('Variations of GNU Affero General Public License', () => {

                it('GNU Affero General Public License v3.0 or greater', () => {
                    const expression = 'GNU Affero General Public License, version 3 or greater'
                    expect(parse(expression, { strictSyntax: false })).toMatchObject({license: 'AGPL-3.0-or-later'})
                })

                it('GNU Affero General Public License v3.0 or newer', () => {
                    const expression = 'GNU Affero General Public License, version 3 or newer'
                    expect(parse(expression, { strictSyntax: false })).toMatchObject({license: 'AGPL-3.0-or-later'})
                })

                it('Affero General Public License v3.0 or greater', () => {
                    const expression = 'Affero General Public License, version 3 or greater'
                    expect(parse(expression, { strictSyntax: false })).toMatchObject({license: 'AGPL-3.0-or-later'})
                })

                it('Affero General Public License v3.0 or newer', () => {
                    const expression = 'Affero General Public License, version 3 or newer'
                    expect(parse(expression, { strictSyntax: false })).toMatchObject({license: 'AGPL-3.0-or-later'})
                })
            })
        })

        describe('of "AND" as "plus"', () => {
            describe('"plus" is not corrected when strictSyntax = true', () => {
                const examples = [
                    'Apache-2.0 plus MIT', 'CDDL-1.1 plus GPL-2.0-with-classpath-exception', 'CDDL-1.1 plus GPL-2.0 WITH Classpath-exception-2.0'
                ]
                examples.forEach(expression => {
                    it(JSON.stringify(expression), () => expect(() => parse(expression, { strictSyntax: true })).toThrowError())
                })
            })

            describe('"plus" is corrected when strictSyntax = false', () => {

                it('Apache-2.0 plus MIT', () => {
                    expect(parse('Apache-2.0 plus MIT', { strictSyntax: false })).toMatchObject({
                        conjunction: 'and',
                        left: { license: 'Apache-2.0' },
                        right: { license: 'MIT' },
                    })
                })

                it('CDDL-1.1 plus GPL-2.0 WITH Classpath-exception-2.0', () => {
                    expect(parse('CDDL-1.1 plus GPL-2.0 WITH Classpath-exception-2.0', { strictSyntax: false })).toMatchObject({
                        conjunction: 'and',
                        left: { license: 'CDDL-1.1' },
                        right: { license: 'GPL-2.0', exception: 'Classpath-exception-2.0' },
                    })
                })

                it('CDDL-1.1 plus GPL-2.0-with-classpath-exception', () => {
                    expect(parse('CDDL-1.1 plus GPL-2.0-with-classpath-exception', { strictSyntax: false })).toMatchObject({
                        conjunction: 'and',
                        left: { license: 'CDDL-1.1' },
                        right: { license: 'GPL-2.0-with-classpath-exception' },
                    })
                })
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

describe('Special cases', () => {
    describe('Magick++', () => {
        it('is left as-is', () => {
            expect(parse('Magick++')).toStrictEqual({ license: 'Magick++' })
        })
    })

    describe('Known license identifiers incorporating an exception', () => {
        describe('are left as-is', () => {
            [
                'GPL-2.0-with-autoconf-exception',
                'GPL-2.0-with-classpath-exception',
                'GPL-2.0-with-bison-exception',
                'GPL-3.0-with-GCC-exception'
            ].forEach(id => {
                it(id, () => expect(parse(id)).toStrictEqual({ license: id }))
            })
        })
    })

    describe('Unknown license identifiers incorporating an exception', () => {
        describe('are corrected if possible through splitting the identifier', () => {

            scenario('GPL-3.0-with-bison-exception', (expression) => {
                expect(parse(expression)).toStrictEqual({
                    license: 'GPL-3.0',
                    exception: 'Bison-exception-2.2'
                })
            })

            scenario('GPL-3.0-with-bison-exception', (expression) => {
                expect(parse(expression, { upgradeGPLVariants: true })).toStrictEqual({
                    license: 'GPL-3.0-only',
                    exception: 'Bison-exception-2.2'
                })
            })

            scenario('GPL-3.0-or-later-with-bison-exception', (expression) => {
                expect(parse(expression)).toStrictEqual({
                    license: 'GPL-3.0-or-later',
                    exception: 'Bison-exception-2.2'
                })
            })

            scenario('GPL-3.0+-with-bison-exception', (expression) => {
                expect(parse(expression)).toStrictEqual({
                    license: 'GPL-3.0-or-later',
                    exception: 'Bison-exception-2.2'
                })
            })

            scenario('GPL-3+-with-bison-exception', (expression) => {
                expect(parse(expression)).toStrictEqual({
                    license: 'GPL-3.0-or-later',
                    exception: 'Bison-exception-2.2'
                })
            })
        })
    })
})

describe('Parenthesized scenarios', () => {

    describe('Long form exact-name-match followed by a valid (IDENTIFIER-1.2.3)', () => {
        it('tries to match the parenthesized identifier first', () => {
            expect(parse('Mozilla Public License 2.0 (Apache-2.0)')).toStrictEqual({ license: 'Apache-2.0' })
        })
    })

    describe('Text ending with a parenthesized license name or identifier', () => {

        it('detects parenthesized identifier in liberal mode', () => {
            expect(() => parse('Mozilla Public License 2.0 (MPL-2.0)', { strictSyntax: true })).toThrow()
            expect(() => parse('Something something something (MPL 2.0)', { strictSyntax: true })).toThrow()
            expect(parse('Mozilla Public License 2.0 (MPL 2.0)', { strictSyntax: false })).toStrictEqual({ license: 'MPL-2.0' })
            expect(parse('GNU Lesser General Public License (LGPLv3+)', { strictSyntax: false })).toStrictEqual({ license: 'LGPL-3.0-or-later' })
            expect(parse('Does not have to be valid name here (Apache-2.0)', { strictSyntax: false })).toStrictEqual({ license: 'Apache-2.0' })
        })

        it('detects parenthesized exact name match in liberal mode', () => {
            expect(() => parse('It will throw in strict mode (Mozilla Public License 2.0)', { strictSyntax: true })).toThrow()
            expect(() => parse('It will throw unless there is an exact match (This is not an exact match)', { strictSyntax: false })).toThrow()
            expect(parse('Some freeform text here (Mozilla Public License 2.0)', { strictSyntax: false })).toStrictEqual({ license: 'MPL-2.0' })
            expect(parse('Blah blah blah blah (GNU Lesser General Public License v3.0 or later)', { strictSyntax: false })).toStrictEqual({ license: 'LGPL-3.0-or-later' })
        })

        it('ignores multiple parenthesized identifiers even in liberal mode', () => {
            expect(() => parse('Licensed the GPL (GPLv3+) or the Modified BSD License (BSD-3-Clause)', { strictSyntax: false })).toThrow()
            expect(parse('Licensed under the GPL (GPLv3+)', { strictSyntax: false })).toStrictEqual({ license: 'GPL-3.0-or-later' })
            expect(parse('Licensed under the Modified BSD License (BSD-3-Clause)', { strictSyntax: false })).toStrictEqual({ license: 'BSD-3-Clause' })
        })

        describe('ignores the parenthesized pattern for texts clearly longer than the longest license name', () => {
            const THRESHOLD_LENGTH = 100
            const justShortEnoughPretext = '123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789' // 99 chars
            const slightlyTooLongPretext = '123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 1'  // 101 chars

            const longestLicenseName = licenses.licenses.map(l => l.name.length).sort().reverse()[0]
            assert(THRESHOLD_LENGTH > longestLicenseName, `Our SPDX data contains license names longer than our hardcoded threshold of ${THRESHOLD_LENGTH} - we should probably increase the threshold!`)
            assert(justShortEnoughPretext.length < THRESHOLD_LENGTH, `Our "just short enough" pretext isn't short enough!`)
            assert(slightlyTooLongPretext.length > THRESHOLD_LENGTH, `Our "slightly too long" pretext isn't long enough!`)

            it(`liberal mode accepts the parenthesized pattern for text short enough to be a license name`, () => {
                expect(parse(`${justShortEnoughPretext} (Apache-2.0)`, { strictSyntax: false })).toStrictEqual({ license: 'Apache-2.0' })
            })

            it(`liberal mode ignores the parenthesized pattern for too long text preceding the parenthesis`, () => {
                expect(() => parse(`${slightlyTooLongPretext} (Apache-2.0)`, { strictSyntax: false })).toThrow()
            })
        })
    })
})

describe('full license names that contain parenthesized parts', () => {

    const scenario = (expected: string|any, input: string) => {
        const expectedValue = typeof(input) === 'string' ? { license: expected } : input as any
        it(JSON.stringify(input), () => expect(parse(input)).toStrictEqual(expectedValue))
    }

    describe('CDDL', () => {
        scenario('CDDL-1.1', 'Common Development and Distribution License (CDDL)')
        scenario('CDDL-1.0', 'Common Development and Distribution License (CDDL) 1.0')
        scenario('CDDL-1.1', 'Common Development and Distribution License (CDDL) 1.1')
        scenario('CDDL-1.0', 'Common Development and Distribution License (CDDL) v1.0')
        scenario('CDDL-1.1', 'Common Development and Distribution License (CDDL) v1.1')
        scenario('CDDL-1.0', 'Common Development and Distribution License (CDDL) version 1.0')
        scenario('CDDL-1.1', 'Common Development and Distribution License (CDDL) version 1.1')
    })

    describe('OLDAP-2.0', () => {
        scenario('OLDAP-2.0', 'Open LDAP Public License v2.0 (or possibly 2.0A and 2.0B)')
    })

    describe('SWL', () => {
        scenario('SWL', 'Scheme Widget Library (SWL) Software License Agreement')
    })

    describe('Unicode-DFS-*', () => {
        scenario('Unicode-DFS-2015', 'Unicode License Agreement - Data Files and Software (2015)')
        scenario('Unicode-DFS-2015', 'Unicode License Agreement - Data Files and Software (2015)')
    })

    describe('W3C', () => {
        scenario('W3C', 'W3C Software Notice and License (2002-12-31)')
        scenario('W3C-19980720', 'W3C Software Notice and License (1998-07-20)')
        scenario('W3C-20150513', ' W3C Software Notice and Document License (2015-05-13)')
    })

    describe('Artistic', () => {
        scenario('Artistic-1.0-Perl', 'Artistic License 1.0 (Perl)')
    })

    describe('BSD-4-Clause-UC', () => {
        scenario('BSD-4-Clause-UC', 'BSD-4-Clause (University of California-Specific)')
    })

    describe('CAL-1.0-Combined-Work-Exception', () => {
        scenario('CAL-1.0-Combined-Work-Exception', 'Cryptographic Autonomy License 1.0 (Combined Work Exception)')
    })

    describe('FSF Unlimited License (with License Retention)', () => {
        scenario('FSFULLR', 'FSF Unlimited License (with License Retention)')
    })

    describe('FSFULLRWD', () => {
        scenario('FSFULLRWD', 'FSF Unlimited License (With License Retention    and Warranty Disclaimer)')
        scenario('FSFULLRWD', 'FSF Unlimited License (With License Retention and Warranty Disclaimer)')
    })

    describe('LZMA', () => {
        scenario('LZMA-SDK-9.11-to-9.20', 'LZMA SDK License (versions 9.11 to 9.20)')
        scenario('LZMA-SDK-9.22', 'LZMA SDK License (versions 9.22 and beyond)')
    })

    describe('Enlightenment', () => {
        scenario('MIT-advertising', 'Enlightenment License (e16)')   // "MIT-advertising" is not a typo :)
    })

    describe('MPL-2.0', () => {
        scenario('MPL-2.0-no-copyleft-exception', 'Mozilla Public License 2.0 (no copyleft exception)')
    })

    describe('NAIST-2003', () => {
        scenario('NAIST-2003', 'Nara Institute of Science and Technology License (2003)')
    })

    describe('NLOD', () => {
        scenario('NLOD-1.0', 'Norwegian Licence for Open Government Data (NLOD) 1.0')
        scenario('NLOD-2.0', 'Norwegian Licence for Open Government Data (NLOD) 2.0')
    })
})