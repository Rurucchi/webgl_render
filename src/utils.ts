export function Assert(condition: boolean, message: string) {
  if (__DEBUG__) {
    if (!condition) {
      console.trace(message);
    }
  }
}

export function isPowerOf2(value: number) {
  return (value & (value - 1)) === 0;
}

export function degToRad(number: number) {
  return (number * Math.PI) / 180;
}

export function scaleFloat(scale: number, float: number) {
  return float * scale;
}
