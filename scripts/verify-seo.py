#!/usr/bin/env python3
"""Check the public HTML and HTTP behavior of a local or preview deployment."""
import argparse
import json
import subprocess
import os
from email.parser import Parser
from html.parser import HTMLParser
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET

class Page(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.h1 = 0
        self.images = []
        self.links = []
        self.meta = {}
        self.schema = []
        self.schema_text = None
        self.feed(html)
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'h1': self.h1 += 1
        if tag == 'img': self.images.append(attrs)
        if tag == 'link': self.links.append(attrs)
        if tag == 'meta': self.meta[attrs.get('name', attrs.get('property'))] = attrs.get('content')
        if tag == 'script' and attrs.get('type') == 'application/ld+json': self.schema_text = ''
    def handle_data(self, data):
        if self.schema_text is not None: self.schema_text += data
    def handle_endtag(self, tag):
        if tag == 'script' and self.schema_text is not None:
            self.schema.append(json.loads(self.schema_text))
            self.schema_text = None

USE_VERCEL = False

def fetch(base, path):
    if USE_VERCEL:
        result = subprocess.run(['vercel', 'curl', path, '--deployment', base, '--', '--silent', '--show-error', '--max-time', '60', '--include'], capture_output=True, text=True, check=True)
        # Parse response headers without displaying protection bypass cookies.
        raw = result.stdout.replace('\r\n', '\n')
        head, body = raw.split('\n\n', 1)
        while body.startswith('HTTP/'):
            head, body = body.split('\n\n', 1)
        return int(head.splitlines()[0].split()[1]), Parser().parsestr('\n'.join(head.splitlines()[1:])), body
    try:
        response = urllib.request.urlopen(base + path, timeout=60)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        return response.status, response.headers, response.read().decode()

def verify(base, preview=False):
    status, headers, xml = fetch(base, '/sitemap.xml')
    assert status == 200
    root = ET.fromstring(xml)
    ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9', 'x': 'http://www.w3.org/1999/xhtml', 'i': 'http://www.google.com/schemas/sitemap-image/1.1'}
    entries = root.findall('s:url', ns)
    urls = [entry.find('s:loc', ns).text for entry in entries]
    assert len(urls) == len(set(urls))
    assert all(url.startswith('https://www.mylightartgallery.com/') for url in urls)
    artworks = [url for url in urls if '/obras/' in url]
    assert artworks, 'Artwork pages missing from sitemap'
    for entry in entries:
        assert len(entry.findall('x:link', ns)) == 3
        if '/obras/' in entry.find('s:loc', ns).text:
            assert entry.find('i:image/i:loc', ns) is not None
    paths = ['/', '/en/', '/exhibitions', '/en/exhibitions', '/exhibitions?page=2', '/contacto', '/en/contact', '/es/condiciones-generales-de-uso', '/en/terms-and-conditions', '/newsletter', '/en/newsletter', '/aviso-privacidad', '/en/privacy', '/es/politica-de-devoluciones', '/en/return-policy', '/es/garantias-y-autenticidad', '/en/warranties-and-authenticity', '/es/impuestos-texas', '/en/texas-taxes']
    artwork = urllib.parse.urlsplit(artworks[0]).path
    paths.extend([artwork, artwork.replace('/obras/', '/en/works/')])
    optimized_images = set()
    for path in paths:
        status, headers, html = fetch(base, path)
        assert status == 200, (path, status)
        page = Page(html)
        assert page.h1 == 1, (path, 'Expected one H1', page.h1)
        assert page.meta.get('description'), (path, 'Missing description')
        canonical = next(link['href'] for link in page.links if link.get('rel') == 'canonical')
        expected = 'https://www.mylightartgallery.com' + path
        assert canonical == expected, (path, canonical)
        alternates = [link for link in page.links if link.get('hreflang')]
        assert {link['hreflang'] for link in alternates} == {'es', 'en', 'x-default'}
        assert all(base not in link['href'] or base == 'https://www.mylightartgallery.com' for link in alternates)
        assert 'footer-keywords' not in html
        assert len([item for item in page.schema if item.get('@type') == 'ArtGallery']) == 1
        if '/obras/' in path or '/works/' in path:
            assert len([item for item in page.schema if item.get('@type') == 'VisualArtwork']) == 1
        if path in ['/', artwork]:
            optimized_images.update(image['src'] for image in page.images[:2] if image.get('src'))
        for image in page.images:
            if image.get('src'):
                assert image.get('width') and image.get('height') and image.get('srcset'), (path, image)
                assert 'alt' in image
        if preview:
            assert 'noindex' in headers.get('X-Robots-Tag', '')
            assert 'noindex' in page.meta.get('robots', '')
        print('PASS', path)
    if USE_VERCEL:
        for image in sorted(optimized_images):
            result = subprocess.run(['vercel', 'curl', image, '--deployment', base, '--', '--silent', '--show-error', '--header', 'Accept: image/webp', '--output', os.devnull, '--write-out', '%{http_code} %{content_type}'], capture_output=True, text=True, check=True)
            assert result.stdout.startswith('200 image/webp'), ('Image optimization failed', result.stdout)
        print('PASS optimized local and remote images return WebP')
    for path in ['/obras/not-a-real-artwork-xyz', '/en/works/not-a-real-artwork-xyz', '/not-a-real-page-xyz']:
        status, headers, html = fetch(base, path)
        assert status == 404, (path, status)
        assert 'noindex' in Page(html).meta.get('robots', '')
        assert 'noindex' in headers.get('X-Robots-Tag', '')
        print('PASS', path, '404')
    status, headers, robots = fetch(base, '/robots.txt')
    assert status == 200
    assert ('Disallow: /\n' in robots) if preview else ('Sitemap: https://www.mylightartgallery.com/sitemap.xml' in robots)
    print('PASS robots and sitemap:', len(urls), 'URLs,', len(artworks), 'artworks in each language')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('base', nargs='?', default='http://127.0.0.1:4321')
    parser.add_argument('--preview', action='store_true')
    parser.add_argument('--vercel', action='store_true', help='Use Vercel CLI to access protected previews')
    args = parser.parse_args()
    USE_VERCEL = args.vercel
    verify(args.base.rstrip('/'), args.preview)
