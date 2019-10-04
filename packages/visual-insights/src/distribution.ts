import { DataSource } from './commonTypes';
import { memberCount } from './utils';

function isUniformDistribution(dataSource: DataSource, field: string): boolean {
  const members = memberCount(dataSource, field);
  return members.every(member => member[1] === 1);
}

export { isUniformDistribution }