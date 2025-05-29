import { Exception, License } from "licenses-from-spdx";

function unique<T>(items: T[]): T[] {
    return [...new Set(items)];
}

function expandListOfKnownLicenses(ids: string[]): string[] {
    ids.filter((id) => !!id && id.endsWith("+")).forEach((id) => {
        ids.push(id.replace(/\+$/, "-or-later"));
        ids.push(id.replace(/\+$/, "-and-later"));
    });
    return ids;
}

function expandListOfMentionedLicenses(words: string[]): string[] {
    words
        .filter((w) => w === "gpl")
        .forEach((_) => {
            words.push("gpl-2.0");
            words.push("gpl-3.0");
        });
    words
        .filter((w) => w === "lgpl")
        .forEach((_) => {
            words.push("lgpl-2.0");
            words.push("lgpl-2.1");
            words.push("lgpl-3.0");
        });
    words
        .filter((w) => w.match(/^[al]?gpl.*\-and\-later$/))
        .forEach((w) => {
            words.push(w.replace(/^([al]?gpl.*)\-and\-later$/, "$1-or-later"));
        });
    return words;
}

function sanitizeSpecialCharacters(text: string): string {
    return text.replace(/[^a-zA-Z0-9\.\-\+]/g, " ").replace(/\s+/g, " ");
}

function isString(x: any): x is string {
    return typeof x === "string";
}

function isNonEmptyString(x: any): x is string {
    return isString(x) && x.trim().length > 0;
}

function findLicensesMentionedInLicenseComments(
    licenses: License[],
    entry: Exception,
    explicitGplVersionsOnly = true
): string[] {
    const knownLicenseIds = expandListOfKnownLicenses(licenses.map((x) => x.licenseId)).filter((x) => !!x);
    const lowercaseLicenseIds = knownLicenseIds.map((x) => x.toLowerCase());
    const textFromLicenseComments = sanitizeSpecialCharacters(entry.licenseComments || "")
        .replace(/[\.,](\s|$)/g, " ")
        .replace(/(GPL)\s+(\d\.\d)/g, "$1-$2");
    const uniqueWords = unique(
        textFromLicenseComments
            .trim()
            .split(/\s+/)
            .map((w) => w.toLowerCase())
    );
    const expandedWords = explicitGplVersionsOnly ? uniqueWords : expandListOfMentionedLicenses(uniqueWords);
    const licensesMentioned = expandedWords
        .filter((w) => lowercaseLicenseIds.includes(w))
        .map((id) => id.replace(/\+$/, "-or-later"));
    return licensesMentioned.map((lc) => knownLicenseIds.find((x) => x.toLowerCase() === lc)).filter(isNonEmptyString);
}

function findLicensesMentionedInExceptionName(licenses, entry, explicitGplVersionsOnly = true): string[] {
    const knownLicenseIds = expandListOfKnownLicenses(licenses.map((x) => x.licenseId)).filter((x) => !!x);
    const lowercaseLicenseIds = knownLicenseIds.map((x) => x.toLowerCase());
    const text = sanitizeSpecialCharacters(entry.name || "")
        .replace(/(GPL)\s+(\d\.\d)/g, "$1-$2")
        .split(/\s+/)
        .filter((w) => w.startsWith("LGPL") || w.startsWith("GPL") || w.startsWith("AGPL"))
        .join(" ")
        .trim();
    const uniqueWords = unique(text.split(/\s+/).map((w) => w.toLowerCase()));
    const expandedWords = explicitGplVersionsOnly
        ? uniqueWords
        : expandListOfMentionedLicenses(uniqueWords.map((w) => w.replace(/\.$/, "")));
    const licensesMentioned = expandedWords
        .filter((w) => lowercaseLicenseIds.includes(w))
        .map((id) => id.replace(/\+$/, "-or-later"));
    return licensesMentioned.map((lc) => knownLicenseIds.find((x) => x.toLowerCase() === lc)).filter(isNonEmptyString);
}

export function extractLicenseIdentifiersReferredTo(licenses: License[], entry: Exception): string[] {
    const methods = [
        () => findLicensesMentionedInLicenseComments(licenses, entry, true),
        () => findLicensesMentionedInExceptionName(licenses, entry, true),
        () => findLicensesMentionedInLicenseComments(licenses, entry, false),
        () => findLicensesMentionedInExceptionName(licenses, entry, false),
    ];
    let mentions: string[] = [];
    methods.forEach((method) => {
        if (mentions.length === 0) {
            mentions = method();
        }
    });
    return mentions.flat();
}
