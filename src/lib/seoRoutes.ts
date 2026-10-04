export const siteUrl = 'https://www.mylightartgallery.com';
export const languagePairs = [
  ['/', '/en/'],
  ['/exhibitions', '/en/exhibitions'],
  ['/contacto', '/en/contact'],
  ['/newsletter', '/en/newsletter'],
  ['/aviso-privacidad', '/en/privacy'],
  ['/es/condiciones-generales-de-uso', '/en/terms-and-conditions'],
  ['/es/politica-de-devoluciones', '/en/return-policy'],
  ['/es/garantias-y-autenticidad', '/en/warranties-and-authenticity'],
  ['/es/impuestos-texas', '/en/texas-taxes'],
] as const;

export const escapeXml = (value: string) => value.replace(/[<>&"']/g, char => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
})[char]!);
