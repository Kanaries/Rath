/* eslint no-restricted-globals: 0 */
import { UnivariateSummary } from 'visual-insights';

const groupFields = (e) => {
  console.log('group fields worker');
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

self.addEventListener('message', groupFields, false);