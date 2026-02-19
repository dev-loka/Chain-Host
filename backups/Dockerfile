FROM alpine:3.20

RUN apk add --no-cache \
    postgresql16-client \
    bash \
    curl \
    openssl \
    gzip \
    && rm -rf /var/cache/apk/*

COPY backup.sh /usr/local/bin/backup.sh
RUN chmod +x /usr/local/bin/backup.sh

# Run as non-root
RUN adduser -D -u 1001 backup
USER backup

CMD ["sh", "-c", "echo 'Backup service ready. Schedule: ${BACKUP_SCHEDULE}' && crond -f -l 2"]
