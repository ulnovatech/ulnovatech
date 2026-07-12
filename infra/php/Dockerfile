# PHP 8.2 FPM for ulnovatech public_html (mysqli + PDO MySQL)
FROM php:8.2-fpm-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    libzip-dev \
    libonig-dev \
    && docker-php-ext-install mysqli pdo_mysql mbstring \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/public_html

# Allow env vars from Docker into PHP (php/.env still preferred)
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" \
    && { \
      echo 'upload_max_filesize=32M'; \
      echo 'post_max_size=32M'; \
      echo 'memory_limit=256M'; \
      echo 'expose_php=Off'; \
    } >> "$PHP_INI_DIR/conf.d/ulnovatech.ini"
