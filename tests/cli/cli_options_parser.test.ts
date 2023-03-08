import { parseCLIOptions } from '../../src/cli/options'


describe('No options provided at all', () => {

    it('defaults to the "parse" command', () => {
        expect(parseCLIOptions(['just-an-identifier'])).toStrictEqual({
            command: 'parse',
            options: [],
            expression: 'just-an-identifier'
        })
    })
})

describe('With explicit command provided as an option', () => {

    describe('for parse command', () => {
        ['-p', '--parse'].forEach(option => {
            it(option, () => {
                expect(parseCLIOptions([option, 'just-an-identifier'])).toStrictEqual({
                    command: 'parse',
                    options: [],
                    expression: 'just-an-identifier'
                })
            })
        })
    })

    describe('for normalize command', () => {
        ['-n', '--normalize', '--normalise'].forEach(option => {
            it(option, () => {
                expect(parseCLIOptions([option, 'just-an-identifier'])).toStrictEqual({
                    command: 'normalize',
                    options: [],
                    expression: 'just-an-identifier'
                })
            })
        })
    })

    describe('for validate command', () => {
        ['-v', '--validate'].forEach(option => {
            it(option, () => {
                expect(parseCLIOptions([option, 'just-an-identifier'])).toStrictEqual({
                    command: 'validate',
                    options: [],
                    expression: 'just-an-identifier'
                })
            })
        })
    })
})

describe('Non-option arguments', () => {
    it('are assumed to belong to the same SPDX expression', () => {
        expect(parseCLIOptions(['foo', 'bar', 'xyz'])).toStrictEqual({
            command: 'parse',
            options: [],
            expression: 'foo bar xyz'
        })
    })
})

describe('command-specific options', () => {

    it('for an explicit parse command', () => {
        expect(parseCLIOptions(['-p', '-s', 'one-identifier OR another'])).toStrictEqual({
            command: 'parse',
            options: ['strict'],
            expression: 'one-identifier OR another'
        })
    })

    it('for an implicit (default) parse command', () => {
        expect(parseCLIOptions(['-s', 'one-identifier OR another'])).toStrictEqual({
            command: 'parse',
            options: ['strict'],
            expression: 'one-identifier OR another'
        })
    })

    describe('not supported by the command', () => {
        it('throw an error', () => {
            expect(() => parseCLIOptions(['-x', 'identifier'])).toThrowError(/Option -x is not supported by the parse command/)
            expect(() => parseCLIOptions(['-p', '-x', 'identifier'])).toThrowError(/Option -x is not supported by the parse command/)
            expect(() => parseCLIOptions(['-n', '-x', 'identifier'])).toThrowError(/Option -x is not supported by the normalize command/)
            expect(() => parseCLIOptions(['-v', '-x', 'identifier'])).toThrowError(/Option -x is not supported by the validate command/)
        })
    })
})
