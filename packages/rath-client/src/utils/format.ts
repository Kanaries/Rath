export function isLegalEmail (email: string): boolean {
    const emailReg = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(.[a-zA-Z0-9_-])+/
    return emailReg.test(email);
}