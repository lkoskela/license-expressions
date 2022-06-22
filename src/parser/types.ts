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

export type ParsedSpdxExpression = ConjunctionInfo | LicenseInfo | LicenseRef
