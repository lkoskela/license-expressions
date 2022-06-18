import {parseSpdxExpression, parseSpdxExpressionWithDetails} from '../src'
import defaultParseFunction from '../src'
import { FullSpdxParseResult } from '../src/parser'

describe('Parsing API', () => {

    const VALID_SPDX_EXPRESSION = 'XYZ-1.2'
    const INVALID_SPDX_EXPRESSION = 'INVALID SPDX SYNTAX'

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

        it('invalid expression throws an error', () => {
            expect(() => parseSpdxExpression(INVALID_SPDX_EXPRESSION)).toThrow();
        })
    })

    describe('with parseSpdxExpressionWithDetails()', () => {

        it('valid expression returns the parsed license expression along with extra data', () => {
            const actualResult = parseSpdxExpressionWithDetails(VALID_SPDX_EXPRESSION)
            expect(actualResult).toMatchObject({
                input: VALID_SPDX_EXPRESSION,
                ast: expect.any(Object),
                expression: parseSpdxExpression(VALID_SPDX_EXPRESSION),
                error: null,
            })
        })

        it('invalid expression returns an object describing the error', () => {
            expect(parseSpdxExpressionWithDetails(INVALID_SPDX_EXPRESSION)).toMatchObject({
                input: INVALID_SPDX_EXPRESSION,
                error: expect.stringMatching(/^Syntax Error at.*/),
                ast: expect.any(Object),
                expression: null,
            })
        })
    })

})
