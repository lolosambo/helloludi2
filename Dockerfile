FROM php:8.2-apache

# Install required dependencies
RUN apt-get update && apt-get install -y \
    git \
    nano \
    unzip \
    libicu-dev \
    libonig-dev \
    libzip-dev \
    zlib1g-dev \
    && docker-php-ext-install intl pdo_mysql zip

# Enable Apache mod_rewrite for Symfony
RUN a2enmod rewrite

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Expose port 80
EXPOSE 80