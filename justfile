# Default recipe - list available commands
_default:
    @just --list

# Install dependencies
install:
    bun install

# Run in development mode
dev:
    bun run dev

# Build for production
build:
    bun run build

# Package for distribution
package: build
    bun run package

# Clean build artifacts
clean:
    rm -rf dist node_modules bun.lockb

# Clean and reinstall
reinstall: clean install

# Check for outdated packages
outdated:
    bun outdated

# Update all dependencies
update:
    bun update

# Type check
typecheck:
    bunx tsc --noEmit

# Run tests
test:
    bun run test

# Run tests in watch mode
test-watch:
    bun run test:watch

# Run tests with coverage
test-coverage:
    bun run test:coverage

# Kill any running electron processes
kill:
    pkill -f "electron" || true

# Restart dev server
restart: kill dev

# Bump version, tag, and push (triggers GitHub Actions release). Usage: just release major|minor|patch
release bump:
    #!/usr/bin/env bash
    set -euo pipefail
    next=$(svu {{ bump }})
    echo "Releasing ${next}"
    git tag -a "${next}" -m "Release ${next}"
    git push origin "${next}"
