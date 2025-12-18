export function Assert(condition: boolean, message: string) {
  if(__DEBUG__) {
    if(!condition) {
      console.trace(message);
    }
  }
}