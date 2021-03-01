declare module 'react-intl-universal' {
  /**
   * Helper: determine user's locale via URL, cookie, and browser's language.
   * You may not this API, if you have other rules to determine user's locale.
   * @param {string} options.urlLocaleKey URL's query Key to determine locale. Example: if URL=http://localhost?lang=en-US, then set it 'lang'
   * @param {string} options.cookieLocaleKey Cookie's Key to determine locale. Example: if cookie=lang:en-US, then set it 'lang'
   * @param {string} options.localStorageLocaleKey LocalStorage's Key to determine locale such as 'lang'
   * @returns {string} determined locale such as 'en-US'
   */
  export function determineLocale(options: ReactIntlUniversalOptions): string

  /**
   * Provide React-Intl compatibility, same as getHTML(...) API.
   */
  export function formatHTMLMessage(messageDescriptor: ReactIntlUniversalMessageDescriptor): string

  /**
   * Provide React-Intl compatibility, same as getHTML(...) API.
   */
  export function formatHTMLMessage(messageDescriptor: ReactIntlUniversalMessageDescriptor, variables: any): string

  /**
   * Provide React-Intl compatibility, same as get(...) API.
   */
  export function formatMessage(messageDescriptor: ReactIntlUniversalMessageDescriptor): string

  /**
   * Provide React-Intl compatibility, same as get(...) API.
   */
  export function formatMessage(messageDescriptor: ReactIntlUniversalMessageDescriptor, variables: any): string

  /**
   * Get the formatted message by key
   * @param {string} key The string representing key in locale data file
   * @returns {string} message
   */
  export function get(key: string): string

  /**
   * Get the formatted message by key
   * @param {string} key The string representing key in locale data file
   * @param {Object} variables Variables in message
   * @returns {string} message
   */
  export function get(key: string, variables: any): string

  /**
   * Get the formatted html message by key.
   * @param {string} key The string representing key in locale data file
   * @returns {React.Element} message
   */
  export function getHTML(key: string): string

  /**
   * Get the formatted html message by key.
   * @param {string} key The string representing key in locale data file
   * @param {Object} variables Variables in message
   * @returns {React.Element} message
   */
  export function getHTML(key: string, value: any): string

  /**
   * Get the inital options
   * @returns {Object} options includes currentLocale and locales
   */
  export function getInitOptions(): ReactIntlUniversalOptions

  /**
   * Initialize properties and load CLDR locale data according to currentLocale
   * @param {Object} options
   * @param {string} options.currentLocale Current locale such as 'en-US'
   * @param {Object} options.locales App locale data like {"en-US":{"key1":"value1"},"zh-CN":{"key1":"值1"}}
   * @param {Object} options.warningHandler Ability to accumulate missing messages using third party services like Sentry
   * @param {string} options.fallbackLocale Fallback locale such as 'zh-CN' to use if a key is not found in the current locale
   * @param {boolean} options.escapeHtml To escape html. Default value is true.
   * @returns {Promise}
   */
  export function init(options: ReactIntlUniversalOptions): Promise<void>

  /**
   * Load more locales after init
   * @param {Object} locales App locale data
   */
  export function load(locales: { [key: string]: any }): void

  export interface ReactIntlUniversalOptions {
    currentLocale?: string
    locales?: { [key: string]: any }
    fallbackLocale?: string
    commonLocaleDataUrls?: { [key: string]: string }
    cookieLocaleKey?: string
    urlLocaleKey?: string
    localStorageLocaleKey?: string
    warningHandler?: (message?: any, error?: any) => void
    escapeHtml?: boolean
  }

  export interface ReactIntlUniversalMessageDescriptor {
    id: string
    defaultMessage?: string
  }
}

declare interface String {
  defaultMessage(msg: string | JSX.Element): string
  d(msg: string | JSX.Element): string
}
