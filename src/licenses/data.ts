import licenses from '../codegen/licenses.json'
import exceptions from '../codegen/exceptions.json'


export type Exception = {
    licenseExceptionId: string,
    isDeprecatedLicenseId: boolean,
    name: string,
    licenseComments: string,
    relatedLicenses: string[]
}

export type License = {
    licenseId: string,
    isDeprecatedLicenseId: boolean,
    name: string,
    isOsiApproved: boolean,
    seeAlso: string[]
}

export type Licenses = {
    licenseListVersion: string,
    releaseDate: string,
    licenses: License[]
}

export type Exceptions = {
    licenseListVersion: string,
    releaseDate: string,
    exceptions: Exception[]
}

const licenseList = licenses as Licenses
const exceptionList = exceptions as Exceptions

export { licenseList as licenses, exceptionList as exceptions }
