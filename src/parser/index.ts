import assert from 'assert'
import spdxCorrect from 'spdx-correct'

import * as LiberalParser from '../codegen/parser_liberal'
import * as StrictParser from '../codegen/parser_strict'
import licenses from '../codegen/licenses.json'
import exceptions from '../codegen/exceptions.json'

export type LicenseInfo = {
    license: string,
    exception?: string
}

export type LicenseRef = {
    documentRef?: string,
    licenseRef: string
}

export type ConjunctionInfo = {
    left: LicenseInfo | ConjunctionInfo | LicenseRef,
    conjunction: 'or' | 'and',
    right: LicenseInfo | ConjunctionInfo | LicenseRef
}

type FailedParse = {
    input: string,
    error: string,
    ast: null,
    expression: null
}

type SuccessfulParse = {
    input: string,
    error: null,
    ast: any,
    expression: ParsedSpdxExpression
}

export type FullSpdxParseResult = SuccessfulParse | FailedParse

export type ParsedSpdxExpression = ConjunctionInfo | LicenseInfo | LicenseRef

type MapOfIds = {
    get: (id: string) => string | undefined,
    knownAliases: () => string[]
}

const createMapOfIds = (ids: string[]): MapOfIds => {
    const mutilateId = (id: string): string => id.toUpperCase().replace(/[^0-9a-zA-Z\+]/g, '')
    const listOfOfficialIds: string[] = ids
    const mapOfLowercaseIds: Map<string, string> = new Map()
    const mapOfMutilatedIds: Map<string, string> = new Map()
    listOfOfficialIds.forEach(id => {
        mapOfLowercaseIds.set(id.toLowerCase(), id)
        mapOfMutilatedIds.set(mutilateId(id), id)
    })
    const getExactMatch = (id: string) => listOfOfficialIds.find(x => x === id)
    const getCaseInsensitiveMatch = (id: string) => {
        const lowercaseId: string = id.toLowerCase();
        const variationsToTest: string[] = [
            lowercaseId,
            lowercaseId.replace(/\s+/g, '-').replace(/(\d+)$/, '$1.0')
        ]
        return variationsToTest.map(x => mapOfLowercaseIds.get(x)).filter(m => !!m)[0]
    }
    const getFuzzyMatch = (id: string) => mapOfMutilatedIds.get(mutilateId(id))
    const get = (id: string): string | undefined => {
        return getExactMatch(id) || getCaseInsensitiveMatch(id) || getFuzzyMatch(id)
    }
    const knownAliases = (): string[] => [ ...mapOfLowercaseIds.keys(), ...mapOfMutilatedIds.keys() ].sort()
    return { get, knownAliases } as MapOfIds
}

const mapOfKnownLicenses: MapOfIds = createMapOfIds(licenses.licenses.map(lic => lic.licenseId))
const mapOfKnownExceptions: MapOfIds = createMapOfIds(exceptions.exceptions.map(e => e.licenseExceptionId))

const aliasesForLicenseIds: Map<string, string> = ((): Map<string, string> => {
    const mapOfAliases = new Map()

    // Aliases for the BSD-2-Clause license:
    mapOfAliases.set('freebsd', 'BSD-2-Clause')
    mapOfAliases.set('freebsd license', 'BSD-2-Clause')
    mapOfAliases.set('freebsd license', 'BSD-2-Clause')
    mapOfAliases.set('simplified bsd license', 'BSD-2-Clause')

    // Aliases for the BSD-3-Clause license:
    mapOfAliases.set('new bsd license', 'BSD-3-Clause')
    mapOfAliases.set('modified bsd license', 'BSD-3-Clause')

    // Aliases for the 0BSD license:
    mapOfAliases.set('zero-clause bsd', '0BSD')
    mapOfAliases.set('free public license', '0BSD')
    mapOfAliases.set('free public license 1.0.0', '0BSD')
    mapOfAliases.set('free public license 1.0', '0BSD')
    mapOfAliases.set('bsd0', '0BSD')

    // Aliases for the Apache-1.1 license:
    mapOfAliases.set('apache1.1', 'Apache-1.1')
    mapOfAliases.set('apache-1.1', 'Apache-1.1')
    mapOfAliases.set('apache software license', 'Apache-1.1')
    mapOfAliases.set('apache software license 1.1', 'Apache-1.1')
    mapOfAliases.set('apache software license version 1.1', 'Apache-1.1')

    return mapOfAliases
})()

const aliasesForExceptions: Map<string, string> = ((): Map<string, string> => {
    const mapOfAliases = new Map<string, string>()
    return mapOfAliases
})()

const correctLicenseId = (id: string): string => {

    // The `spdx-correct` package does not have fixes for everything (e.g. a common misspelling for the
    // zero-clause variant of the BSD license or for names such as "The Simplified BSD license") so we'll
    // check for a list of known aliases ourselves:
    const applyAliases = (id: string): string => {
        const lowercaseId = id.toLowerCase().replace(/^the /, '')
        return aliasesForLicenseIds.get(lowercaseId) || aliasesForLicenseIds.get(`the ${lowercaseId}`) || id
    }

    // The `spdx-correct` package will coerce "GPL-3.0" into "GPL-3.0-or-later", although
    // "GPL-3.0-only" would be more true to the original intent:
    const applyGPLFixes = (id: string): string => {
        if (mapOfKnownLicenses.get(id)) {
            return mapOfKnownLicenses.get(`${id}-only`) || id
        }
        return id
    }

    // Expand the "+" syntax to "-or-later" if one exists:
    const expandPlus = (id: string): string => {
        if (id.endsWith('+')) {
            const orLaterId = id.replace(/\+$/, '-or-later')
            if (mapOfKnownLicenses.get(orLaterId)) {
                return orLaterId
            }
        }
        return id
    }

    const precorrectedId = expandPlus(applyGPLFixes(applyAliases(id)))

    // Use `spdx-correct` to try and correct identifiers that we haven't fixed already:
    return mapOfKnownLicenses.get(precorrectedId)
        || spdxCorrect(precorrectedId, { upgrade: true })
        || precorrectedId
}

const correctExceptionId = (id: string): string => {
    const applyAliases = (id: string): string => {
        const lowercaseId = id.toLowerCase().replace(/^the /, '')
        return aliasesForExceptions.get(lowercaseId) || id
    }

    const precorrectedId = applyAliases(id)
    return mapOfKnownExceptions.get(precorrectedId) || precorrectedId
}

const extractErrorMessage = (tree: StrictParser.ParseResult | LiberalParser.ParseResult): string => {
    return tree.errs.map(element => element.toString()).join('\n')
}

const convertNodeWithoutCorrections = (input: string): FullSpdxParseResult => {

    const reduceNode = (node: any): ParsedSpdxExpression | null => {
        if (!node) { return null }

        const convertLicenseIdExpression = (node: StrictParser.license_id_expression): LicenseInfo => {
            const correctedLicenseId = correctLicenseId(node.license.license)
            if (!!node.exception) {
                return { license: correctedLicenseId, exception: node.exception.exception }
            }
            return { license: correctedLicenseId }
        }
    
        const converLicenseRefExpression = (node: StrictParser.license_ref_expression | StrictParser.license_ref_expression_1): LicenseRef => {
            const extractDocumentRef = (node: StrictParser.license_ref_expression_1): string|undefined => {
                if (node.document_ref && node.document_ref.prefix) {
                    return [node.document_ref.prefix, node.document_ref.value].join('')
                }
                return undefined
            }
            const extractLicenseRef = (node: StrictParser.license_ref_expression): string => {
                return [node.license_ref.prefix, node.license_ref.value].join('')
            }
            return {
                documentRef: extractDocumentRef(node as StrictParser.license_ref_expression_1),
                licenseRef: extractLicenseRef(node),
            } as LicenseRef
        }
        
        if (node.kind === 'license_id_expression') {
            return convertLicenseIdExpression(node)
        } else if (node.kind === 'wrapped_expression') {
            return reduceNode(node.value)
        } else if (node.kind === 'or_expression') {
            let compound: ConjunctionInfo = {
                conjunction: 'or',
                left: reduceNode(node.left) as ParsedSpdxExpression,
                right: reduceNode(node.right) as ParsedSpdxExpression
            }
            return compound
        } else if (node.kind === 'and_expression') {
            let compound: ConjunctionInfo = {
                conjunction: 'and',
                left: reduceNode(node.left) as ParsedSpdxExpression,
                right: reduceNode(node.right) as ParsedSpdxExpression
            }
            return compound
        } else if (node.kind.startsWith('license_ref_expression')) {
            return converLicenseRefExpression(node)
        }
        /* istanbul ignore next */ assert.fail(`reduceNode() did not recognize input: ${JSON.stringify(node)}`)
    }
    
    const p = new StrictParser.Parser(prepareInput(input))
    const tree = p.parse()
    return compileFullSpdxParseResult(input, tree, reduceNode(tree.ast?.value))
}

const convertNodeWithCorrections = (input: string): FullSpdxParseResult => {
    const reduceNode = (node: any | undefined): any|undefined => {
        if (!node) {
            return null
        } else if (node.kind === LiberalParser.ASTKinds.or_expression) {
            return {
                conjunction: 'or',
                left: reduceNode(node.left),
                right: reduceNode(node.right)
            }
        } else if (node.kind === LiberalParser.ASTKinds.and_expression) {
            return {
                conjunction: 'and',
                left: reduceNode(node.left),
                right: reduceNode(node.right)
            }
        } else if (node.kind === LiberalParser.ASTKinds.license_exception) {
            if (node.value) {
                return correctExceptionId(reduceNode(node.value))
            } else {
                /* istanbul ignore next */ assert.fail(`convertNodeWithCorrections() did not recognize input: ${JSON.stringify(node, null, 2)}`)
            }
        } else if (node.kind === LiberalParser.ASTKinds.simple_expression) {
            const license = correctLicenseId(reduceNode(node.value))
            const exception = reduceNode(node.exception)
            if (exception) {
                return { license, exception }
            } else {
                return { license }
            }
        } else if (node.kind === LiberalParser.ASTKinds.words_expression) {
            const head = node.value.prefix.head.value
            const tail = node.value.prefix.tail ? reduceNode(node.value.prefix.tail.rest) : ''
            return (head + ' ' + tail).trim()
        } else if (node.kind === LiberalParser.ASTKinds.words) {
            if (node.tail) {
                return (node.head.value + ' ' + reduceNode(node.tail.rest)).trim()
            } else {
                return node.head.value
            }
        } else if (node.kind === LiberalParser.ASTKinds.wrapped_expression) {
            return reduceNode(node.value)
        }
        /* istanbul ignore next */ assert.fail(`convertNodeWithCorrections() did not recognize input: ${JSON.stringify(node)}`)
    }

    const p = new LiberalParser.Parser(prepareInput(input))
    const tree = p.parse()
    return compileFullSpdxParseResult(input, tree, reduceNode(tree.ast?.value))
}

/**
 * Clean up the given SPDX expression before processing it with the grammar.
 * 
 * Currently, the clean-up is limited to:
 * 1. trimming the surrounding whitespace,
 * 2. compressing consecutive whitespace characters into a single space, and
 * 3. string-replacing known patterns such as "Foo version 123" with "Foo-123"
 * 
 * The SPDX specification does not allow whitespace as part of identifiers but
 * given that we want to deal with also the more liberally worded license
 * expressions, we might want to replace this hack with a more systematic
 * approach such as writing another grammar and using it to produce a syntactically
 * valid SPDX expression that we process with the current grammar.
 * 
 * @param input SPDX expression as a string
 * @returns A slightly cleaned up SPDX expression as a string
 */
 const prepareInput = (input: string): string => {
    return input
        .trim()               // remove surrounding whitespace
        .replace(/\s+/, ' ')  // compress consecutive whitespaces to a single space
}

const compileFullSpdxParseResult = (input: string, tree: StrictParser.ParseResult | LiberalParser.ParseResult, expression: ParsedSpdxExpression | null): FullSpdxParseResult => {
    const common = { input: input, ast: tree.ast }
    if (tree.ast && (tree.errs === null || tree.errs.length === 0)) {
        return {
            ...common,
            ...{ expression, error: null }
        } as SuccessfulParse
    } else {
        return {
            ...common,
            ...{ expression: null, error: extractErrorMessage(tree) }
        } as FailedParse
    }
}

/**
 * Parse an SPDX expression into a structured object representation.
 * 
 * @param input SPDX expression as a string to be parsed.
 * @returns {ParsedSpdxExpression} A structured object describing the given SPDX expression
 *          or throws an `Error` if parsing failed.
 */
export function parseSpdxExpression(input: string, strictSyntax: boolean = false) : ParsedSpdxExpression | null {
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
    const notCorrected = convertNodeWithoutCorrections(input)
    if (notCorrected.error && !strictSyntax)  {
        // attempt to apply corrections if allowed
        const corrected = convertNodeWithCorrections(input)
        if (!corrected.error) {
            return corrected
        }
    }
    return notCorrected
}
