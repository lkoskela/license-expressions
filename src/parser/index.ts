import { parse as parseWithStrictParser, StrictParserResult } from './strict_parser'
import { parse as parseWithLiberalParser, LiberalParserResult } from './liberal_parser'
import { ParsedSpdxExpression, ConjunctionInfo, LicenseInfo, LicenseRef } from './types'
import { fixDashedLicenseInfo, licenses } from '../licenses'


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
 * @param strictSyntax If {true}, don't clean up spec-violating details
 * @returns A slightly cleaned up SPDX expression as a string
 */
 const prepareInput = (input: string, strictSyntax: boolean): string => {
    let cleanedInput = input
        .trim()                // remove surrounding whitespace
        .replace(/\s+/, ' ')   // compress consecutive whitespaces to a single space
    if (!strictSyntax) {
        cleanedInput = cleanedInput
            .replace(/(?<!\s)\s+and\s+/i, ' AND ')    // fix lowercase keywords
            .replace(/(?<!\s)\s+or\s+/i, ' OR ')      // fix lowercase keywords
            .replace(/(?<!\s)\s+with\s+/i, ' WITH ')  // fix lowercase keywords
            .replace(/\s+[wW]\//, ' WITH ')           // expand "w/" shorthand for "WITH"
    }
    return cleanedInput
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
    // Apply general clean up on the raw input string
    const preparedInput = prepareInput(input, strictSyntax)

    // Always try to parse with the strict parser first in order to
    // minimize risk of unwanted "corrections"
    const notCorrected = parseWithStrictParser(preparedInput)
    if (!!notCorrected.expression && !strictSyntax) {
        notCorrected.expression = correctDashSeparatedLicenseIds(notCorrected.expression)
    }
    const strictResult = compileFullSpdxParseResult(preparedInput, notCorrected)

    // If strict parsing failed, attempt to apply corrections if allowed
    if (strictResult.error && !strictSyntax)  {
        const corrected = parseWithLiberalParser(preparedInput)
        if (corrected.expression) {
            corrected.expression = correctDashSeparatedLicenseIds(corrected.expression)
        }
        const liberalResult = compileFullSpdxParseResult(preparedInput, corrected)
        // We'll use the results of liberal parsing only if it succeeds. In case
        // of failure, we'll return the errors from strict parser for maximum
        // awareness of deviations from the SPDX specification
        if (!liberalResult.error) {
            return liberalResult
        }

        // If the license identifier happens to be an exact match of a license name...
        let nameBasedMatch = licenses.licenses.find(x => x.name === preparedInput)
        if (nameBasedMatch) {
            return parseSpdxExpressionWithDetails(nameBasedMatch.licenseId, strictSyntax)
        }
    }

    // If liberal parsing was not allowed or it failed, too, let's return the
    // (possibly failed) strict parsing result
    return strictResult
}

const correctDashSeparatedLicenseIds = (expression: ParsedSpdxExpression): ParsedSpdxExpression => {
    const recurse = (expression: ParsedSpdxExpression): ParsedSpdxExpression => {

        const fixLicenseRef = (node: LicenseRef): LicenseRef => { return node }

        const fixConjunctionInfo = (node: ConjunctionInfo): ConjunctionInfo => {
            return { conjunction: node.conjunction, left: recurse(node.left), right: recurse(node.right) }
        }

        if ((expression as ConjunctionInfo).conjunction) {
            return fixConjunctionInfo(expression as ConjunctionInfo)
        } else if ((expression as LicenseRef).licenseRef) {
            return fixLicenseRef(expression as LicenseRef)
        } else {
            return fixDashedLicenseInfo(expression as LicenseInfo)
        }
    }
    return recurse(expression)
}
