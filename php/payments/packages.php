<?php

/**
 * Website package pricing — server-side source of truth for deposits.
 */
function uln_packages(): array
{
    return [
        'basic' => [
            'title' => 'Basic Launch Package',
            'price_ugx' => 250000,
            'deposit_ugx' => 50000,
            'badge' => null,
        ],
        'smart' => [
            'title' => 'Start Smart Package',
            'price_ugx' => 400000,
            'deposit_ugx' => 80000,
            'badge' => 'popular',
        ],
        'premium' => [
            'title' => 'Premium Growth Package',
            'price_ugx' => 700000,
            'deposit_ugx' => 140000,
            'badge' => 'best-value',
        ],
    ];
}

function uln_package_or_fail(string $packageId): array
{
    $packages = uln_packages();
    if (!isset($packages[$packageId])) {
        throw new InvalidArgumentException('Invalid package selected.');
    }

    return $packages[$packageId];
}

function uln_format_ugx(int $amount): string
{
    return 'UGX ' . number_format($amount);
}
