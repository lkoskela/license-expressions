import spdxCorrect from 'spdx-correct'

import licenses from '../codegen/licenses.json'
import exceptions from '../codegen/exceptions.json'

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
    mapOfAliases.set('qwt license 1.0', 'Qwt-exception-1.0')
    return mapOfAliases
})()

export function correctLicenseId(id: string): string {

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

const spdxCorrectException = (id: string): string | undefined => {
    const variationsToTest: string[] = [
        id.replace(/\s+/, '-'),
        id.replace(/\s+version\s+/i, ' '),
        id.replace(/(\d+)$/, '$1.0')
    ]
    const matchedIds = variationsToTest.map(variation => mapOfKnownExceptions.get(variation))
    return matchedIds.filter(matchedId => !!matchedId)[0]
}

export function correctExceptionId(id: string): string {

    const debug = id === 'autoconf exception version 2'
    const debugPrefix = `correctLicenseId(${JSON.stringify(id)})`

    if (debug) {
        console.log(debugPrefix)
    }

    const removeExtras = (id: string): string => {
        return id.replace(/^the\s+/i, '').replace(/\s+/, ' ')
    }

    const applyAliases = (id: string): string => {
        const lowercaseId = id.toLowerCase()
        const lowercaseIdWithoutWordVersion = lowercaseId.replace(/\s+version\s+(\d+)/, ' $1')
        return aliasesForExceptions.get(lowercaseId) || aliasesForExceptions.get(lowercaseIdWithoutWordVersion) || id
    }

    id = removeExtras(id)
    if (debug) {
        console.log(`${debugPrefix} - removed extras => ${JSON.stringify(id)}`)
    }

    id = applyAliases(id)
    if (debug) {
        console.log(`${debugPrefix} - applied aliases => ${JSON.stringify(id)}`)
    }

    const correctedId = mapOfKnownExceptions.get(id)
    if (debug) {
        console.log(`${debugPrefix} - mapped to known identifier => ${JSON.stringify(correctedId)}`)
    }

    // `id` can be either "Apache-2.0" or "Apache license version 2" (for example)
    return correctedId || spdxCorrectException(id) || id
}
