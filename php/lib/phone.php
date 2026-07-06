<?php

/**
 * Normalize phone numbers for comparison (digits only).
 */
function uln_phone_digits(string $phone): string
{
    return preg_replace('/\D+/', '', $phone);
}

/**
 * Compare two phone values — matches full digits or last 9 (Uganda-local flexibility).
 */
function uln_phones_match(string $stored, string $provided): bool
{
    $a = uln_phone_digits($stored);
    $b = uln_phone_digits($provided);

    if ($a === '' || $b === '') {
        return false;
    }

    if ($a === $b) {
        return true;
    }

    $tail = 9;
    if (strlen($a) >= $tail && strlen($b) >= $tail) {
        return substr($a, -$tail) === substr($b, -$tail);
    }

    return false;
}
