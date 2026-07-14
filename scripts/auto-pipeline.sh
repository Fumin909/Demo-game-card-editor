#!/usr/bin/env bash
set -uo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

count_matches() {
  local output
  output=$(echo "$1" | grep -cE "$2" 2>/dev/null) || true
  echo "${output:-0}" | head -1 | tr -d '[:space:]'
}

extract_num() {
  local val
  val=$(echo "$1" | grep -oE '[0-9]+' 2>/dev/null | head -1) || true
  echo "${val:-0}" | tr -d '[:space:]'
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")

if [ -z "$CURRENT_BRANCH" ]; then
  log_error "Not in a git repository."
  exit 1
fi

log_info "Current branch: $CURRENT_BRANCH"
echo ""

if ! git diff --quiet --cached 2>/dev/null || ! git diff --quiet 2>/dev/null || [ -n "$(git ls-files --others --exclude-standard 2>/dev/null)" ]; then
  HAS_CHANGES=true
else
  HAS_CHANGES=false
fi

if [ "$HAS_CHANGES" = false ]; then
  log_warn "No changes to commit. Nothing to do."
  exit 0
fi

# ============================================================
# Step 1: Code Formatting (Prettier)
# ============================================================
log_info "Step 1/4: Formatting code with Prettier..."
echo ""

npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,css,md}" 2>&1 || {
  log_error "Prettier formatting failed:"
  npx prettier --check "src/**/*.{ts,tsx,js,jsx,json,css,md}" 2>&1 || true
  echo ""
  log_error "Pipeline terminated: code formatting errors must be fixed before committing."
  exit 1
}

log_success "Code formatting completed."
echo ""

# ============================================================
# Step 2: TypeScript Type Check
# ============================================================
log_info "Step 2/4: Running TypeScript type check..."
echo ""

TYPECHECK_LOG=$(npx tsc --noEmit 2>&1) || {
  log_error "TypeScript type check failed:"
  echo "$TYPECHECK_LOG"
  echo ""
  log_error "Pipeline terminated: type errors must be fixed before committing."
  exit 1
}

log_success "TypeScript type check passed."
echo ""

# ============================================================
# Step 3: Build Verification
# ============================================================
log_info "Step 3/4: Running build verification..."
echo ""

BUILD_LOG=$(npm run build 2>&1) || {
  log_error "Build failed:"
  echo "$BUILD_LOG"
  echo ""
  log_error "Pipeline terminated: build errors must be fixed before committing."
  exit 1
}

log_success "Build verification passed."
echo ""

# ============================================================
# Step 4: Auto-generate commit message and commit + push
# ============================================================
log_info "Step 4/4: Staging changes, generating commit message, and pushing..."
echo ""

git add -A

STAGED_DIFF=$(git diff --cached --stat 2>&1)
FULL_DIFF=$(git diff --cached 2>&1)

FILES_ADDED=$(count_matches "$STAGED_DIFF" 'create mode')
FILES_DELETED=$(count_matches "$STAGED_DIFF" 'delete mode')
FILES_CHANGED=$(count_matches "$STAGED_DIFF" '^\s*[a-zA-Z0-9/_.-]+\s+\|')
ADDED_LINES=$(extract_num "$(echo "$STAGED_DIFF" | tail -1 | grep -oE '[0-9]+ insertion' 2>/dev/null || echo 0)")
DELETED_LINES=$(extract_num "$(echo "$STAGED_DIFF" | tail -1 | grep -oE '[0-9]+ deletion' 2>/dev/null || echo 0)")

detect_type() {
  local diff="$1"

  if echo "$diff" | grep -qiE 'fix|bug|error|crash|issue|problem|broken|patch|hotfix|修复|修正'; then
    echo "fix"
    return
  fi

  if echo "$diff" | grep -qiE 'refactor|refactoring|重构|整理|cleanup|clean up'; then
    echo "refactor"
    return
  fi

  if echo "$diff" | grep -qiE 'style|format|prettier|css|layout|ui|样式|格式'; then
    echo "style"
    return
  fi

  if echo "$diff" | grep -qiE 'test|spec|jest|vitest|测试'; then
    echo "test"
    return
  fi

  if echo "$diff" | grep -qiE 'docs|document|readme|md|文档|说明'; then
    echo "docs"
    return
  fi

  if echo "$diff" | grep -qiE 'chore|build|ci|config|deps|dependency|package|配置|构建|依赖|pipeline|脚本|script'; then
    echo "chore"
    return
  fi

  if echo "$diff" | grep -qiE 'perf|performance|optim|性能|优化'; then
    echo "perf"
    return
  fi

  if echo "$diff" | grep -qiE 'feat|feature|add|新增|功能|新增功能|implement|support'; then
    echo "feat"
    return
  fi

  echo "feat"
}

detect_scope() {
  local diff="$1"

  if echo "$diff" | grep -qiE 'canvas|konva|画布|图层|layer'; then
    echo "canvas"
    return
  fi

  if echo "$diff" | grep -qiE 'store|zustand|状态'; then
    echo "store"
    return
  fi

  if echo "$diff" | grep -qiE 'db|dexie|storage|persist|存储|数据'; then
    echo "db"
    return
  fi

  if echo "$diff" | grep -qiE 'component|layout|panel|toolbar|sidebar|组件|布局|面板|dialog'; then
    echo "ui"
    return
  fi

  if echo "$diff" | grep -qiE 'project|card|template|asset|项目|卡牌|模板|素材'; then
    echo "editor"
    return
  fi

  if echo "$diff" | grep -qiE 'export|导出|png'; then
    echo "export"
    return
  fi

  if echo "$diff" | grep -qiE 'undo|redo|history'; then
    echo "history"
    return
  fi

  if echo "$diff" | grep -qiE 'config|build|vite|tsconfig|prettier|gitignore|package'; then
    echo "config"
    return
  fi

  echo "core"
}

generate_description() {
  local added="$1"
  local deleted="$2"
  local files_added="$3"
  local files_deleted="$4"
  local files_changed="$5"

  local parts=()

  if [ "$files_added" -gt 0 ]; then
    parts+=("新增 ${files_added} 个文件")
  fi
  if [ "$files_deleted" -gt 0 ]; then
    parts+=("删除 ${files_deleted} 个文件")
  fi

  local modified=$((files_changed - files_added - files_deleted))
  if [ "$modified" -lt 0 ]; then modified=0; fi
  if [ "$modified" -gt 0 ]; then
    parts+=("修改 ${modified} 个文件")
  fi

  local detail="+${added}/-${deleted}"

  if [ ${#parts[@]} -eq 0 ]; then
    echo "更新代码 (${detail})"
  else
    local IFS='，'
    echo "${parts[*]} (${detail})"
  fi
}

COMMIT_TYPE=$(detect_type "$FULL_DIFF")
COMMIT_SCOPE=$(detect_scope "$FULL_DIFF")
COMMIT_DESC=$(generate_description "$ADDED_LINES" "$DELETED_LINES" "$FILES_ADDED" "$FILES_DELETED" "$FILES_CHANGED")

COMMIT_MSG="${COMMIT_TYPE}(${COMMIT_SCOPE}): ${COMMIT_DESC}"

log_info "Generated commit message:"
echo -e "  ${GREEN}${COMMIT_MSG}${NC}"
echo ""

git commit -m "$COMMIT_MSG"

log_success "Commit created successfully."
echo ""

log_info "Pushing to origin/${CURRENT_BRANCH}..."
echo ""

PUSH_LOG=$(git push origin "$CURRENT_BRANCH" 2>&1) || {
  log_error "Push failed:"
  echo "$PUSH_LOG"
  echo ""
  log_warn "Commit was created locally but could not be pushed. You can push manually with: git push origin $CURRENT_BRANCH"
  exit 1
}

echo "$PUSH_LOG"
echo ""
log_success "Pipeline completed successfully!"
log_success "Changes have been formatted, tested, committed, and pushed to origin/${CURRENT_BRANCH}."
