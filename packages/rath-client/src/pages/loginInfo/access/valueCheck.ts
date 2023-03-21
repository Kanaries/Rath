export function validUserName(val: string): boolean {
    if (val.length > 20 || val.length === 0) return false;
    if (val === "admin" || val === "init" || val === "root") return false;
    if (val.search(/[<>|\\+=`~.,?/!&*();:"'{}]+/) > -1) return false;
    return true;
}

const EmailRegex = (
    // eslint-disable-next-line no-control-regex
    /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
);
export function validEmail(val: string): boolean {
    return EmailRegex.test(val);
}

export function validEduMail(val: string): boolean {
    // return true;
    if (val.search("edu") > -1) return true;
    return false;
}

export function validPhone(val: string, area: string) {
    // const PhoneRegex = /^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/;
    // return area === 'zh-CN' ? PhoneRegex.test(val) : val.length > 0;
    const result = isNaN(Number(val));
    return val.length !== 0 && !result;
}
