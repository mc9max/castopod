# MariaDB — database companion for Castopod
#
# The mariadb:12.1 image's entrypoint runs as root initially,
# chowns /var/lib/mysql to the mysql user, then drops to mysql.
# This handles the root-owned Railway volume automatically —
# no wrapper needed.
#
# Reference: https://hub.docker.com/_/mariadb
FROM mariadb:12.1

EXPOSE 3306
