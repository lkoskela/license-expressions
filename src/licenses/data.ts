import licenses from "../codegen/licenses.json";
import exceptions from "../codegen/exceptions.json";

export type Exception = {
    name: string;
    licenseExceptionId: string;
    deprecated: boolean;
    relatedLicenses: string[];
};

export type License = {
    name: string;
    licenseId: string;
    deprecated: boolean;
};

const licenseList = licenses as License[];
const exceptionList = exceptions as Exception[];

export { licenseList as licenses, exceptionList as exceptions };
