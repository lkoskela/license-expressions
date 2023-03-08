import { execSync } from 'child_process'
import { readFileSync, existsSync, statSync } from 'fs'
import path from 'path'

import * as tmp from 'tmp'

import normalize from '../../src/normalizer'

const isFile = (path: string|undefined): boolean => !!path && existsSync(path) && statSync(path).isFile()

type ShellCommandOutput = {
    stdout: string
    stderr: string
}
const executeShellCommand = (cmd: string): ShellCommandOutput => {
    let stdin = tmp.fileSync({prefix: 'stdin-'})
    let stdout = tmp.fileSync({prefix: 'stdout-'})
    let stderr = tmp.fileSync({prefix: 'stderr-'})
    execSync(cmd, { stdio: [ stdin.fd, stdout.fd, stderr.fd ] })
    return {
        stdout: readFileSync(stdout.name, { encoding: 'utf-8' }),
        stderr: readFileSync(stderr.name, { encoding: 'utf-8' })
    }
}

/**
 * Utility for toggling between skipping and not skipping a given test.
 *
 * @param condition pass a truthy value to execute the test, falsy to skip it
 * @returns either Jest's standard {@link it} or {@link it.skip}
 */
const itif = (condition: any) => (!!condition) ? it : it.skip

describe('CLI', () => {

    const packageJson = JSON.parse(readFileSync('package.json', { encoding: 'utf-8' }))
    const binScript: string|undefined = packageJson.bin?.spdx
    const definedBinScriptExists = isFile(binScript)

    describe('project configuration (package.json)', () => {

        it('defines a bin script', () => {
            expect(packageJson.bin?.spdx).toBeDefined()
            expect(definedBinScriptExists).toBeTrue()
        })

        itif(definedBinScriptExists)('the bin script has a shebang', () => {
            const binScript = readFileSync(packageJson.bin.spdx, { encoding: 'utf-8' })
            const lines = binScript.split('\n')
            expect(lines).toInclude('#!/usr/bin/env node')
        })
    })

    describe('CLI execution', () => {

        beforeAll(() => {
            // make sure our "bin" script is linked, putting the `spdx` executable in the path
            if (binScript) {
                try {
                    executeShellCommand(`which spdx`)
                } catch {
                    executeShellCommand('npm link')
                }
            }
        })

        it('without an explicit "mode" implies -p (i.e. parse)', () => {
            const outputWithImplicitMode = executeShellCommand('spdx foo').stdout
            const outputWithExplicitParseMode = executeShellCommand('spdx -p foo').stdout
            expect(outputWithImplicitMode).toBe(outputWithExplicitParseMode)
        })

        describe('parsing (-p)', () => {

            describe('parameter aliases', () => {
                it('--parse is equivalent to -p', () => {
                    const dashP = executeShellCommand(`spdx -p foo`).stdout
                    expect(executeShellCommand(`spdx --parse foo`).stdout).toStrictEqual(dashP)
                })
            })

            describe('without the -s parameter', () => {
                it('implies liberal parsing', () => {
                    const { stdout, stderr } = executeShellCommand('spdx "foo and bar are not valid identifiers"')
                    expect(stderr).toBe('')
                    expect(stdout).not.toBe('')
                    expect(JSON.parse(stdout)).toStrictEqual({
                        expression: {
                            conjunction: 'and',
                            left: { license: 'foo' },
                            right: { license: 'bar are not valid identifiers' }
                        },
                        errors: [
                            'Unknown SPDX license identifier: "foo"',
                            'Unknown SPDX license identifier: "bar are not valid identifiers"'
                        ]
                    })
                })
            })

            describe('with the -s parameter', () => {
                it('implies strict parsing', () => {
                    const { stdout, stderr } = executeShellCommand('spdx -s "foo and bar are not valid identifiers"')
                    expect(stderr).toBe('')
                    expect(stdout).not.toBe('')
                    expect(JSON.parse(stdout)).toStrictEqual({
                        errors: [
                            "Strict parsing for \"foo and bar are not valid identifiers\" failed:" +
                            " Syntax Error at line 1:4. Expected one of  'WITH', 'AND', 'OR'"
                        ]
                    })
                })
            })
        })

        describe('validating (-v)', () => {

            describe('parameter aliases', () => {
                it('--validate is equivalent to -v', () => {
                    const dashV = executeShellCommand(`spdx -v foo`).stdout
                    expect(executeShellCommand(`spdx --validate foo`).stdout).toStrictEqual(dashV)
                })
            })

            describe('valid SPDX expression with known license identifiers', () => {
                it('results in { valid: true }', () => {
                    const { stdout } = executeShellCommand('spdx -v "GPL-3.0-or-later"')
                    expect(JSON.parse(stdout)).toStrictEqual({ errors: [], valid: true })
                })
            })

            describe('valid SPDX expression with unknown license identifier', () => {
                it('results in { valid: false }', () => {
                    const { stdout } = executeShellCommand('spdx -v "not-a-license-id"')
                    expect(JSON.parse(stdout)).toStrictEqual({
                        errors: [ "Unknown SPDX license identifier: \"not-a-license-id\"" ],
                        valid: false
                    })
                })
            })

            describe('valid SPDX expression with badly formatted unknown license identifier', () => {
                it('results in { valid: false }', () => {
                    const { stdout } = executeShellCommand('spdx -v "not a license id"')
                    expect(JSON.parse(stdout)).toStrictEqual({
                        errors: [ "Unknown SPDX license identifier: \"not a license id\"" ],
                        valid: false
                    })
                })
            })

            describe('invalid SPDX expression syntax', () => {
                it('results in { valid: false }', () => {
                    const { stdout } = executeShellCommand('spdx -v "not even |n proper format?"')
                    expect(JSON.parse(stdout)).toStrictEqual({
                        errors: [ "Syntax Error at line 1:4. Expected one of  'WITH', 'AND', 'OR'" ],
                        valid: false
                    })
                })
            })
        })

        describe('normalization (-n)', () => {
            const normalizeWithCLI = (input: string): string => executeShellCommand(`spdx -n ${JSON.stringify(input)}`).stdout

            describe('parameter aliases', () => {
                it('--normalize is equivalent to -n', () => {
                    const dashN = executeShellCommand(`spdx -n foo`).stdout
                    expect(executeShellCommand(`spdx --normalize foo`).stdout).toStrictEqual(dashN)
                    expect(executeShellCommand(`spdx --normalise foo`).stdout).toStrictEqual(dashN)
                })
            })

            it ('output ends with a newline character', () => {
                expect(normalizeWithCLI('BSD-3-Clause')).toEndWith('\n')
            })

            describe('for valid expressions', () => {
                const inputs = [
                    'Apache-2.0',
                    'apache 2.0',
                    'mit and apache',
                    'gplv3 with classpath-exception'
                ]
                inputs.forEach(input => {
                    const expected = normalize(input) + '\n'
                    it(`matches the API behavior for ${JSON.stringify(input)} => ${JSON.stringify(expected)}`, () => {
                        expect(normalizeWithCLI(input)).toStrictEqual(expected)
                    })
                })
            })
        })
    })
})