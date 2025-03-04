declare module './model.js' {
  export function loadAndPredict(text: string): Promise<number>;
} 