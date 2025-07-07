/**
 * FloatArrayWrapper.ts
 * 
 * TypeScript conversion of FloatArrayWrapper.js from DJ Specs project.
 * Provides efficient storage and access for large audio sample arrays
 * by splitting them into manageable chunks.
 */

export class FloatArrayWrapper {
    private dataList: Float32Array[] = [];
    private currentElementCount: number = 0;
    private readonly innerArraySize: number = 4096;

    constructor() {
        print("FloatArrayWrapper: Created new instance");
    }

    public push(floatArray: Float32Array, arrayRealSize: number): void {
        let availableElementsInCurrentArray = this.innerArraySize - (this.currentElementCount % this.innerArraySize);
        
        if (this.currentElementCount % this.innerArraySize === 0) {
            availableElementsInCurrentArray = 0;
        }

        const additionalElementsCount = arrayRealSize - availableElementsInCurrentArray;
        const arraysToAddCount = Math.ceil(additionalElementsCount / this.innerArraySize);

        this.createAdditionalInnerArrays(arraysToAddCount);
        let currentCopiedElementIndex = 0;

        while (currentCopiedElementIndex < arrayRealSize) {
            const dataArrayIndex = Math.floor(this.currentElementCount / this.innerArraySize);
            const innerArrayIndex = this.currentElementCount % this.innerArraySize;
            
            if (this.dataList[dataArrayIndex]) {
                this.dataList[dataArrayIndex][innerArrayIndex] = floatArray[currentCopiedElementIndex];
            }

            this.currentElementCount += 1;
            currentCopiedElementIndex += 1;
        }
    }

    public shift(): Float32Array | undefined {
        return this.dataList.shift();
    }

    private createAdditionalInnerArrays(arraysCount: number): void {
        for (let i = 0; i < arraysCount; i++) {
            this.dataList.push(new Float32Array(this.innerArraySize));
        }
    }

    public getElement(idx: number): number {
        const arrayIndex = Math.floor(idx / this.innerArraySize);
        const elementInArrayIdx = idx % this.innerArraySize;
        
        if (this.dataList[arrayIndex]) {
            return this.dataList[arrayIndex][elementInArrayIdx];
        } else {
            return 0;
        }
    }

    public getSize(): number {
        return this.currentElementCount;
    }

    public clear(): void {
        this.currentElementCount = 0;
        this.dataList = [];
    }

    public validate(): void {
        print("FloatArrayWrapper: DEBUG LENGTH = " + this.dataList.length);
    }

    public getSizeInBytes(): number {
        if (this.dataList[0]) {
            return this.currentElementCount * this.dataList[0].BYTES_PER_ELEMENT;
        } else {
            return 0;
        }
    }
}

// Helper function from original JS
export function getFloatArrayWithIncreasingSequence(arrSize: number): Float32Array {
    const arr = new Float32Array(arrSize);
    for (let i = 0; i < arrSize; i++) {
        arr[i] = i;
    }
    return arr;
}