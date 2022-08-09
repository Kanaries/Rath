/* eslint no-restricted-globals: 0 */
import { getVisSpaces } from 'visual-insights';
import { timer } from './timer';

const generateDashBoard = async (e) => {
  const { dataSource, dimensions, measures } = e.data;
  try {
    let ansSpace = await getVisSpaces({ dataSource, dimensions, measures });
    ansSpace.sort((a, b) => (a.impurity / a.significance) - (b.impurity / b.significance));
    self.postMessage({
      success: true,
      data: ansSpace
    })
  } catch (error) {
    self.postMessage({
      success: false,
      message: error
    })
  }
}

self.addEventListener('message', timer(generateDashBoard), false);