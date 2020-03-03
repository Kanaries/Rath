import { DataSource } from "../../commonTypes";

/**
 * estimateOutierScore is used to estimate the "possibility" of whether there is outlier in given dataView.
 * @param dataSource 
 * @param dimensions 
 * @param measures 
 * @returns number between [0, 1] where 1 shows there is a high possibiliy existing an outlier.
 */
function estimateOutierScore(dataSource: DataSource, dimensions: string[], measures: string[]): number {
  return 0
}

