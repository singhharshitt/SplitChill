FROM docker:29-dind

RUN addgroup -g 1000 -S jenkins 2>/dev/null || true

COPY docker/jenkins-dind/entrypoint.sh /usr/local/bin/splitchill-dind-entrypoint
RUN chmod +x /usr/local/bin/splitchill-dind-entrypoint

ENTRYPOINT ["/usr/local/bin/splitchill-dind-entrypoint"]
