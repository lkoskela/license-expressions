#!/usr/bin/env node

const https = require('https')
const fs = require('fs')
const os = require('os')
const path = require('path')
var crypto = require('crypto')
const { pipeline } = require('stream')


const LICENSE_FILE_URL = "https://raw.githubusercontent.com/spdx/license-list-data/master/json/licenses.json"
const EXCEPTIONS_FILE_URL = "https://raw.githubusercontent.com/spdx/license-list-data/master/json/exceptions.json"
const EXCEPTION_DETAILS_FILE_BASEURL = "https://raw.githubusercontent.com/spdx/license-list-data/master/json/exceptions/"
const DETAILS_DOWNLOAD_BATCH_SIZE = 10


const hash = (str) => {
    var shasum = crypto.createHash('sha1')
    shasum.update(str)
    return shasum.digest('hex')
}

const downloadJSON = async (url) => {
    const rawJson = await new Promise((resolve, reject) => {
        const tmpFilePath = path.join(os.tmpdir(), hash(url))
        https.get(url, (response) => {
            const errorHandler = (err) => {
                if (err) {
                    console.warn(`Could not download JSON from ${url} - ${err}`)
                    resolve('{}')
                }
                else { resolve(fs.readFileSync(tmpFilePath)) }
            }
            pipeline(response, fs.createWriteStream(tmpFilePath), errorHandler)
        })
    })
    try {
        return JSON.parse(rawJson)
    } catch (err) {
        console.error(`Error parsing JSON from ${url}: ${err}\n\nRaw content:\n${rawJson}`)
        return {}
    }
}

const sliceIntoChunks = (arr, chunkSize) => {
    const res = []
    for (let i = 0; i < arr.length; i += chunkSize) {
        const chunk = arr.slice(i, i + chunkSize)
        res.push(chunk)
    }
    return res
}

const downloadManyJSONFiles = async (arrayOfURLs) => {
    const batches = sliceIntoChunks(arrayOfURLs, DETAILS_DOWNLOAD_BATCH_SIZE)
    const results = []
    for (let b = 0; b < batches.length; b++) {
        const batch = batches[b]
        console.log(`Downloading batch ${b+1} (${batch.length} entries)`)
        const batchResults = await Promise.all(batch.map(downloadJSON))
        batchResults.forEach(result => results.push(result))
    }
    return results
}

const readLicenseListVersionFromJsonObject = (jsonObj) => {
    return jsonObj.licenseListVersion
}

const readLicensesFromFile = (file_path) => {
    if (fs.existsSync(file_path)) {
        const jsonObj = JSON.parse(fs.readFileSync(file_path))
        return jsonObj.licenses
    }
    console.warn(`File ${file_path} does not exist - can't read licenses from it`)
    return []
}

const readLicenseListVersionFromFile = (file_path) => {
    if (fs.existsSync(file_path)) {
        const jsonObj = JSON.parse(fs.readFileSync(file_path))
        return readLicenseListVersionFromJsonObject(jsonObj)
    }
    return ''
}

const updateFileFromURL = async (destinationFilePath, sourceUrl, entryListKey, detailsUrlMapper, detailsObjectMapper) => {
    const json = await downloadJSON(sourceUrl)
    const latestVersion = readLicenseListVersionFromJsonObject(json)
    const localVersion = readLicenseListVersionFromFile(destinationFilePath)
    if (!!latestVersion && latestVersion === localVersion) {
        console.log(`${destinationFilePath} already has version ${latestVersion} from ${sourceUrl} --> skip update`)
    } else {
        console.log(`Update available (from ${localVersion} to ${latestVersion}) --> updating ${entryListKey}`)
        const urls = json[entryListKey].map(detailsUrlMapper)
        const details = await downloadManyJSONFiles(urls)
        json[entryListKey] = details.filter(x => !!x).map(detailsObjectMapper)
        fs.writeFileSync(destinationFilePath, JSON.stringify(json, null, 2))
        console.log(`Updated ${destinationFilePath} with version ${latestVersion} from ${sourceUrl}`)
    }
}

const updateLicenseFileAt = async (destinationFilePath) => {
    const licenseDetailsUrlMapper = (license) => license.detailsUrl
    const licenseDetailsObjectMapper = (license) => {
        if (license && license.licenseId) {
            return {
                name: license.name,
                licenseId: license.licenseId,
                isDeprecatedLicenseId: !!license.isDeprecatedLicenseId,
                isOsiApproved: !!license.isOsiApproved,
                isFsfLibre: !!license.isFsfLibre,
                seeAlso: license.seeAlso
            }
        }
        return undefined
    }
    try {
        await updateFileFromURL(destinationFilePath, LICENSE_FILE_URL, 'licenses', licenseDetailsUrlMapper, licenseDetailsObjectMapper)
    } catch (err) {
        console.error(`Updating ${destinationFilePath} failed: ${err}`, err)
    }
}

const unique = (listOfWords) => {
    return [...new Set(listOfWords)]
}

const expandListOfKnownLicenses = (ids) => {
    ids.filter(id => !!id && id.endsWith('+')).forEach(id => ids.push(id.replace(/\+$/, '-or-later')))
    return ids
}

const expandListOfMentionedLicenses = (words) => {
    words.filter(w => w === 'gpl').forEach(w => {
        words.push('gpl-2.0')
        words.push('gpl-3.0')
    })
    words.filter(w => w === 'lgpl').forEach(w => {
        words.push('lgpl-2.0')
        words.push('lgpl-2.1')
        words.push('lgpl-3.0')
    })
    return words
}

const sanitizeSpecialCharacters = (text) => {
    return text.replace(/[^a-zA-Z0-9\.\-\+]/g, ' ').replace(/\s+/g, ' ')
}

const findLicensesMentionedInLicenseComments = (licenses, entry, explicitGplVersionsOnly = true) => {
    const knownLicenseIds = expandListOfKnownLicenses(licenses.map(x => x.licenseId)).filter(x => !!x)
    const lowercaseLicenseIds = knownLicenseIds.map(x => x.toLowerCase())
    const textFromLicenseComments = sanitizeSpecialCharacters(entry.licenseComments || '').replace(/[\.,](\s|$)/g, ' ').replace(/(GPL)\s+(\d\.\d)/g, '$1-$2')
    const uniqueWords = unique(textFromLicenseComments.trim().split(/\s+/).map(w => w.toLowerCase()))
    const expandedWords = explicitGplVersionsOnly ? uniqueWords : expandListOfMentionedLicenses(uniqueWords)
    const licensesMentioned = expandedWords.filter(w => lowercaseLicenseIds.includes(w)).map(id => id.replace(/\+$/, '-or-later'))
    return licensesMentioned.map(lc => knownLicenseIds.find(x => x.toLowerCase() === lc))
}

const findLicensesMentionedInExceptionName = (licenses, entry, explicitGplVersionsOnly = true) => {
    const knownLicenseIds = expandListOfKnownLicenses(licenses.map(x => x.licenseId)).filter(x => !!x)
    const lowercaseLicenseIds = knownLicenseIds.map(x => x.toLowerCase())
    const text = sanitizeSpecialCharacters(entry.name || '').replace(/(GPL)\s+(\d\.\d)/g, '$1-$2').split(/\s+/).filter(w => w.startsWith('LGPL') || w.startsWith('GPL') || w.startsWith('AGPL')).join(' ').trim()
    const uniqueWords = unique(text.split(/\s+/).map(w => w.toLowerCase()))
    const expandedWords = explicitGplVersionsOnly ? uniqueWords : expandListOfMentionedLicenses(uniqueWords.map(w => w.replace(/\.$/, '')))
    const licensesMentioned = expandedWords.filter(w => lowercaseLicenseIds.includes(w)).map(id => id.replace(/\+$/, '-or-later'))
    return licensesMentioned.map(lc => knownLicenseIds.find(x => x.toLowerCase() === lc))
}

const extractLicenseIdentifiersReferredTo = (licenses, entry) => {
    const methods = [
        () => findLicensesMentionedInLicenseComments(licenses, entry, true),
        () => findLicensesMentionedInExceptionName(licenses, entry, true),
        () => findLicensesMentionedInLicenseComments(licenses, entry, false),
        () => findLicensesMentionedInExceptionName(licenses, entry, false)
    ]
    let mentions = []
    for (let i=0; mentions.length === 0 && i < methods.length; i++) {
        mentions = methods[i]()
    }
    return mentions
}

const updateExceptionsFileAt = async (exceptionsFilePath, licensesFilePath) => {
    const exceptionDetailsUrlMapper = (entry) => EXCEPTION_DETAILS_FILE_BASEURL + entry.reference.replace(/^.\//, '')
    const exceptionDetailsObjectMapper = (licenses) => {
        return (entry) => {
            let licensesMentionedInComments = extractLicenseIdentifiersReferredTo(licenses, entry)
            return {
                licenseExceptionId: entry.licenseExceptionId,
                isDeprecatedLicenseId: entry.isDeprecatedLicenseId,
                // licenseExceptionText: entry.licenseExceptionText,
                name: entry.name,
                seeAlso: entry.seeAlso,
                licenseComments: entry.licenseComments,
                relatedLicenses: licensesMentionedInComments,
            }
        }
    }
    try {
        const licenses = readLicensesFromFile(licensesFilePath)
        await updateFileFromURL(exceptionsFilePath, EXCEPTIONS_FILE_URL, 'exceptions', exceptionDetailsUrlMapper, exceptionDetailsObjectMapper(licenses))
    } catch (err) {
        console.error(`Updating ${exceptionsFilePath} failed: ${err}`, err)
    }
}

const fileIsOlderThan = (oldestAcceptableTimestamp, filePath) => {
    return fs.statSync(filePath).mtime < oldestAcceptableTimestamp
}

const updateLicenseFileIfOlderThan = async (oldestAcceptableTimestamp, filePath) => {
    if (!fs.existsSync(filePath) || fileIsOlderThan(oldestAcceptableTimestamp, filePath)) {
        return await updateLicenseFileAt(filePath)
    } else {
        console.log(`Not updating ${filePath} (it's recent enough)`)
    }
}

const updateExceptionsFileIfOlderThan = async (oldestAcceptableTimestamp, filePath, licenseFilePath) => {
    if (!fs.existsSync(filePath) || fileIsOlderThan(oldestAcceptableTimestamp, filePath)) {
        return await updateExceptionsFileAt(filePath, licenseFilePath)
    } else {
        console.log(`Not updating ${filePath} (it's recent enough)`)
    }
}

const dateHoursBeforeNow = (hours) => {
    const d = new Date()
    const nowInMillis = d.getTime()
    return new Date(nowInMillis - hours * 60 * 60 * 1000)
}

const main = async (licenseFilePath, exceptionsFilePath) => {
    const oldestAcceptableTimestamp = dateHoursBeforeNow(24)
    await updateLicenseFileIfOlderThan(oldestAcceptableTimestamp, licenseFilePath)
    await updateExceptionsFileIfOlderThan(oldestAcceptableTimestamp, exceptionsFilePath, licenseFilePath)
}

(async () => {
    try {
        const [licenseFilePath, exceptionsFilePath] = process.argv.slice(2)
        await main(licenseFilePath, exceptionsFilePath)
    } catch (e) {
        console.error(e)
    }
})()
