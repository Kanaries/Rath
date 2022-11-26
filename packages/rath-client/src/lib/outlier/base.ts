export abstract class OutlierBase {
    public abstract fit (samplesX: number[][]): void;
    public abstract predict(samplesX: number[][]): number[];
    public fitPredict (samplesX: number[][]) {
        this.fit(samplesX);
        return this.predict(samplesX);
    }
}