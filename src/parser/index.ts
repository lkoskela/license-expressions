import { parse as parseWithStrictParser, StrictParserResult } from './strict_parser'
import { parse as parseWithLiberalParser, LiberalParserResult } from './liberal_parser'
import { ParsedSpdxExpression } from './types'


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
}

const compileFullSpdxParseResult = (input: string, parserResult: StrictParserResult | LiberalParserResult): FullSpdxParseResult => {
    return { input, ast: parserResult.parse?.ast, error: parserResult.error, expression: parserResult.expression }
}

/**
 * Parse an SPDX expression into a structured object representation.
 * 
 * @param input SPDX expression as a string to be parsed.
 * @returns {ParsedSpdxExpression} A structured object describing the given SPDX expression
 *          or throws an `Error` if parsing failed.
 */
export function parseSpdxExpression(input: string, strictSyntax: boolean = false) : ParsedSpdxExpression | undefined {
    const data = parseSpdxExpressionWithDetails(input, strictSyntax)
    if (data.error) {
        throw new Error(data.error)
    }
    return data.expression
}

/**
 * Parse an SPDX expression into a structured object representation along with additional
 * metadata such as the underlying AST tree used and any errors in case parsing failed.
 * 
 * @param input SPDX expression as a string to be parsed.
 * @returns {FullSpdxParseResult} i.e. a {@link SuccessfulParse} when parsing succeees and
 *          a {@link FailedParse} if parsing fails.
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
