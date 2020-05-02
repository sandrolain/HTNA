export function camelCase (str: string): string {
  return str.replace(/-\D/g, function (m: string): string {
    return m.charAt(1).toUpperCase();
  });
}
