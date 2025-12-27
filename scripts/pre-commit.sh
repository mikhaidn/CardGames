#!/bin/bash
#
# Pre-commit validation script
# Runs quick checks before committing to catch common issues
#
# To use automatically, run: npm run setup-hooks
# Or manually: ln -s ../../scripts/pre-commit.sh .git/hooks/pre-commit
#

set -e  # Exit on first error

echo "🔍 Running pre-commit checks..."

# 1. Format check (fastest)
echo "  ✓ Format checking..."
npx prettier --check . > /dev/null 2>&1 || {
  echo ""
  echo "  ✗ Format errors found"
  echo ""
  echo "💡 Quick fix: Run 'npm run format' to auto-fix formatting issues"
  echo ""
  exit 1
}

# 2. TypeScript type checking (fastest check, no compilation)
echo "  ✓ Type checking..."
npx tsc --noEmit -p klondike-mvp/tsconfig.json > /dev/null 2>&1 || {
  echo "  ✗ TypeScript errors in klondike-mvp"
  npx tsc --noEmit -p klondike-mvp/tsconfig.json
  exit 1
}
npx tsc --noEmit -p freecell-mvp/tsconfig.json > /dev/null 2>&1 || {
  echo "  ✗ TypeScript errors in freecell-mvp"
  npx tsc --noEmit -p freecell-mvp/tsconfig.json
  exit 1
}

# 3. Linting (catches unused vars, style issues)
echo "  ✓ Linting..."
npm run lint -ws --if-present > /dev/null 2>&1 || {
  echo ""
  echo "  ✗ Lint errors found"
  echo ""
  npm run lint -ws --if-present
  echo ""
  echo "💡 Quick fix: Run 'npm run lint:fix' to auto-fix most issues"
  echo ""
  exit 1
}

# 4. Tests (optional - comment out if too slow)
# echo "  ✓ Testing..."
# npm test > /dev/null 2>&1 || {
#   echo "  ✗ Tests failed"
#   npm test
#   exit 1
# }

echo "✅ All checks passed! Proceeding with commit..."
