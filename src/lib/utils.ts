type ClassValue = string | number | null | false | undefined | Record<string, boolean>;

export function cn(...values: ClassValue[]): string {
  const classes: string[] = [];
  values.forEach((value) => {
    if (!value) {
      return;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      classes.push(String(value));
      return;
    }
    if (typeof value === 'object') {
      Object.entries(value).forEach(([key, active]) => {
        if (active) {
          classes.push(key);
        }
      });
    }
  });
  return classes.join(' ');
}
