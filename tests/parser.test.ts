import {parseSpdxExpression, parseSpdxExpressionWithDetails} from '../src'
import defaultParseFunction from '../src'
import { FullSpdxParseResult } from '../src/parser'

describe('Parsing API', () => {

    const VALID_SPDX_EXPRESSION = 'XYZ-1.2'
    const WHITESPACE_IN_LICENSE_ID = 'INVALID SPDX SYNTAX'
    const INVALID_EXPRESSION = 'MIT (OR Apache-2.0)'

    describe('default export', () => {
        it('behaves exactly like parseSpdxExpression()', () => {
            const resultFromDefaultFunction = defaultParseFunction(VALID_SPDX_EXPRESSION)
            const resultFromBasicFunction = parseSpdxExpression(VALID_SPDX_EXPRESSION)
            expect(resultFromDefaultFunction).toStrictEqual(resultFromBasicFunction)
        })
    })

    describe('with parseSpdxExpression()', () => {

        it('valid expression returns the parsed license expression', () => {
            expect(parseSpdxExpression(VALID_SPDX_EXPRESSION)).toStrictEqual({ license: VALID_SPDX_EXPRESSION })
        })

        it('invalid expression throws an error if `strictSyntax` is true', () => {
            expect(() => parseSpdxExpression(WHITESPACE_IN_LICENSE_ID, true)).toThrow()
        })

        it('`strictSyntax` is `false` by default', () => {
            expect(() => parseSpdxExpression(WHITESPACE_IN_LICENSE_ID)).not.toThrow()
        })

        it('invalid expressions with whitespace in license name is tolerated if `strictSyntax` is false', () => {
            expect(() => parseSpdxExpression(WHITESPACE_IN_LICENSE_ID, false)).not.toThrow()
            expect(parseSpdxExpression(WHITESPACE_IN_LICENSE_ID, false)).toStrictEqual({ license: WHITESPACE_IN_LICENSE_ID })
        })
    })

    describe('with parseSpdxExpressionWithDetails()', () => {

        it('valid expression returns the parsed license expression along with extra data', () => {
            const actualResult = parseSpdxExpressionWithDetails(VALID_SPDX_EXPRESSION)
            expect(actualResult).toMatchObject({
                input: VALID_SPDX_EXPRESSION,
                ast: expect.any(Object),
                expression: parseSpdxExpression(VALID_SPDX_EXPRESSION),
            })
        })

        it('license name with whitespace yields an object describing the error', () => {
            expect(parseSpdxExpressionWithDetails(WHITESPACE_IN_LICENSE_ID, true)).toMatchObject({
                input: WHITESPACE_IN_LICENSE_ID,
                error: expect.stringMatching(/^Syntax Error at.*/),
                ast: expect.any(Object),
            })
        })

        it('structurally invalid expression fails even if `strictSyntax` is `false`', () => {
            expect(parseSpdxExpressionWithDetails(INVALID_EXPRESSION, true)).toMatchObject({
                input: INVALID_EXPRESSION,
                error: expect.stringMatching(/^Syntax Error at.*/),
                ast: expect.any(Object),
            })
            expect(parseSpdxExpressionWithDetails(INVALID_EXPRESSION, false)).toMatchObject({
                input: INVALID_EXPRESSION,
                error: expect.stringMatching(/^Syntax Error at.*/),
                ast: expect.any(Object),
            })
        })
    })

})
