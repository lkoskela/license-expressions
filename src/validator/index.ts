import { fail } from "assert"
import { parseSpdxExpressionWithDetails, ParsedSpdxExpression, ConjunctionInfo, LicenseInfo, LicenseRef } from "../parser"

import { exceptions, licenses, Exception } from '../licenses'


export type ValidationResult = {
    valid: boolean,
    errors: string[]
}

const ALL_LICENSE_IDS = licenses.licenses.map(entry => entry.licenseId)
const LOWERCASE_LICENSE_IDS = ALL_LICENSE_IDS.map(id => id.toLowerCase())
const LOWERCASE_EXCEPTION_IDS = exceptions.exceptions.map(entry => entry.licenseExceptionId.toLowerCase())

const isKnownLicenseIdentifier = (id: string): boolean => LOWERCASE_LICENSE_IDS.includes(id.toLowerCase())
const isKnownExceptionIdentifier = (id: string): boolean => LOWERCASE_EXCEPTION_IDS.includes(id.toLowerCase())

type GPLIdentifier = {
    family: string,
    version: string,
    plus: boolean
}

const parseGplVersionFromIdentifier = (identifier: string): GPLIdentifier | undefined => {
    const groups = identifier.match(/^([AL]?GPL)\-(\d(\.\d)+)((\-or\-later)|(\-only)|\+)?$/)
    if (groups) {
        return { family: groups[1], version: groups[2], plus: ['-or-later', '+'].includes(groups[4]) }
    }
    return undefined
}

const expandGplLicenseVersionExpressions = (relatedLicenseIds: string[]): string[] => {
    const ids: string[] = []
    relatedLicenseIds.forEach(license => {
        ids.push(license)

        if (license.match(/^[AL]?GPL\-\d(\.\d)+$/)) {
            // if "GPL-2.0" or "GPL-3.0", also allow "-only" and "-or-later" variations
            ids.push(`${license}-only`)
            ids.push(`${license}-or-later`)
        }
        const orLaterMatch = license.match(/^([AL]?GPL)\-(\d(\.\d)+)\-(or|and)\-later$/)
        if (orLaterMatch) {
            // if "GPL-2.0+" or "GPL-3.0-or-later" etc.
            const licenseFamily = orLaterMatch[1]
            const minimumVersion = orLaterMatch[2]
            const allLicensesInSameFamily = ALL_LICENSE_IDS.filter(id => id.startsWith(`${licenseFamily}-`))
            const newerLicensesInSameFamily = allLicensesInSameFamily.filter(id => {
                const gplId = parseGplVersionFromIdentifier(id)
                return gplId && gplId.version >= minimumVersion
            })
            newerLicensesInSameFamily.forEach(id => ids.push(id))
        }
    })
    return ids
}

const validateLicenseAndExceptionRelation = (licenseId: string, exceptionId: string): string[] => {
    const relatedLicenseIds = expandGplLicenseVersionExpressions((exceptions.exceptions.find(x => {
        return x.licenseExceptionId.toLowerCase() === exceptionId.toLowerCase()
    })?.relatedLicenses || []))
    if (relatedLicenseIds.length > 0 && !relatedLicenseIds.map(x => x.toLowerCase()).includes(licenseId.toLowerCase())) {
        return [ `Exception associated with unrelated license: \"${licenseId} WITH ${exceptionId}\" (expected one of: ${relatedLicenseIds.join(', ')})` ]
    }
    return []
}

const validateLicenseInfoExpression = (expression: LicenseInfo): string[] => {
    const errors: string[] = []
    const licenseId = expression.license

    if (!isKnownLicenseIdentifier(licenseId)) {
        errors.push(`Unknown SPDX license identifier: ${JSON.stringify(licenseId)}`)
    }

    if (expression.exception) {
        if (!isKnownExceptionIdentifier(expression.exception)) {
            errors.push(`Unknown SPDX exception identifier: ${JSON.stringify(expression.exception)}`)
        } else {
            const relationErrors = validateLicenseAndExceptionRelation(licenseId, expression.exception)
            relationErrors.forEach(e => errors.push(e))
        }
    }
    return errors
}

const validateLicenseRefExpression = (expression: LicenseRef): string[] => {
    return []  // LicenseRefs are not currently validated in any way
}

const validateCompoundExpression = (expression: ConjunctionInfo): string[] => {
    return validateExpression(expression.left).concat(validateExpression(expression.right))
}

const validateExpression = (expression: ParsedSpdxExpression): string[] => {
    if ((expression as ConjunctionInfo)?.conjunction) {
        return validateCompoundExpression(expression as ConjunctionInfo)
    } else if ((expression as LicenseRef)?.licenseRef) {
        return validateLicenseRefExpression(expression as LicenseRef)
    } else if ((expression as LicenseInfo)?.license) {
        return validateLicenseInfoExpression(expression as LicenseInfo)
    }
    /* istanbul ignore next */ fail(`Unexpected type of input for validateExpression(${JSON.stringify(expression)})`)
}

/**
 * Validate the given SPDX expression.
 *
 * @param input The expression {string} to validate.
 * @returns a {ValidationResult} with a binary outcome and a list of validation errors.
 */
export function validate(input: string): ValidationResult {
    if (input.trim() === '') {
        return { valid: false, errors: [ 'Unknown SPDX identifier: ""' ]}
    }
    const parseResult = parseSpdxExpressionWithDetails(input, false, false)
    if (parseResult.error) {
        return { valid: false, errors: [ parseResult.error ] }
    } else if (parseResult.expression) {
        const errors = validateExpression(parseResult.expression)
        return { errors, valid: errors.length === 0 }
    }
    /* istanbul ignore next */ fail(`Unexpected execution path for validate(${JSON.stringify(input)})`)
}

export default validate
