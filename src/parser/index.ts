import { parse as parseWithStrictParser, StrictParserResult } from './strict_parser'
import { parse as parseWithLiberalParser, LiberalParserResult } from './liberal_parser'
import { ParsedSpdxExpression, ConjunctionInfo, LicenseInfo, LicenseRef } from './types'


export { ParsedSpdxExpression, ConjunctionInfo, LicenseInfo, LicenseRef }

export type FullSpdxParseResult = {
    input: string,
    error?: string,
    ast?: any,
    expression?: ParsedSpdxExpression
}

/**
 * Clean up the given SPDX expression before processing it with the grammar.
 *
 * Currently, the clean-up is limited to:
 * 1. trimming the surrounding whitespace, and
 * 2. compressing consecutive whitespace characters into a single space.
 *
 * @param input SPDX expression as a string
 * @returns A slightly cleaned up SPDX expression as a string
 */
 const prepareInput = (input: string): string => {
    return input
        .trim()               // remove surrounding whitespace
        .replace(/\s+/, ' ')  // compress consecutive whitespaces to a single space
        .replace(/\s+and\s+/i, ' AND ')  // fix lowercase keywords
        .replace(/\s+or\s+/i, ' OR ')  // fix lowercase keywords
        .replace(/\s+with\s+/i, ' WITH ')  // fix lowercase keywords
}

const compileFullSpdxParseResult = (input: string, parserResult: StrictParserResult | LiberalParserResult): FullSpdxParseResult => {
    return { input, ast: parserResult.parse?.ast, error: parserResult.error, expression: parserResult.expression }
}

const buildErrorMessage = (input: string, strictSyntax: boolean): string => {
    return `${strictSyntax ? 'Strict':'Liberal'} parsing for ${JSON.stringify(input)} failed`
}

/**
 * Parse an SPDX expression into a structured object representation.
 *
 * @param input SPDX expression as a string to be parsed.
 * @returns {ParsedSpdxExpression} A structured object describing the given SPDX expression
 *          or throws an `Error` if parsing failed.
 */
export function parse(input: string, strictSyntax: boolean = false) : ParsedSpdxExpression {
    const data = parseSpdxExpressionWithDetails(input, strictSyntax)
    if (data.error) {
        throw new Error([buildErrorMessage(input, strictSyntax), data.error].join(': '))
    } else if (data.expression === undefined) {
        /* istanbul ignore next */ throw new Error(buildErrorMessage(input, strictSyntax))
    }
    return data.expression
}

/**
 * Parse an SPDX expression into a structured object representation along with additional
 * metadata such as the underlying AST tree used and any errors in case parsing failed.
 *
 * @param input SPDX expression as a string to be parsed.
 * @returns {FullSpdxParseResult}
 */
 export function parseSpdxExpressionWithDetails(input: string, strictSyntax: boolean = false) : FullSpdxParseResult {
    const preparedInput = prepareInput(input)
    const notCorrected = parseWithStrictParser(preparedInput)
    const strictResult = compileFullSpdxParseResult(preparedInput, notCorrected)

    // attempt to apply corrections if allowed
    if (strictResult.error && !strictSyntax)  {
        const corrected = parseWithLiberalParser(preparedInput)
        const liberalResult = compileFullSpdxParseResult(preparedInput, corrected)
        if (!liberalResult.error) {
            return liberalResult
        }
    }

    return strictResult
}
