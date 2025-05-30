import { parse as parseWithStrictParser, StrictParserResult } from './strict_parser'
import { parse as parseWithLiberalParser, LiberalParserResult } from './liberal_parser'
import { ParsedSpdxExpression, ConjunctionInfo, LicenseInfo, LicenseRef } from './types'
import { fixDashedLicenseInfo, findNameBasedMatch, licenses } from '../licenses'
import validate from '../validator'


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
            .replace(/\s[wW]\/\s?/, ' WITH ')         // expand "w/" shorthand for "WITH"
            .replace(/\splus\s/, ' AND ')             // replace the literal word "plus" with "AND"
    }
    return cleanedInput
}

const compileFullSpdxParseResult = (input: string, parserResult: StrictParserResult | LiberalParserResult): FullSpdxParseResult => {
    return { input, ast: parserResult.parse?.ast, error: parserResult.error, expression: parserResult.expression }
}

const buildErrorMessage = (input: string, strictSyntax: boolean): string => {
    return `${strictSyntax ? 'Strict':'Liberal'} parsing for ${JSON.stringify(input)} failed`
}

export type ParseOptions = {
    strictSyntax?: boolean,
    upgradeGPLVariants?: boolean,
}

/**
 * Parse an SPDX expression into a structured object representation.
 *
 * @param input SPDX expression as a string to be parsed.
 * @returns {ParsedSpdxExpression} A structured object describing the given SPDX expression
 *          or throws an `Error` if parsing failed.
 */
export function parse(input: string, parseOptions?: ParseOptions) : ParsedSpdxExpression {
    const strictSyntax = !!(parseOptions?.strictSyntax)
    const upgradeGPLVariants = !!(parseOptions?.upgradeGPLVariants)
    const data = parseSpdxExpressionWithDetails(input, strictSyntax, upgradeGPLVariants)
    if (data.error) {
        throw new Error([buildErrorMessage(input, strictSyntax), data.error].join(': '))
    } else if (data.expression === undefined) {
        /* istanbul ignore next */ throw new Error(buildErrorMessage(input, strictSyntax))
    }
    return data.expression
}


/**
 * Preprocess the original input for the liberal parser, detecting ~full license name matches
 * that would syntactically fail parsing (e.g. due to parenthesis or keywords such as "and").
 *
 * @param input The input to "clean up" before lexical parsing
 * @returns The preprocessed string ready to be fed to the parser
 */
const prepareLiberalInput = (input: string): string => {
    type Mutation = (input: string) => string

    // List of (hand-crafted) mutations to apply, replacing license names with a matching identifier
    const mutations: Mutation[] = [
        // CDDL
        (input: string): string => {
            const pattern = /Common Development and Distribution License( \(CDDL\))?( (v|version )?(1\.[10]))?/im
            const match = input.match(pattern)
            if (match) {
                const replacement = !!(match[4]) ? 'CDDL-$4' : 'CDDL-1.1' // default to the latest version, i.e. 1.1
                return input.replace(pattern, replacement)
            }
            return input
        },
        // FSF Unlimited License (With License Retention    and Warranty Disclaimer)
        (input: string): string => {
            const pattern = /FSF\s+Unlimited\s+License\s+\(With\s+License\s+Retention\s+and\s+Warranty\s+Disclaimer\)/im
            const match = input.match(pattern)
            if (match) {
                return input.replace(pattern, 'FSFULLRWD')
            }
            return input
        }
    ]

    // Automated, exact-name based mutations to apply, replacing license names with a matching identifier
    const relevantLicenses = licenses.filter(license => license.name.includes('(') || license.name.match(/ and /i))
    relevantLicenses.forEach(license => {
        mutations.push((input: string): string => {
            return input.replace(license.name, license.licenseId)
        })
    })

    return mutations.reduce((result, mutation) => mutation(result), input)
}

/**
 * Parse an SPDX expression into a structured object representation along with additional
 * metadata such as the underlying AST tree used and any errors in case parsing failed.
 *
 * @param input SPDX expression as a string to be parsed.
 * @returns {FullSpdxParseResult}
 */
 export function parseSpdxExpressionWithDetails(input: string, strictSyntax: boolean = false, upgradeGPLVariants: boolean = false) : FullSpdxParseResult {
    // Apply general clean up on the raw input string
    const preparedInput = prepareInput(input, strictSyntax)

    // Always try to parse with the strict parser first in order to
    // minimize risk of unwanted "corrections"
    const notCorrected = parseWithStrictParser(preparedInput, upgradeGPLVariants)
    if (!!notCorrected.expression && !strictSyntax) {
        notCorrected.expression = correctDashSeparatedLicenseIds(notCorrected.expression, upgradeGPLVariants)
    }
    const strictResult = compileFullSpdxParseResult(preparedInput, notCorrected)

    // If strict parsing failed, attempt to apply corrections if allowed
    if (strictResult.error && !strictSyntax)  {

        const liberallyPreparedInput = prepareLiberalInput(preparedInput)

        const corrected = parseWithLiberalParser(liberallyPreparedInput, upgradeGPLVariants)
        if (corrected.expression) {
            corrected.expression = correctDashSeparatedLicenseIds(corrected.expression, upgradeGPLVariants)
        }

        const liberalResult = compileFullSpdxParseResult(liberallyPreparedInput, corrected)

        // If the license identifier happens to be an exact match of a license name...
        const nameBasedMatch = findNameBasedMatch((liberalResult.expression as LicenseInfo)?.license || preparedInput, upgradeGPLVariants)
        if (nameBasedMatch !== undefined) {
            return parseSpdxExpressionWithDetails(nameBasedMatch.licenseId, true, upgradeGPLVariants)
        }

        // We'll use the results of liberal parsing only if it succeeds. In case
        // of failure, we'll return the errors from strict parser for maximum
        // awareness of deviations from the SPDX specification
        if (!liberalResult.error) {
            return liberalResult
        }

        // If the value looks like "Mozilla Public License 2.0 (MPL 2.0)", and is short enough
        // to look like a license name, try to parse the identifier in the parenthesis.
        // If that fails, we'll try to see if the parenthesized text is an exact match against
        // a license name in the SPDX data.
        const potentialMatchForParenthesizedPattern = preparedInput?.match(/^(.+?)\s\((.+?)\)$/)
        const pretext = potentialMatchForParenthesizedPattern?.[1]
        const potentialIdentifier = potentialMatchForParenthesizedPattern?.[2]
        if (pretext && potentialIdentifier) {
            // check if the pretext is within threshold length
            const thresholdLength = 100
            if (pretext.length < thresholdLength) {
                // check if it's an SPDX identifier
                const candidateResult = parseSpdxExpressionWithDetails(potentialIdentifier, strictSyntax, upgradeGPLVariants)
                if (!candidateResult.error && candidateResult.expression && validate(candidateResult.input).valid) {
                    return candidateResult
                }
            }
            // check for a name-based match
            const nameBasedMatch = findNameBasedMatch(potentialIdentifier, upgradeGPLVariants)
            if (nameBasedMatch) {
                return parseSpdxExpressionWithDetails(nameBasedMatch.licenseId, strictSyntax, upgradeGPLVariants)
            }
        }

        return liberalResult
    }

    // If liberal parsing was not allowed or it failed, too, let's return the
    // (possibly failed) strict parsing result
    return strictResult
}

const correctDashSeparatedLicenseIds = (expression: ParsedSpdxExpression, upgradeGPLVariants: boolean): ParsedSpdxExpression => {
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
            return fixDashedLicenseInfo(expression as LicenseInfo, upgradeGPLVariants)
        }
    }
    return recurse(expression)
}
