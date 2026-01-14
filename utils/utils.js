export function getRandomItems(arr, count = 10) {
  const result = [];
  const usedIndices = new Set();
  const max = Math.min(count, arr.length);

  while (result.length < max) {
    const index = Math.floor(Math.random() * arr.length);
    if (!usedIndices.has(index)) {
      usedIndices.add(index);
      result.push(arr[index]);
    }
  }

  return result;
}
