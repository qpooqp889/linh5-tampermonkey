cd "C:\Users\twric\Downloads\game-monitor-panel"

# Check status
Write-Output "=== Git Status ==="
git status -s

# Add all new and modified files
Write-Output "`n=== Adding files ==="
git add "封包相關.md"
git add skills/
git add game-monitor.js
git add CHANGELOG.md 2>$null

Write-Output "`n=== Files staged ==="
git status -s

# Commit
Write-Output "`n=== Committing ==="
git commit -m "v2.02: Add 封包相關.md + skills/ (sio-hook, monitor-state, send-packet)

- 封包相關.md: 完整 Socket.IO + WebSocket 雙通道技術文件
- skills/wb-sio-hook.md: SIO Hook 安裝教學
- skills/wb-monitor-state.md: state 事件監聽
- skills/wb-send-packet.md: 統一發送封包介面
- game-monitor.js: v2.02 (WebSocket close-state 保護 + SIO emit)

Total: 10,289 bytes 封包文件 + 13,015 bytes skills"

Write-Output "`n=== Latest commits ==="
git log --oneline -5
