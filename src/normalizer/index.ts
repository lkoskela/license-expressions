import { fail } from "assert"
import { parse, ParsedSpdxExpression, ConjunctionInfo, LicenseInfo, LicenseRef } from "../parser"


const sortKey = (element: ParsedSpdxExpression): string => {
    if ((element as ConjunctionInfo).conjunction) {
        const conj = element as ConjunctionInfo
        const children = [sortKey(conj.left), sortKey(conj.right)].sort()
        return `${conj.conjunction}(${children.join(',')})`
    } else if ((element as LicenseRef).licenseRef) {
        return '_1_' + renderExpression(element)
    } else if ((element as LicenseInfo).license) {
        return '_0_' + renderExpression(element)
    }
    /* istanbul ignore next */ fail('Unexpected input for sortKey() => ' + JSON.stringify(element))
}

const compareElements = (element1: ParsedSpdxExpression, element2: ParsedSpdxExpression): number => {
    const key1 = sortKey(element1)
    const key2 = sortKey(element2)
    return key1.localeCompare(key2)
}

const sortElement = (element: ParsedSpdxExpression): ParsedSpdxExpression => {
    if ((element as ConjunctionInfo).conjunction) {
        return sortConjunction(element as ConjunctionInfo)
    } else {
        return element
    }
}

const sortConjunction = (element: ConjunctionInfo): ConjunctionInfo => {
    if (compareElements(element.left, element.right) > 0) {
        return { ...element, left: sortElement(element.right), right: sortElement(element.left) }
    } else {
        return { ...element, left: sortElement(element.left), right: sortElement(element.right) }
    }
}

const renderLicenseInfoExpression = (expression: LicenseInfo): string => {
    if (expression.exception) {
        return `${expression.license} WITH ${expression.exception}`
    } else {
        return expression.license
    }
}

const renderLicenseRefExpression = (expression: LicenseRef): string => {
    if (expression.documentRef) {
        return `${expression.documentRef}:${expression.licenseRef}`
    } else {
        return expression.licenseRef
    }
}

const renderConjunctionInfoExpression = (expression: ConjunctionInfo, options: RenderExpressionOptions): string => {
    const separator = expression.conjunction.toUpperCase()
    const childOptions: RenderExpressionOptions = { ...options, inner: true }
    const left = renderExpression(expression.left, childOptions)
    const right = renderExpression(expression.right, childOptions)
    const prefix = options.inner ? '(' : ''
    const suffix = options.inner ? ')' : ''
    return prefix + left + ' ' + separator + ' ' + right + suffix
}

type RenderExpressionOptions = { inner?: boolean }
const defaultOptions: RenderExpressionOptions = { inner: false }

const renderExpression = (expression: ParsedSpdxExpression, options?: RenderExpressionOptions): string => {
    const effectiveOptions: RenderExpressionOptions = { ...defaultOptions, ...options }
    if ((expression as LicenseInfo).license) {
        return renderLicenseInfoExpression(expression as LicenseInfo)
    } else if ((expression as LicenseRef).licenseRef) {
        return renderLicenseRefExpression(expression as LicenseRef)
    } else if ((expression as ConjunctionInfo).conjunction) {
        return renderConjunctionInfoExpression(expression as ConjunctionInfo, effectiveOptions)
    }
    /* istanbul ignore next */ fail('Unexpected input for renderExpression() => ' + JSON.stringify(expression))
}

/**
 * Renders a normalized string representation of an SPDX expression.
 *
 * @param spdxExpression The SPDX expression to render in a normalized form.
 * @returns Normalized string representation of the given SPDX expression.
 */
export function normalize(spdxExpression: string): string {
    try {
        return renderExpression(sortElement(parse(spdxExpression)))
    } catch (error) {
        return spdxExpression
    }
}
