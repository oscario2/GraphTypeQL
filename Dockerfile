FROM denoland/deno:1.11.2

WORKDIR /graphql

USER deno

# cache dependencies
COPY deps.ts .
RUN deno cache deps.ts

# these steps will be re-run upon each file change in your working directory:
COPY deps.ts .
ADD . .

# compile the main app so that it doesn't need to be compiled each startup/entry.
RUN deno cache tests/graphql.test.ts

# run
CMD ["run", "--allow-read", "-c", "tsconfig.json", "tests/graphql.test.ts"]