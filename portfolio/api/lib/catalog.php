<?php
/**
 * Template catalog — folder name is the stable ID; titles live in catalog.json.
 */

function uln_portfolio_dir(): string
{
    return realpath(__DIR__ . '/../../portfolio') ?: (__DIR__ . '/../../portfolio');
}

function uln_catalog_path(): string
{
    return uln_portfolio_dir() . '/catalog.json';
}

/**
 * @return array<string, array{title?:string,description?:string,category?:string,aliases?:string[]}>
 */
function uln_load_catalog(): array
{
    static $cache = null;
    if ($cache !== null) {
        return $cache;
    }

    $path = uln_catalog_path();
    if (!is_file($path)) {
        $cache = [];
        return $cache;
    }

    $raw = file_get_contents($path);
    $data = json_decode($raw ?: '[]', true);
    $cache = is_array($data) ? $data : [];
    return $cache;
}

/**
 * Resolve a request slug (folder id or human alias) to the canonical folder name.
 */
function uln_resolve_template_id(string $slug): ?string
{
    $slug = trim($slug);
    if ($slug === '' || str_contains($slug, '..') || str_contains($slug, '/') || str_contains($slug, '\\')) {
        return null;
    }

    $dir = uln_portfolio_dir();
    if (is_dir($dir . '/' . $slug)) {
        return $slug;
    }

    $catalog = uln_load_catalog();
    $needle = mb_strtolower($slug);

    foreach ($catalog as $id => $meta) {
        if (!is_array($meta)) {
            continue;
        }
        if (mb_strtolower((string) $id) === $needle) {
            return is_dir($dir . '/' . $id) ? $id : null;
        }
        if (isset($meta['title']) && mb_strtolower((string) $meta['title']) === $needle) {
            return is_dir($dir . '/' . $id) ? $id : null;
        }
        foreach ($meta['aliases'] ?? [] as $alias) {
            if (mb_strtolower((string) $alias) === $needle) {
                return is_dir($dir . '/' . $id) ? $id : null;
            }
        }
    }

    return null;
}

/**
 * @return array{title:string,description:string,category:?string}
 */
function uln_template_meta(string $folderId): array
{
    $catalog = uln_load_catalog();
    $meta = $catalog[$folderId] ?? [];

    $fallbackTitle = ucwords(str_replace(['-', '_', '.webflow.io', '-template'], ' ', $folderId));
    $fallbackTitle = preg_replace('/\s+/', ' ', trim($fallbackTitle)) ?: $folderId;

    return [
        'title' => trim((string) ($meta['title'] ?? '')) !== '' ? (string) $meta['title'] : $fallbackTitle,
        'description' => trim((string) ($meta['description'] ?? '')) !== ''
            ? (string) $meta['description']
            : 'A professionally designed template.',
        'category' => isset($meta['category']) ? (string) $meta['category'] : null,
    ];
}
