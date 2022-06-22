#!/usr/bin/env node

const https = require('https')
const fs = require('fs')
const os = require('os')
const path = require('path')
var crypto = require('crypto')
const { pipeline } = require('stream')

const LICENSE_FILE_URL = "https://raw.githubusercontent.com/spdx/license-list-data/master/json/licenses.json"
const EXCEPTIONS_FILE_URL = "https://raw.githubusercontent.com/spdx/license-list-data/master/json/exceptions.json"

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
                if (err) { reject(err) }
                else { resolve(fs.readFileSync(tmpFilePath)) }
            }
            pipeline(response, fs.createWriteStream(tmpFilePath), errorHandler)
        })
    })
    try {
        return JSON.parse(rawJson)
    } catch (err) {
        console.error(`Error parsing JSON from ${url}: ${err}\nJSON: ${rawJson}`)
        return {}
    }
}

const readLicenseListVersionFromJsonObject = (jsonObj) => {
    return jsonObj.licenseListVersion
}

const readLicenseListVersionFromFile = (file_path) => {
    if (fs.existsSync(file_path)) {
        const jsonObj = JSON.parse(fs.readFileSync(file_path))
        return readLicenseListVersionFromJsonObject(jsonObj)
    }
    return ''
}

const updateFileFromURL = async (destinationFilePath, sourceUrl, entryListKey) => {
    const json = await downloadJSON(sourceUrl)
    const latestVersion = readLicenseListVersionFromJsonObject(json)
    const localVersion = readLicenseListVersionFromFile(destinationFilePath)
    if (!!latestVersion && latestVersion === localVersion) {
        console.log(`${destinationFilePath} already has version ${latestVersion} from ${sourceUrl} --> skip update`)
    } else {
        console.log(`Update available (from ${localVersion} to ${latestVersion}) --> updating ${entryListKey}`)
        fs.writeFileSync(destinationFilePath, JSON.stringify(json, null, 2))
        console.log(`Updated ${destinationFilePath} with version ${latestVersion} from ${sourceUrl}`)
    }
}

const updateLicenseFileAt = async (destinationFilePath) => {
    try {
        await updateFileFromURL(destinationFilePath, LICENSE_FILE_URL, 'licenses')
    } catch (err) {
        console.error(`Updating ${destinationFilePath} failed: ${err}`)
    }
}

const updateExceptionsFileAt = async (destinationFilePath) => {
    try {
        await updateFileFromURL(destinationFilePath, EXCEPTIONS_FILE_URL, 'exceptions')
    } catch (err) {
        console.error(`Updating ${destinationFilePath} failed: ${err}`)
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

const updateExceptionsFileIfOlderThan = async (oldestAcceptableTimestamp, filePath) => {
    if (!fs.existsSync(filePath) || fileIsOlderThan(oldestAcceptableTimestamp, filePath)) {
        return await updateExceptionsFileAt(filePath)
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
    await updateExceptionsFileIfOlderThan(oldestAcceptableTimestamp, exceptionsFilePath)
}

(async () => {
    try {
        const [licenseFilePath, exceptionsFilePath] = process.argv.slice(2)
        await main(licenseFilePath, exceptionsFilePath)
    } catch (e) {
        console.error(e)
    }
})()
