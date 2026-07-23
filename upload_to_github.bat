@echo off
chcp 65001 > nul
title 치지직 추첨기 - GitHub 자동 업로드
python "%~dp0upload_to_github.py"
pause
