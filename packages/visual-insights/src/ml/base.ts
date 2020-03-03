// export class Base {
//   private normalizeDimensions(): NormalizedRecord[] {
//     private normalizedDataSource: NormalizedRecord[];
//     this.normalizedDataSource = [];
//     this.valueSets = [];
//     this.dimensions.forEach(() => {
//       this.valueSets.push(new Map());
//     })
//     this.dataSource.forEach(record => {
//       this.dimensions.forEach((dim, index) => {
//         let value = (record[dim] || 'others').toString();
//         if (!this.valueSets[index].has(value)) {
//           this.valueSets[index].set(value, this.valueSets[index].size);
//         }
//       })
//     })
//     this.dataSource.forEach(record => {
//       let normalizedRecord = this.normalizeRecord(record);
//       this.normalizedDataSource.push(normalizedRecord);
//     })
//     return this.normalizedDataSource;
//   }
//   public normalizeRecord (record: Record): NormalizedRecord {
//     let normalizedRecord: NormalizedRecord = {};
//     this.measures.forEach(mea => {
//       normalizedRecord[mea] = record[mea];
//     })
//     this.dimensions.forEach((dim, index) => {
//       let value = (record[dim] || 'others').toString();
//       normalizedRecord[dim] = this.valueSets[index].get(value);
//     })
//     return normalizedRecord;
//   }
// }