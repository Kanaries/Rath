export function termFrequency_inverseDocumentFrequency (docs: string[][]): Array<Map<string, number>> {
    const tf = new Map<string, number[]>();
    const idf = new Map<string, number>();
    const n = docs.length;
    for (let i = 0; i < n; i++) {
        const words = docs[i]
        const wordSet = new Set<string>();
        for (let j = 0; j < words.length; j++) {
            const word = words[j];
            if (wordSet.has(word)) continue;
            wordSet.add(word);
            if (!tf.has(word)) {
                tf.set(word, new Array(n).fill(0));
            }
            tf.get(word)![i]++;
        }
    }
    for (const [word, tfList] of tf) {
        let count = 0;
        for (let i = 0; i < n; i++) {
            if (tfList[i] > 0) count++;
        }
        idf.set(word, Math.log(n / count));
    }
    const ans: Array<Map<string, number>> = [];
    for (let i = 0; i < n; i++) {
        const words = docs[i]
        const wordSet = new Set<string>();
        const tfidf = new Map<string, number>();
        for (let j = 0; j < words.length; j++) {
            const word = words[j];
            if (wordSet.has(word)) continue;
            wordSet.add(word);
            tfidf.set(word, tf.get(word)![i] * idf.get(word)!);
        }
        ans.push(tfidf);
    }
    return ans;
}

export function termFrequency (docs: string[][]): Array<Map<string, number>> {
    const tf = new Map<string, number[]>();
    const n = docs.length;
    for (let i = 0; i < n; i++) {
        const words = docs[i]
        const wordSet = new Set<string>();
        for (let j = 0; j < words.length; j++) {
            const word = words[j];
            if (wordSet.has(word)) continue;
            wordSet.add(word);
            if (!tf.has(word)) {
                tf.set(word, new Array(n).fill(0));
            }
            tf.get(word)![i]++;
        }
    }
    const ans: Array<Map<string, number>> = [];
    for (let i = 0; i < n; i++) {
        const words = docs[i]
        const wordSet = new Set<string>();
        const final = new Map<string, number>();
        for (let j = 0; j < words.length; j++) {
            const word = words[j];
            if (wordSet.has(word)) continue;
            wordSet.add(word);
            final.set(word, tf.get(word)![i]);
        }
        ans.push(final);
    }
    return ans;
}