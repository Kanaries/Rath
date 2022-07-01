/* eslint no-restricted-globals: 0 */
import { UnivariateSummary } from 'visual-insights';
import { timer } from './timer';
const groupFields = (e) => {
  try {
    const { dataSource, fields } = e.data;
    const result = UnivariateSummary.groupFields(dataSource, fields);
    self.postMessage({
      success: true,
      data: result
    })
  } catch (error) {
    self.postMessage({
      success: false,
      message: error.toString()
    })
  }
}

self.addEventListener('message', timer(groupFields), false);