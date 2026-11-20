<?php

$roots = array_slice($argv, 1) ?: ['app', 'bootstrap', 'config', 'database', 'routes', 'tests', 'public/index.php'];
$changed = 0;

foreach ($roots as $root) {
    $paths = is_file($root) ? [$root] : iterator_to_array(new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS)));
    foreach ($paths as $path) {
        $path = (string) $path;
        if (! str_ends_with($path, '.php') || str_contains($path, '/cache/')) {
            continue;
        }
        $before = file_get_contents($path);
        $after = '';
        foreach (token_get_all($before) as $token) {
            if (is_array($token) && in_array($token[0], [T_COMMENT, T_DOC_COMMENT], true)) {
                continue;
            }
            $after .= is_array($token) ? $token[1] : $token;
        }
        $after = preg_replace("/[ \t]+\n/", "\n", $after);
        $after = preg_replace("/\n{3,}/", "\n\n", $after);
        if ($after !== $before) {
            file_put_contents($path, $after);
            $changed++;
        }
    }
}

echo "Comments removed from {$changed} file(s).\n";
